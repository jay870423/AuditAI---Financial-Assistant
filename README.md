# AuditAI - Financial Assistant

An intelligent financial audit assistant powered by Google Gemini and Supabase. Now supporting GPT-4o (OpenAI), DeepSeek, and Qwen (Alibaba).

🌐 **Live Application:** [https://auditai.zhouyuaninfo.com/](https://auditai.zhouyuaninfo.com/)

## 🚀 Deployment on Vercel

This project is configured to be easily deployed on [Vercel](https://vercel.com).

### Prerequisites

1.  A Vercel Account.
2.  A Google Cloud Project with Gemini API enabled and an API Key.
3.  A Supabase Project.

### 🤖 Multi-Model Configuration (Environment Variables)

To enable **DeepSeek**, **GPT-4o**, or **Qwen (Aliyun)**, you must configure the following Environment Variables in your Vercel Project Settings.

**Note:** You do not need the `VITE_` prefix; the configuration is handled automatically in `vite.config.ts`.

| Variable Name | Description | Required? | Where to get it |
| :--- | :--- | :--- | :--- |
| `API_KEY` | Google Gemini API Key | **Yes** | [Google AI Studio](https://aistudio.google.com/) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | **Yes** | [Supabase](https://supabase.com/) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | **Yes** | [Supabase](https://supabase.com/) |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | Optional | [DeepSeek Platform](https://platform.deepseek.com/) |
| `OPENAI_API_KEY` | OpenAI API Key | Optional | [OpenAI Platform](https://platform.openai.com/) |
| `DASHSCOPE_API_KEY` | Alibaba Qwen API Key | Optional | [Aliyun DashScope](https://dashscope.console.aliyun.com/) |

### Deployment Steps

1.  Push this code to a Git repository (GitHub, GitLab, etc.).
2.  Log in to Vercel and click **"Add New..."** -> **"Project"**.
3.  Import your Git repository.
4.  Vercel will detect the framework as **Vite**.
5.  Expand the **"Environment Variables"** section and add the variables listed above.
6.  Click **"Deploy"**.

**If you add keys later:** Remember to **Redeploy** your project in Vercel for the new keys to take effect.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env.local` file with the environment variables (see table above).
3.  Start the development server:
    ```bash
    npm run dev
    ```