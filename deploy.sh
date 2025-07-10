#!/bin/bash

echo "🚀 PersonaDoc Deployment Script"
echo "================================"

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set it in your Vercel dashboard or .env.local file"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY environment variable is not set"
    echo "Please set your Grok API key in Vercel dashboard or .env.local file"
    exit 1
fi

echo "✅ Environment variables are set"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Pushing database schema..."
npx prisma db push

echo "✅ Deployment preparation complete!"
echo "🎉 Your PersonaDoc system is ready to use!"
