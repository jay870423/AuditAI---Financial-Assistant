import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AuditAnalysisResult, ChatMessage, ModelProvider, AuditScenario } from "../types";
import { Language } from "../i18n";

// Ensure we don't crash if env is missing during initial load
const apiKey = process.env.API_KEY || 'MISSING_API_KEY';
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY || '';
const openAiApiKey = process.env.OPENAI_API_KEY || '';
const qwenApiKey = process.env.DASHSCOPE_API_KEY || '';

// Determine Base URL for Gemini
// Critical for China access: Use '/gemini-api' (Vercel Rewrite) when running in browser.
// The SDK will append /v1beta/models/... to this base.
const geminiBaseUrl = process.env.GEMINI_BASE_URL || (typeof window !== 'undefined' ? '/gemini-api' : undefined);

// Initialize the SDK with the proxy baseUrl
const ai = new GoogleGenAI({ 
  apiKey,
  baseUrl: geminiBaseUrl
} as any); // Type cast to 'any' to avoid TS errors if the type definition is strict, though the SDK supports it.

// Helper to convert Blob/File to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to convert Blob/File to full Data URL (for OpenAI/Qwen)
const fileToDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Generic OpenAI Compatible Caller (DeepSeek, GPT, Qwen) ---

interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  providerName: string;
  jsonMode?: boolean;
}

const callOpenAICompatible = async (
  messages: any[], 
  systemInstruction: string | undefined, 
  config: OpenAIConfig,
  onChunk?: (text: string) => void
) => {
  if (!config.apiKey) {
    throw new Error(`${config.providerName} API Key is missing. Please check your environment variables.`);
  }

  const isStreaming = !!onChunk;

  const payload: any = {
    model: config.model,
    messages: [
      ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
      ...messages
    ],
    stream: isStreaming,
    temperature: 0.0 // Low temperature for analytical tasks
  };

  if (config.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${config.providerName} API Error: ${response.status} - ${errorText}`);
  }

  // Handle Streaming Response
  if (isStreaming && onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === "data: [DONE]") continue;
        
        if (trimmedLine.startsWith("data: ")) {
          try {
            const jsonStr = trimmedLine.replace("data: ", "");
            const json = JSON.parse(jsonStr);
            const deltaContent = json.choices?.[0]?.delta?.content || "";
            if (deltaContent) {
              accumulatedText += deltaContent;
              onChunk(accumulatedText);
            }
          } catch (e) {
            console.warn("Error parsing stream chunk", e);
          }
        }
      }
    }
    return accumulatedText;
  }

  // Handle Standard Response
  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

// --- Configuration Helper ---

const getProviderConfig = (provider: ModelProvider, jsonMode: boolean = false): OpenAIConfig | null => {
  switch (provider) {
    case 'deepseek':
      // DeepSeek supports China natively
      return {
        apiKey: deepSeekApiKey,
        baseUrl: "https://api.deepseek.com/chat/completions",
        model: "deepseek-chat",
        providerName: "DeepSeek",
        jsonMode
      };
    case 'gpt':
      // Use Proxy URL if set, otherwise default. Use Vercel rewrite /openai-api if env not set but in browser.
      const gptBase = process.env.OPENAI_BASE_URL || (typeof window !== 'undefined' ? '/openai-api/v1/chat/completions' : "https://api.openai.com/v1/chat/completions");
      return {
        apiKey: openAiApiKey,
        baseUrl: gptBase,
        model: "gpt-4o",
        providerName: "OpenAI (GPT-4o)",
        jsonMode
      };
    case 'qwen':
      // Qwen (Aliyun) supports China natively
      return {
        apiKey: qwenApiKey,
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        model: "qwen-max", // Or qwen-plus
        providerName: "Qwen (DashScope)",
        jsonMode
      };
    default:
      return null;
  }
};

/**
 * Gets specialized system instructions based on the scenario
 */
const getScenarioInstruction = (scenario: AuditScenario, langInstruction: string): string => {
  const base = `You are a professional auditor. Output language: ${langInstruction}.`;
  switch (scenario) {
    case 'fraud':
      return `${base} Focus heavily on FRAUD DETECTION. Look for round number anomalies, weekend transactions, duplicate payments, and Benford's Law violations. Be suspicious.`;
    case 'tax':
      return `${base} Focus on TAX COMPLIANCE. Identify non-deductible expenses, VAT/GST issues, and verify if transaction categories align with standard tax codes.`;
    case 'compliance':
      return `${base} Focus on INTERNAL CONTROLS and POLICY COMPLIANCE. Flag unauthorized spending patterns, split transactions (to avoid approval limits), and lack of descriptions.`;
    case 'general':
    default:
      return `${base} Provide a balanced financial overview, identifying general anomalies and trends.`;
  }
};

