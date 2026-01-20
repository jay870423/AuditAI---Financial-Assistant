import { AuditAnalysisResult, ChatMessage, ModelProvider, AuditScenario } from "../types";
import { Language } from "../i18n";

// Environment Variables
const apiKey = process.env.API_KEY || '';
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY || '';
const openAiApiKey = process.env.OPENAI_API_KEY || '';
const qwenApiKey = process.env.DASHSCOPE_API_KEY || '';

// Known leaked key from previous error logs
const KNOWN_LEAKED_KEY = 'AIzaSyC5rjCmri6zIsyZYASSBso7tCGl0PBD-N8';

// --- DEBUG & SECURITY CHECK ---
if (typeof window !== 'undefined') {
  // Safe mask: Show first 4 and last 4 chars
  const maskedKey = apiKey && apiKey.length > 10 
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` 
    : (apiKey ? 'SHORT_KEY' : 'MISSING');
    
  console.log(`%c[AuditAI] Config Loaded`, 'background: #4f46e5; color: white; padding: 2px 5px; border-radius: 3px;');
  console.log(`Current Loaded API Key: ${maskedKey}`);
  
  if (apiKey === KNOWN_LEAKED_KEY) {
    console.error(
      "%c🚨 FATAL ERROR: OLD KEY DETECTED IN MEMORY 🚨", 
      "background: red; color: white; font-size: 16px; padding: 10px;"
    );
    console.error("You updated .env.local, BUT the server is still using the old key.");
    console.error("👉 ACTION REQUIRED: Go to your terminal, press Ctrl+C, and run 'npm run dev' again.");
  }
}

// --- PROXY CONFIGURATION ---
const GEMINI_PROXY_BASE = '/gemini-api';
const GEMINI_API_VERSION = 'v1beta';

// Helper: Handle API Errors gracefully
const handleApiError = async (response: Response, provider: string) => {
  const status = response.status;
  let errorText = '';
  try {
    errorText = await response.text();
  } catch (e) {
    errorText = 'Unknown error';
  }

  // Detect if the OLD key is still active when an error occurs
  if (apiKey === KNOWN_LEAKED_KEY) {
    throw new Error("⚠️ RESTART REQUIRED: The app is still using the old revoked key. Please stop and restart 'npm run dev'.");
  }

  // Try to parse JSON error from Google/OpenAI
  let friendlyMessage = `Error (${status})`;
  try {
    const json = JSON.parse(errorText);
    // Google format: { error: { message: "..." } }
    if (json.error && json.error.message) {
      friendlyMessage = json.error.message;
    } 
    // OpenAI format: { error: { message: "..." } }
    else if (json.error && typeof json.error === 'string') {
      friendlyMessage = json.error;
    }
  } catch (e) {
    if (errorText.length < 100) friendlyMessage = errorText;
  }

  // Specific check for Leaked Key
  if (status === 403 || status === 400) {
    if (friendlyMessage.toLowerCase().includes('leaked') || friendlyMessage.includes('API key not valid')) {
      throw new Error("🚨 API Key Invalid. If you just updated .env.local, please RESTART your terminal (Ctrl+C -> npm run dev).");
    }
  }
  
  if (status === 404) {
    throw new Error("Model unreachable (404). If locally in China, ensure you have a VPN enabled for the terminal/browser.");
  }

  throw new Error(`${provider} API Error: ${friendlyMessage}`);
};

// Helper: Get full Gemini URL via Proxy
const getGeminiUrl = (model: string, method: string, isStreaming: boolean = false): string => {
  let url = `${GEMINI_PROXY_BASE}/${GEMINI_API_VERSION}/models/${model}:${method}?key=${apiKey}`;
  if (isStreaming) {
    url += '&alt=sse'; 
  }
  return url;
};

// Helper: Convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Content,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper: File to Data URL
const fileToDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Generic OpenAI Compatible Caller ---
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
  if (!config.apiKey) throw new Error(`${config.providerName} API Key is missing.`);

  const isStreaming = !!onChunk;
  const payload: any = {
    model: config.model,
    messages: [
      ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
      ...messages
    ],
    stream: isStreaming,
    temperature: 0.1
  };

  if (config.jsonMode) payload.response_format = { type: "json_object" };

  console.log(`[AuditAI] Calling ${config.providerName}...`);

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await handleApiError(response, config.providerName);
  }

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
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.replace("data: ", ""));
            const delta = json.choices?.[0]?.delta?.content || "";
            if (delta) {
              accumulatedText += delta;
              onChunk(accumulatedText);
            }
          } catch (e) { /* ignore parse errors in stream */ }
        }
      }
    }
    return accumulatedText;
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

const getProviderConfig = (provider: ModelProvider, jsonMode: boolean = false): OpenAIConfig | null => {
  switch (provider) {
    case 'deepseek':
      return { apiKey: deepSeekApiKey, baseUrl: "https://api.deepseek.com/chat/completions", model: "deepseek-chat", providerName: "DeepSeek", jsonMode };
    case 'gpt':
      const gptBase = process.env.OPENAI_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/openai-api/v1/chat/completions` : "https://api.openai.com/v1/chat/completions");
      return { apiKey: openAiApiKey, baseUrl: gptBase, model: "gpt-4o", providerName: "OpenAI", jsonMode };
    case 'qwen':
      return { apiKey: qwenApiKey, baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", model: "qwen-max", providerName: "Qwen", jsonMode };
    default: return null;
  }
};

// --- GEMINI IMPLEMENTATION ---

