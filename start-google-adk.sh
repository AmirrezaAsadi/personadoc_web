#!/bin/bash

echo "🚀 Starting PersonaDoc Google ADK Multi-Agent Service"
echo "======================================================="

# Check if we're in the right directory
if [ ! -f "python-agents/requirements.txt" ]; then
    echo "❌ Please run this script from the personadoc_web root directory"
    exit 1
fi

# Navigate to python-agents directory
cd python-agents

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "⚡ Activating virtual environment..."
source venv/bin/activate

# Install/upgrade requirements
echo "📚 Installing requirements..."
pip install -r requirements.txt

# Check environment variables
echo "🔧 Checking environment variables..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set (required for Grok-3)"
fi

if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "⚠️  Warning: GOOGLE_CLOUD_PROJECT not set (required for Google ADK)"
fi

# Start the service
echo "🎯 Starting Google ADK Multi-Agent Service..."
echo "   Framework: Google ADK coordination"
echo "   AI Model: Grok-3"
echo "   Port: 8000"
echo "   Health: http://localhost:8000/health"
echo ""

python main.py