/**
 * Analyzes financial text or CSV data using Gemini, DeepSeek, GPT, or Qwen.
 */
export const analyzeFinancialData = async (data: string, provider: ModelProvider = 'gemini', language: Language = 'en', scenario: AuditScenario = 'general'): Promise<AuditAnalysisResult> => {
  const langInstruction = language === 'zh' ? 'Simplified Chinese (zh-CN)' : 'English';
  
  const systemInstruction = getScenarioInstruction(scenario, langInstruction);
  
  const promptText = `
    Analyze the following financial text/CSV data.
    Data:
    ${data}

    Output must be valid JSON matching this structure. 
    IMPORTANT: The values for 'summary', 'description', 'recommendation', 'label', 'category', 'change' MUST be in ${langInstruction}.
    The keys (e.g., 'summary', 'risks', 'severity') must remain in English.
    The 'severity' value must be exactly one of: "high", "medium", "low".

    JSON Structure:
    {
      "summary": "string",
      "risks": [{"severity": "high|medium|low", "description": "string", "recommendation": "string"}],
      "keyMetrics": [{"label": "string", "value": "string", "change": "string (optional)"}],
      "chartData": [{"category": "string", "value": number}]
    }
  `;

  // --- OpenAI Compatible Implementation (DeepSeek, GPT, Qwen) ---
  const config = getProviderConfig(provider, true);
  if (config) {
    try {
      const resultText = await callOpenAICompatible(
        [{ role: "user", content: promptText }],
        systemInstruction,
        config
      );
      // Clean up markdown code blocks if present (sometimes models wrap JSON in ```json ... ```)
      const cleanText = resultText.replace(/```json\n?|\n?```/g, '');
      return JSON.parse(cleanText) as AuditAnalysisResult;
    } catch (error) {
      console.error(`${config.providerName} Audit Error:`, error);
      throw error;
    }
  }

  // --- Gemini Implementation ---
  const model = "gemini-3-flash-preview";
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: `A professional executive summary in ${langInstruction}.` },
      risks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING, enum: ["high", "medium", "low"] },
            description: { type: Type.STRING, description: `Risk description in ${langInstruction}.` },
            recommendation: { type: Type.STRING, description: `Recommendation in ${langInstruction}.` },
          },
          required: ["severity", "description", "recommendation"]
        }
      },
      keyMetrics: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING, description: `Metric label in ${langInstruction}.` },
            value: { type: Type.STRING },
            change: { type: Type.STRING, description: `Percentage change or trend description in ${langInstruction}.` }
          },
          required: ["label", "value"]
        }
      },
      chartData: {
        type: Type.ARRAY,
        description: "Data for a bar or pie chart representing expenses or revenue breakdown.",
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: `Category name in ${langInstruction}.` },
            value: { type: Type.NUMBER }
          },
          required: ["category", "value"]
        }
      }
    },
    required: ["summary", "risks", "keyMetrics"]
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: systemInstruction,
      }
    });

    if (result.text) {
      return JSON.parse(result.text) as AuditAnalysisResult;
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Audit Error:", error);
    throw error;
  }
};

/**
 * Analyzes an image (Receipt/Invoice) or PDF.
 */
