# AuditAI - Financial Assistant

An intelligent financial audit assistant powered by Google Gemini and Supabase. Now supporting GPT-4o (OpenAI), DeepSeek, and Qwen (Alibaba).

🌐 **Live Application:** [https://auditai.zhouyuaninfo.com/](https://auditai.zhouyuaninfo.com/)

## 🚀 Deployment on Vercel (Supports China Access)

This project is optimized for deployment on [Vercel](https://vercel.com) and is pre-configured to work in regions where Google APIs are blocked (like China).

### 1. Prerequisites
*   A Vercel Account.
*   A Google Cloud Project with Gemini API enabled and an API Key.
*   A Supabase Project.

### 2. Environment Variables
Go to **Settings** -> **Environment Variables** in your Vercel project and add the following:

| Variable Name | Description | Required? |
| :--- | :--- | :--- |
| `API_KEY` | Google Gemini API Key | **Yes** |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | **Yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key | **Yes** |
| `DEEPSEEK_API_KEY` | DeepSeek API Key (Optional) | No |
| `OPENAI_API_KEY` | OpenAI API Key (Optional) | No |

### 3. 🇨🇳 Critical Configuration for China
The default `*.vercel.app` domains are often blocked or have DNS issues in China. To ensure the app works reliably:

1.  **Bind a Custom Domain**: In Vercel, go to **Settings** -> **Domains**.
2.  Add your own domain (e.g., `audit.yourcompany.com`).
3.  Configure the CNAME record in your DNS provider (Aliyun, Tencent Cloud, Cloudflare, etc.) to point to `cname.vercel-dns.com`.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env.local` file. **IMPORTANT**: Do not commit this file to GitHub!
    ```env
    API_KEY=your_gemini_key
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## ⚠️ Troubleshooting: "API Key Leaked" Error

If you see an error saying **"Your API key was reported as leaked"**, it means Google has detected your key in a public place (like a GitHub repo or a chat log) and **permanently revoked it**.

**Solution:**
1.  Go to [Google AI Studio](https://aistudio.google.com/) and create a **NEW** API Key.
2.  Update your `.env.local` file with the new key.
3.  **Restart your local server** (`Ctrl+C` then `npm run dev`) for the change to take effect.
4.  Update the Environment Variable in Vercel settings and **Redeploy**.

## Features
*   **Financial Analysis**: Upload CSV/Excel to detect fraud, tax issues, and compliance risks.
*   **Document Scanning**: Vision analysis for receipts and invoices.
*   **AI Chat**: Consult on accounting standards (IFRS/GAAP).
*   **Multi-Model**: Switch between Gemini, GPT-4o, DeepSeek, and Qwen.