const getScenarioInstruction = (scenario: AuditScenario, langInstruction: string): string => {
  const base = `You are a professional auditor. Output language: ${langInstruction}.`;
  switch (scenario) {
    case 'fraud': return `${base} Focus on FRAUD DETECTION. Look for round number anomalies, weekend transactions.`;
    case 'tax': return `${base} Focus on TAX COMPLIANCE. Identify non-deductible expenses.`;
    case 'compliance': return `${base} Focus on INTERNAL CONTROLS.`;
    default: return `${base} Provide a balanced financial overview.`;
  }
};

export const analyzeFinancialData = async (data: string, provider: ModelProvider = 'gemini', language: Language = 'en', scenario: AuditScenario = 'general'): Promise<AuditAnalysisResult> => {
  // Explicit restart check
  if (apiKey === KNOWN_LEAKED_KEY) {
    throw new Error("⚠️ SERVER RESTART REQUIRED: Old Key detected. Stop terminal and run 'npm run dev' again.");
  }

  const langInstruction = language === 'zh' ? 'Simplified Chinese (zh-CN)' : 'English';
  const systemInstruction = getScenarioInstruction(scenario, langInstruction);
  
  const promptText = `
    Analyze the following financial data:
    ${data}

    Output valid JSON matching this structure. 
    Values for 'summary', 'description', 'recommendation', 'label', 'category', 'change' MUST be in ${langInstruction}.
    
    JSON Structure:
    {
      "summary": "string",
      "risks": [{"severity": "high|medium|low", "description": "string", "recommendation": "string"}],
      "keyMetrics": [{"label": "string", "value": "string", "change": "string"}],
      "chartData": [{"category": "string", "value": number}]
    }
  `;

  const config = getProviderConfig(provider, true);
  if (config) {
    const res = await callOpenAICompatible([{ role: "user", content: promptText }], systemInstruction, config);
    return JSON.parse(res.replace(/```json\n?|\n?```/g, ''));
  }

  if (!apiKey) throw new Error("Gemini API Key is missing.");

  const model = "gemini-3-flash-preview";
  const url = getGeminiUrl(model, "generateContent");

  console.log(`[AuditAI] Requesting Gemini Analysis: ${url}`);

  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          risks: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                severity: { type: "STRING", enum: ["high", "medium", "low"] },
                description: { type: "STRING" },
                recommendation: { type: "STRING" }
              },
              required: ["severity", "description", "recommendation"]
            }
          },
          keyMetrics: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { label: { type: "STRING" }, value: { type: "STRING" }, change: { type: "STRING" } },
              required: ["label", "value"]
            }
          },
          chartData: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { category: { type: "STRING" }, value: { type: "NUMBER" } },
              required: ["category", "value"]
            }
          }
        },
        required: ["summary", "risks", "keyMetrics"]
      }
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await handleApiError(response, 'Gemini');
  }

  const json = await response.json();
  const textResult = json.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResult) throw new Error("Gemini returned empty response.");
  return JSON.parse(textResult);
};

export const analyzeReceiptImage = async (file: File, provider: ModelProvider = 'gemini', language: Language = 'en', scenario: AuditScenario = 'general'): Promise<string> => {
  const langInstruction = language === 'zh' ? 'Simplified Chinese (zh-CN)' : 'English';
  const prompt = `Perform a forensic audit on this image. Scenario: ${scenario}. Language: ${langInstruction}. Format as Markdown.`;

  if (provider === 'gpt' || provider === 'qwen') {
    const config = getProviderConfig(provider);
    if (config) {
      if (provider === 'qwen') config.model = 'qwen-vl-max';
      const dataUrl = await fileToDataUrl(file);
      const messages = [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: dataUrl } }] }];
      return await callOpenAICompatible(messages, undefined, config);
    }
  }

  if (!apiKey) throw new Error("Gemini API Key missing.");
  
  const model = "gemini-3-flash-preview"; 
  const url = getGeminiUrl(model, "generateContent");
  
  console.log(`[AuditAI] Requesting Gemini Vision: ${url}`);

  const { mimeType, data } = await fileToGenerativePart(file);

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data } }
      ]
    }]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await handleApiError(response, 'Gemini Vision');
  }

  const json = await response.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated.";
};

export const sendChatMessage = async (
  history: ChatMessage[], 
  newMessage: string, 
  provider: ModelProvider = 'gemini', 
  language: Language = 'en',
  onChunk?: (text: string) => void
): Promise<string> => {
  const systemInstruction = language === 'zh' 
    ? `你是一名专业的财务审计顾问 (AuditAI)。请根据会计准则回答，保持专业。` 
    : `You are a professional financial audit consultant (AuditAI). Answer based on accounting standards.`;

  const config = getProviderConfig(provider);
  if (config) {
    const messages = history.map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.text }));
    messages.push({ role: 'user', content: newMessage });
    return await callOpenAICompatible(messages, systemInstruction, config, onChunk);
  }

  if (!apiKey) throw new Error("Gemini API Key is missing.");
  
  // Check for old key again just in case
  if (apiKey === KNOWN_LEAKED_KEY) {
    throw new Error("⚠️ RESTART SERVER: Old API Key detected.");
  }

  const model = "gemini-3-flash-preview";
  const url = getGeminiUrl(model, "streamGenerateContent", true);

  console.log(`[AuditAI] Requesting Gemini Chat (SSE): ${url}`);

  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  const payload = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await handleApiError(response, 'Gemini Chat');
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6); // remove 'data: '
          if (jsonStr.trim() === '[DONE]') continue;
          
          try {
            const json = JSON.parse(jsonStr);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              accumulatedText += text;
              onChunk(accumulatedText);
            }
          } catch (e) { }
        }
      }
    }
    return accumulatedText || " ";
  } else {
    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
};