export const analyzeReceiptImage = async (file: File, provider: ModelProvider = 'gemini', language: Language = 'en', scenario: AuditScenario = 'general'): Promise<string> => {
  const langInstruction = language === 'zh' ? 'Simplified Chinese (zh-CN)' : 'English';
  
  let scenarioPrompt = "";
  switch (scenario) {
    case 'fraud':
      scenarioPrompt = "SCRUTINIZE this document for FORGERY. Check for mismatched fonts, alignment issues, altered numbers, or fake business details. Report any sign of digital manipulation.";
      break;
    case 'tax':
      scenarioPrompt = "Extract all TAX RELEVANT details: Tax ID (TIN/VAT), Tax Amount, Tax Rate, and Total. Determine if this constitutes a valid tax invoice for deduction purposes.";
      break;
    case 'compliance':
      scenarioPrompt = "Review this contract/invoice for LEGAL & COMPLIANCE. Check for signatures, clear terms, dates, and authorized parties. Identify missing mandatory fields.";
      break;
    default:
      scenarioPrompt = "Identify the Vendor, Date, Total Amount, and categorize the expense.";
      break;
  }

  const prompt = `
    Perform a forensic audit on this document.
    Scenario Mode: ${scenario.toUpperCase()}
    
    Tasks:
    1. ${scenarioPrompt}
    2. Provide a summary of findings.
    3. Highlight specific risks based on the Scenario Mode.
    
    Format the output in clear Markdown in ${langInstruction}.
  `;

  // --- GPT & Qwen (Vision Supported) ---
  if (provider === 'gpt' || provider === 'qwen') {
    const config = getProviderConfig(provider);
    if (config) {
      if (provider === 'qwen') config.model = 'qwen-vl-max'; 
      try {
        const dataUrl = await fileToDataUrl(file);
        const messages = [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          }
        ];
        return await callOpenAICompatible(messages, undefined, config);
      } catch (error) {
        console.error(`${config.providerName} Vision Error:`, error);
        throw error;
      }
    }
  }

  // --- Fallback / Gemini ---
  const prefix = (provider === 'deepseek') 
    ? "**Note:** DeepSeek text model does not support image/document analysis. Switching to Gemini 3 Flash.\n\n" 
    : "";
  
  const model = "gemini-3-flash-preview"; 
  const filePart = await fileToGenerativePart(file);
  
  try {
    const result = await ai.models.generateContent({
      model,
      contents: {
        parts: [filePart, { text: prompt }]
      }
    });
    return prefix + (result.text || "No analysis generated.");
  } catch (error) {
    console.error("Document Analysis Error:", error);
    throw error;
  }
};

/**
 * Chat functionality for financial context with streaming support.
 */
export const sendChatMessage = async (
  history: ChatMessage[], 
  newMessage: string, 
  provider: ModelProvider = 'gemini', 
  language: Language = 'en',
  onChunk?: (text: string) => void
): Promise<string> => {
  // Define language-specific personas for better context
  let systemInstruction: string;
  
  if (language === 'zh') {
    systemInstruction = `你是一名专业的财务审计顾问和智能会计助手 (AuditAI)。
    你的职责：
    1. 根据《企业会计准则》(CAS) 和 国际财务报告准则 (IFRS) 回答用户问题。
    2. 解释复杂的税务法规（如中国增值税、所得税）。
    3. 协助用户分析财务报表中的异常。
    4. 保持专业、客观、简洁的语调。
    
    请始终使用简体中文 (Simplified Chinese) 回答。`;
  } else {
    systemInstruction = `You are a professional financial audit consultant and intelligent accounting assistant (AuditAI).
    Your responsibilities:
    1. Answer questions based on US GAAP and IFRS.
    2. Explain complex tax regulations and compliance requirements.
    3. Assist users in interpreting financial statement anomalies.
    4. Maintain a professional, objective, and concise tone.
    
    Please always answer in English.`;
  }

  // --- OpenAI Compatible Implementation (DeepSeek, GPT, Qwen) ---
  const config = getProviderConfig(provider);
  if (config) {
    const messages = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text
    }));
    messages.push({ role: 'user', content: newMessage });
    
    try {
      return await callOpenAICompatible(messages, systemInstruction, config, onChunk);
    } catch (error) {
       console.error(`${config.providerName} Chat Error:`, error);
       return `Sorry, I encountered an error connecting to ${config.providerName}.`;
    }
  }

  // --- Gemini Implementation (Streaming) ---
  const formattedHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: formattedHistory,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  try {
    if (onChunk) {
      const result = await chat.sendMessageStream({ message: newMessage });
      let accumulatedText = "";
      
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          accumulatedText += text;
          onChunk(accumulatedText);
        }
      }
      return accumulatedText;
    } else {
      const result = await chat.sendMessage({ message: newMessage });
      return result.text || "I'm not sure how to answer that.";
    }
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I encountered an error connecting to the service.";
  }
};