from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import httpx
import os
from dotenv import load_dotenv
import json

# Import agent systems
try:
    from langgraph_system import multi_agent_system as langgraph_system
except ImportError:
    langgraph_system = None
    print("⚠️ LangGraph system not available")

try:
    from google_adk_system import google_adk_system
except ImportError:
    google_adk_system = None
    print("⚠️ Google ADK system not available")

load_dotenv()

app = FastAPI(title="PersonaDoc Multi-Agent Service")

# Enable CORS for Vercel integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MultiAgentRequest(BaseModel):
    session_id: str
    user_query: str
    persona_ids: List[str]
    framework: str = "google-adk"  # Default to Google ADK

class MultiAgentResponse(BaseModel):
    session_id: str
    synthesis: str
    persona_responses: Dict[str, Any]
    coordination_events: List[Dict[str, Any]]
    analysis: Dict[str, Any]

# Store for session updates (in production, use Redis)
session_updates = {}

@app.get("/health")
async def health_check():
    available_frameworks = []
    if google_adk_system:
        available_frameworks.append("google-adk")
    if langgraph_system:
        available_frameworks.append("langgraph")
    
    return {
        "status": "healthy", 
        "service": "PersonaDoc Multi-Agent",
        "available_frameworks": available_frameworks
    }

app = FastAPI(title="PersonaDoc Multi-Agent Service")

# Enable CORS for Vercel integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MultiAgentRequest(BaseModel):
    session_id: str
    user_query: str
    persona_ids: List[str]
    framework: str = "google-adk"  # Default to Google ADK

class MultiAgentResponse(BaseModel):
    session_id: str
    synthesis: str
    persona_responses: Dict[str, Any]
    coordination_events: List[Dict[str, Any]]
    analysis: Dict[str, Any]

# Store for session updates (in production, use Redis)
session_updates = {}

@app.get("/health")
async def health_check():
    available_frameworks = []
    if google_adk_system:
        available_frameworks.append("google-adk")
    if langgraph_system:
        available_frameworks.append("langgraph")
    
    return {
        "status": "healthy", 
        "service": "PersonaDoc Multi-Agent",
        "available_frameworks": available_frameworks,
        "default_framework": "google-adk",
        "ai_model": "grok-3"
    }

@app.post("/google-adk/analyze", response_model=MultiAgentResponse)
async def run_google_adk_analysis(request: MultiAgentRequest, background_tasks: BackgroundTasks):
    """Run multi-agent analysis using Google ADK coordination with Grok-3 intelligence"""
    
    if not google_adk_system:
        raise HTTPException(status_code=503, detail="Google ADK system not available")
    
    try:
        # Fetch persona data from TypeScript API
        personas = []
        # Use environment variable for API base URL, fallback to localhost for development
        api_base_url = os.getenv('TYPESCRIPT_API_URL', 'http://localhost:3000')
        
        async with httpx.AsyncClient() as client:
            for persona_id in request.persona_ids:
                try:
                    response = await client.get(
                        f"{api_base_url}/api/personas/{persona_id}",
                        headers={"Authorization": f"Bearer {os.getenv('API_TOKEN')}"},
                        timeout=10.0
                    )
                    if response.status_code == 200:
                        personas.append(response.json())
                    else:
                        print(f"Failed to fetch persona {persona_id}: {response.status_code}")
                except Exception as e:
                    print(f"Error fetching persona {persona_id}: {e}")
        
        if not personas:
            raise HTTPException(status_code=400, detail="No valid personas found")
        
        # Run Google ADK analysis with Grok-3
        result = await google_adk_system.run_analysis(
            session_id=request.session_id,
            user_query=request.user_query,
            personas=personas
        )
        
        # Store updates for streaming
        session_updates[request.session_id] = result
        
        # Send updates back to TypeScript API in background
        background_tasks.add_task(send_updates_to_typescript, request.session_id, result)
        
        return MultiAgentResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google ADK analysis failed: {str(e)}")

@app.post("/multi-agent/analyze", response_model=MultiAgentResponse)
async def run_multi_agent_analysis(request: MultiAgentRequest, background_tasks: BackgroundTasks):
    """Run multi-agent analysis using LangGraph"""
    
    try:
        # Fetch persona data from TypeScript API
        personas = []
        async with httpx.AsyncClient() as client:
            for persona_id in request.persona_ids:
                try:
                    response = await client.get(
                        f"http://localhost:3000/api/personas/{persona_id}",
                        headers={"Authorization": f"Bearer {os.getenv('API_TOKEN')}"}
                    )
                    if response.status_code == 200:
                        personas.append(response.json())
                except Exception as e:
                    print(f"Error fetching persona {persona_id}: {e}")
        
        if not personas:
            raise HTTPException(status_code=400, detail="No valid personas found")
        
        # Check framework availability and run analysis
        if request.framework == "google-adk":
            if not google_adk_system:
                raise HTTPException(status_code=503, detail="Google ADK system not available")
            result = await google_adk_system.run_analysis(
                session_id=request.session_id,
                user_query=request.user_query,
                personas=personas
            )
        elif request.framework == "langgraph":
            if not langgraph_system:
                raise HTTPException(status_code=503, detail="LangGraph system not available")
            result = await langgraph_system.run_analysis(
                session_id=request.session_id,
                user_query=request.user_query,
                personas=personas
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported framework: {request.framework}")

        # Store updates for streaming
        session_updates[request.session_id] = result

        # Send updates back to TypeScript API in background
        background_tasks.add_task(send_updates_to_typescript, request.session_id, result)

        return MultiAgentResponse(**result)
        
        # Store updates for streaming
        session_updates[request.session_id] = result
        
        # Send updates back to TypeScript API in background
        background_tasks.add_task(send_updates_to_typescript, request.session_id, result)
        
        return MultiAgentResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/multi-agent/session/{session_id}/events")
async def get_session_events(session_id: str):
    """Get real-time coordination events for a session"""
    
    if session_id in session_updates:
        return {
            "session_id": session_id,
            "coordination_events": session_updates[session_id].get("coordination_events", []),
            "status": "active" if session_id in session_updates else "completed"
        }
    
    return {"session_id": session_id, "coordination_events": [], "status": "not_found"}

async def send_updates_to_typescript(session_id: str, result: Dict[str, Any]):
    """Send analysis results back to TypeScript API"""
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"http://localhost:3000/api/multi-agent-sessions/{session_id}/update",
                json=result,
                headers={"Authorization": f"Bearer {os.getenv('API_TOKEN')}"}
            )
    except Exception as e:
        print(f"Failed to send updates to TypeScript: {e}")

@app.websocket("/multi-agent/session/{session_id}/stream")
async def websocket_endpoint(websocket, session_id: str):
    """WebSocket endpoint for real-time updates"""
    
    await websocket.accept()
    
    try:
        while True:
            # Send current session updates
            if session_id in session_updates:
                await websocket.send_json(session_updates[session_id])
            
            await asyncio.sleep(1)  # Send updates every second
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
