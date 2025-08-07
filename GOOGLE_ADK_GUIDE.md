# Google ADK Multi-Agent Integration

## Overview

This integration provides **Google ADK coordination with Grok-3 intelligence** for the PersonaDoc multi-agent system. 

### Architecture

- **🧠 AI Intelligence**: Grok-3 for all persona responses and analysis
- **🔄 Coordination**: Google ADK for professional agent orchestration
- **🏗️ Infrastructure**: TypeScript/Next.js on Vercel + Python microservice
- **💾 Storage**: Prisma/PostgreSQL for session management

## Quick Start

### 1. Start the Google ADK Service

```bash
./start-google-adk.sh
```

### 2. Set Environment Variables

```bash
# Required for Grok-3
export OPENAI_API_KEY="your-grok-api-key"

# Required for Google ADK
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"

# Optional
export API_TOKEN="internal-service-token"
```

### 3. Use in PersonaDoc

1. Go to Multi-Agent System page
2. Select "Google ADK" framework
3. Choose your personas
4. Start analysis

## Features

### ✅ What Works

- **Professional Coordination**: Google ADK patterns for agent orchestration
- **Grok-3 Intelligence**: All AI responses powered by Grok-3
- **Parallel Execution**: Efficient multi-agent processing
- **Real-time Updates**: WebSocket streaming of coordination events
- **Vercel Deployment**: Production-ready on Vercel platform
- **Persona Integration**: Full compatibility with PersonaDoc persona system

### 🔄 Architecture Benefits

- **Best of Both Worlds**: Professional coordination + preferred AI model
- **Production Ready**: Designed for Vercel deployment
- **Scalable**: Microservice architecture
- **Extensible**: Easy to add new coordination patterns

## API Endpoints

- `POST /google-adk/analyze` - Run multi-agent analysis
- `GET /google-adk/session/{id}/events` - Get coordination events
- `WS /google-adk/session/{id}/stream` - Real-time updates

## Development

### File Structure

```
python-agents/
├── google_adk_system.py     # Google ADK coordination logic
├── main.py                  # FastAPI service
├── requirements.txt         # Python dependencies
└── ...

app/api/multi-agent-sessions/
├── google-adk/
│   └── route.ts            # TypeScript integration
└── ...
```

### Adding New Coordination Patterns

1. Extend `GoogleADKCoordinator` class
2. Add new coordination steps
3. Update analysis logic
4. Test with personas

## Troubleshooting

### Service Won't Start
- Check Python version (3.8+)
- Verify virtual environment
- Install requirements: `pip install -r requirements.txt`

### Google ADK Errors
- Verify `GOOGLE_CLOUD_PROJECT` is set
- Check Google Cloud credentials
- Ensure ADK APIs are enabled

### Grok-3 Errors
- Verify `OPENAI_API_KEY` is set
- Check Grok API quota/limits
- Test with simple completion

## Support

This system integrates Google's professional agent coordination with your preferred Grok-3 AI model, providing the best of both worlds for production multi-agent systems on Vercel.
