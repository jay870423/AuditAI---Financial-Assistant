# AuditAI - Financial Assistant

An intelligent financial audit assistant powered by Google Gemini and Supabase. Now supporting GPT-4o (OpenAI), DeepSeek, and Qwen (Alibaba).

🌐 **Live Application:** [https://auditai.zhouyuaninfo.com/](https://auditai.zhouyuaninfo.com/)

## 🚀 Deployment on Vercel

This project is configured to be easily deployed on [Vercel](https://vercel.com).

### Prerequisites

1.  A Vercel Account.
2.  A Google Cloud Project with Gemini API enabled and an API Key.
3.  A Supabase Project.
4.  (Optional) Additional API keys for other models.

### Environment Variables

When deploying your project on Vercel, you must configure the following Environment Variables in the project settings:

| Variable Name | Description | Required |
| :--- | :--- | :--- |
| `API_KEY` | Your Google Gemini API Key. | **Yes** |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL (e.g. `https://xyz.supabase.co`). | **Yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Project API Key (public/anon). | **Yes** |
| `DEEPSEEK_API_KEY` | Your DeepSeek API Key. | **No** (Optional) |
| `OPENAI_API_KEY` | Your OpenAI API Key. | **No** (Optional) |
| `DASHSCOPE_API_KEY` | Your Alibaba DashScope/Qwen API Key. | **No** (Optional) |

### Steps

1.  Push this code to a Git repository (GitHub, GitLab, etc.).
2.  Log in to Vercel and click **"Add New..."** -> **"Project"**.
3.  Import your Git repository.
4.  Vercel will detect the framework as **Vite**. The build command (`vite build`) and output directory (`dist`) should be automatically detected.
5.  Expand the **"Environment Variables"** section and add the variables listed above.
6.  Click **"Deploy"**.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env.local` file with the environment variables.
3.  Start the development server:
    ```bash
    npm run dev
    ```
