# PersonaDoc - Setup Guide for Vercel Deployment

## 🚀 Quick Start

Your PersonaDoc system is ready to deploy! Follow these steps to get it running on Vercel.

## 📋 Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Grok API Key** - Get your API key from [X AI Console](https://console.x.ai)
3. **PostgreSQL Database** - Use Vercel Postgres (recommended) or any PostgreSQL provider

## 🛠️ Vercel Deployment Steps

### 1. Database Setup (Vercel Postgres)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or go to your existing project
3. Navigate to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Follow the setup wizard
6. Copy the database connection string

### 2. Environment Variables

In your Vercel project dashboard, go to **Settings** → **Environment Variables** and add:

```bash
# Database
DATABASE_URL=your_postgresql_connection_string

# Grok AI Configuration
OPENAI_API_KEY=your_grok_api_key_here
OPENAI_BASE_URL=https://api.x.ai/v1

# NextAuth (optional, for future authentication)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### 3. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Vercel will auto-deploy on every push

#### Option B: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### 4. Initialize Database

After deployment, run this command in your Vercel project terminal or locally:

```bash
npx prisma db push
```

## 🎯 Getting Your Grok API Key

1. Visit [X AI Console](https://console.x.ai)
2. Sign in with your X (Twitter) account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `xai-...`)

## 🧪 Testing Locally

```bash
# Install dependencies (already done)
npm install

# Set up your .env.local file
cp .env.example .env.local

# Edit .env.local with your actual values
# DATABASE_URL=your_local_or_vercel_postgres_url
# OPENAI_API_KEY=your_grok_api_key

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

## 📁 Project Structure

```
personadoc_web/
├── app/
│   ├── api/
│   │   └── personas/
│   │       ├── route.ts          # CRUD operations for personas
│   │       └── [id]/
│   │           └── chat/
│   │               └── route.ts  # Chat with AI personas
│   ├── page.tsx                  # Main dashboard
│   ├── layout.tsx               # App layout
│   └── globals.css              # Global styles
├── components/
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── prisma.ts               # Database client
│   └── grok.ts                 # AI client
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## 🎨 Features

- ✅ **AI Persona Creation** - Create detailed AI personas with personalities
- ✅ **Real-time Chat** - Chat with AI personas using Grok AI
- ✅ **Persistent Storage** - All conversations saved to PostgreSQL
- ✅ **Responsive UI** - Works on desktop and mobile
- ✅ **Modern Stack** - Next.js 15, React 19, TypeScript, Tailwind CSS

## 🔧 Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` in Vercel environment variables
- Ensure your database allows connections from Vercel's IP ranges

### Grok API Issues
- Check your `OPENAI_API_KEY` is correctly set
- Verify `OPENAI_BASE_URL` is set to `https://api.x.ai/v1`
- Ensure you have Grok API credits remaining

### Build Errors
- Run `npx prisma generate` after any schema changes
- Clear Vercel build cache if needed

## 📞 Support

If you encounter any issues:
1. Check the Vercel deployment logs
2. Verify all environment variables are set correctly
3. Ensure your database is accessible
4. Test the Grok API key separately

## 🎉 You're Ready!

Once deployed, you can:
1. Visit your Vercel app URL
2. Click "Create Demo Persona" to get started
3. Start chatting with AI personas powered by Grok!

---

**Deployment URL**: Your app will be available at `https://your-project-name.vercel.app`
