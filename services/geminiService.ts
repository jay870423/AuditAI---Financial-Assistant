import { GoogleGenAI, Type } from "@google/genai";
import { AuditAnalysisResult, ChatMessage, ModelProvider } from "../types";

// Ensure we don't crash if env is missing during initial load
const apiKey = process.env.API_KEY || 'MISSING_API_KEY';
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY || '';
const openAiApiKey = process.env.OPENAI_API_KEY || '';
const qwenApiKey = process.env.DASHSCOPE_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

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

const callOpenAICompatible = async (messages: any[], systemInstruction: string | undefined, config: OpenAIConfig) => {
  if (!config.apiKey) {
    throw new Error(`${config.providerName} API Key is missing. Please check your environment variables.`);
  }

  const payload: any = {
    model: config.model,
    messages: [
      ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
      ...messages
    ],
    stream: false,
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

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

// --- Configuration Helper ---

const getProviderConfig = (provider: ModelProvider, jsonMode: boolean = false): OpenAIConfig | null => {
  switch (provider) {
    case 'deepseek':
      return {
        apiKey: deepSeekApiKey,
        baseUrl: "https://api.deepseek.com/chat/completions",
        model: "deepseek-chat",
        providerName: "DeepSeek",
        jsonMode
      };
    case 'gpt':
      return {
        apiKey: openAiApiKey,
        baseUrl: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        providerName: "OpenAI (GPT-4o)",
        jsonMode
      };
    case 'qwen':
      return {
        apiKey: qwenApiKey,
        // Using Alibaba DashScope OpenAI-compatible endpoint
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
 * Analyzes financial text or CSV data using Gemini, DeepSeek, GPT, or Qwen.
 */
export const analyzeFinancialData = async (data: string, provider: ModelProvider = 'gemini'): Promise<AuditAnalysisResult> => {
  const systemInstruction = "You are a precise, skeptical, and helpful financial auditor.";
  const promptText = `
    You are a Senior Financial Auditor. Analyze the following financial text/CSV data.
    Identify anomalies, high-risk transactions, and compliance issues.
    Extract key metrics and prepare a chart dataset for the most significant breakdown (e.g., expenses by category).
    
    Data:
    ${data}

    Output must be valid JSON matching this structure:
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
      summary: { type: Type.STRING, description: "A professional executive summary of the financial data." },
      risks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING, enum: ["high", "medium", "low"] },
            description: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ["severity", "description", "recommendation"]
        }
      },
      keyMetrics: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            value: { type: Type.STRING },
            change: { type: Type.STRING, description: "Percentage change or trend description" }
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
            category: { type: Type.STRING },
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
 * Supports: Gemini, GPT-4o, Qwen-VL.
 * DeepSeek falls back to Gemini.
 */
export const analyzeReceiptImage = async (file: File, provider: ModelProvider = 'gemini'): Promise<string> => {
  const prompt = `
    Perform a forensic audit on this document (Receipt, Invoice, or Financial PDF).
    1. Identify the Vendor/Entity, Date, and Total Amount.
    2. Check for signs of tampering or alteration.
    3. Categorize the expense or document type.
    4. Highlight any missing information (e.g., Tax ID, Signatures).
    5. If it's a multi-page PDF, summarize the key financial findings.
    
    Format the output in clear Markdown.
  `;

  // --- GPT & Qwen (Vision Supported) ---
  // DeepSeek currently is text-optimized (V3), so we skip it here and use fallback
  if (provider === 'gpt' || provider === 'qwen') {
    const config = getProviderConfig(provider);
    if (config) {
      // Qwen VL model specific
      if (provider === 'qwen') config.model = 'qwen-vl-max'; 
      // GPT uses default gpt-4o defined in config

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
 * Chat functionality for financial context.
 */
export const sendChatMessage = async (history: ChatMessage[], newMessage: string, provider: ModelProvider = 'gemini'): Promise<string> => {
  const systemInstruction = "You are a financial consultant assistant. Answer questions based on general accounting principles (GAAP/IFRS) and auditing standards. Keep answers concise.";

  // --- OpenAI Compatible Implementation (DeepSeek, GPT, Qwen) ---
  const config = getProviderConfig(provider);
  if (config) {
    // Convert history to OpenAI format
    const messages = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text
    }));
    messages.push({ role: 'user', content: newMessage });
    
    try {
      return await callOpenAICompatible(messages, systemInstruction, config);
    } catch (error) {
       console.error(`${config.providerName} Chat Error:`, error);
       return `Sorry, I encountered an error connecting to ${config.providerName}.`;
    }
  }

  // --- Gemini Implementation ---
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
    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I'm not sure how to answer that.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I encountered an error connecting to the service.";
  }
};