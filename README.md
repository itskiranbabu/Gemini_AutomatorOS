
# AutomatorOS

**AutomatorOS** is an AI-first automation platform that converts natural language into complex workflows. It orchestrates apps, APIs, and data through a visual node-based builder, inspired by Zapier/n8n but powered by Generative AI.

## Features

- **AI Architect**: Type "Send me an email when a new Shopify order > $100 arrives" and get a full workflow instantly.
- **Visual Builder**: Infinite canvas with drag-and-drop, zoom/pan, and real-time execution highlighting.
- **Durable Execution**: Workflows support retries, branching logic, delays, and scripting (JS).
- **Enterprise Grade**: Audit logs, version history, role-based access control simulation.
- **Real-time**: Built with Supabase Realtime for instant updates across clients.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Recharts.
- **State Management**: React Context + Supabase (Postgres).
- **AI**: Google Gemini API (`@google/genai`).
- **Build**: Vite / Webpack (via standard React scripts).

## Getting Started

### Prerequisites

1.  **Supabase Project**: Create a project at [supabase.com](https://supabase.com).
2.  **Gemini API Key**: Get a key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up Environment Variables (`.env.local`):
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_API_KEY=your_gemini_api_key
    ```
4.  Run the Database Migrations (SQL provided in `constants.ts` or `ArchitectureDocs` within the app).
5.  Start the development server:
    ```bash
    npm run dev
    ```

## Deployment

### Vercel / Netlify

This project is a Client-Side SPA (Single Page Application).

1.  Push code to GitHub.
2.  Import project into Vercel.
3.  Add the Environment Variables in Vercel Dashboard.
4.  Deploy.

### Docker

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Security

- **RLS**: All database access is guarded by Row Level Security policies.
- **Encryption**: Credentials should be stored in the `connections` table using encryption (simulated in this demo).
- **Sandboxing**: Custom script execution uses `new Function()` for the demo. In production, use V8 Isolates (Cloudflare Workers) or Firecracker.

## License

MIT
