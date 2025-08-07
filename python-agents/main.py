from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import httpx
import os
from dotenv import load_dotenv
import json
from datetime import datetime

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
    allow_origins=["http://localhost:3000", "https://www.personadock.com"],
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

@app.get("/debug/environment")
async def debug_environment():
    """Debug endpoint to check environment variables"""
    grok_key = os.getenv('GROK_API_KEY', 'not_set')
    return {
        "TYPESCRIPT_API_URL": os.getenv('TYPESCRIPT_API_URL', 'not_set'),
        "API_TOKEN": "***" if os.getenv('API_TOKEN') else 'not_set',
        "has_grok_api_key": bool(grok_key),
        "grok_key_length": len(grok_key) if grok_key != 'not_set' else 0,
        "grok_key_prefix": grok_key[:10] + "..." if len(grok_key) > 10 else grok_key,
        "grok_key_suffix": "..." + grok_key[-10:] if len(grok_key) > 10 else grok_key,
    }

@app.get("/debug/persona-fetch/{persona_id}")
async def debug_persona_fetch(persona_id: str):
    """Debug endpoint to test persona fetching"""
    api_base_url = os.getenv('TYPESCRIPT_API_URL', 'http://localhost:3000')
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{api_base_url}/api/personas/{persona_id}",
                headers={"Authorization": f"Bearer {os.getenv('API_TOKEN')}"},
                timeout=10.0
            )
            return {
                "url": f"{api_base_url}/api/personas/{persona_id}",
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "response": response.text if response.status_code != 200 else response.json()
            }
    except Exception as e:
        return {
            "url": f"{api_base_url}/api/personas/{persona_id}",
            "error": str(e)
        }

@app.get("/debug/last-analysis")
async def debug_last_analysis():
    """Debug endpoint to show the last analysis details"""
    if not google_adk_system:
        return {"error": "Google ADK system not available"}
    
    # Get the coordinator's current state
    coordinator = getattr(google_adk_system, '_last_coordinator', None)
    if coordinator:
        return {
            "registered_agents": list(coordinator.agents.keys()),
            "agent_details": {
                name: {
                    "role": agent.config.role,
                    "persona_id": getattr(agent.config, 'persona_id', None)
                }
                for name, agent in coordinator.agents.items()
            }
        }
    else:
        return {"error": "No coordinator found"}

@app.get("/debug/grok-test")
async def debug_grok_test():
    """Debug endpoint to test Grok API directly"""
    grok_api_key = os.getenv('GROK_API_KEY')
    
    if not grok_api_key:
        return {"error": "GROK_API_KEY not set"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.x.ai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {grok_api_key}"
                },
                json={
                    "messages": [{"role": "user", "content": "Test message from Railway"}],
                    "model": "grok-3",
                    "stream": False
                },
                timeout=30.0
            )
            return {
                "status_code": response.status_code,
                "response": response.json() if response.status_code == 200 else response.text,
                "api_key_prefix": grok_api_key[:10] + "..." if grok_api_key else "None"
            }
    except Exception as e:
        return {
            "error": str(e),
            "api_key_prefix": grok_api_key[:10] + "..." if grok_api_key else "None"
        }

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
        print(f"🔄 Starting Google ADK analysis with {len(personas)} personas")
        result = await google_adk_system.run_analysis(
            session_id=request.session_id,
            user_query=request.user_query,
            personas=personas
        )
        
        print(f"📊 Google ADK result keys: {list(result.keys())}")
        print(f"📊 Persona responses keys: {list(result.get('persona_responses', {}).keys())}")
        print(f"📊 Synthesis length: {len(str(result.get('synthesis', '')))}")
        print(f"📊 Coordination events count: {len(result.get('coordination_events', []))}")
        
        # Ensure synthesis is not None
        if result.get("synthesis") is None:
            result["synthesis"] = "Analysis completed but synthesis was not generated."
        
        # Store updates for streaming
        session_updates[request.session_id] = result
        
        # Send updates back to TypeScript API in background
        background_tasks.add_task(send_updates_to_typescript, request.session_id, result)
        
        return MultiAgentResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google ADK analysis failed: {str(e)}")

@app.post("/google-adk/analyze-stream")
async def stream_google_adk_analysis(request: MultiAgentRequest):
    """Stream Google ADK coordination process in real-time"""
    
    if not google_adk_system:
        raise HTTPException(status_code=503, detail="Google ADK system not available")
    
    async def generate_stream():
        try:
            # Initial event
            yield f"data: {json.dumps({'type': 'start', 'message': 'Starting Google ADK coordination...', 'timestamp': datetime.now().isoformat()})}\n\n"
            
            # Fetch personas
            yield f"data: {json.dumps({'type': 'event', 'message': 'Fetching persona data...', 'timestamp': datetime.now().isoformat()})}\n\n"
            
            personas = []
            api_base_url = os.getenv('TYPESCRIPT_API_URL', 'http://localhost:3000')
            
            async with httpx.AsyncClient() as client:
                for persona_id in request.persona_ids:
                    try:
                        yield f"data: {json.dumps({'type': 'event', 'message': f'Loading persona {persona_id}...', 'timestamp': datetime.now().isoformat()})}\n\n"
                        
                        response = await client.get(
                            f"{api_base_url}/api/personas/{persona_id}",
                            headers={"Authorization": f"Bearer {os.getenv('API_TOKEN')}"},
                            timeout=10.0
                        )
                        if response.status_code == 200:
                            persona_data = response.json()
                            personas.append(persona_data)
                            yield f"data: {json.dumps({'type': 'persona_loaded', 'persona': {'name': persona_data.get('name', 'Unknown'), 'id': persona_id}, 'timestamp': datetime.now().isoformat()})}\n\n"
                        else:
                            yield f"data: {json.dumps({'type': 'error', 'message': f'Failed to load persona {persona_id}', 'timestamp': datetime.now().isoformat()})}\n\n"
                    except Exception as e:
                        yield f"data: {json.dumps({'type': 'error', 'message': f'Error loading persona {persona_id}: {str(e)}', 'timestamp': datetime.now().isoformat()})}\n\n"
            
            if not personas:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No valid personas found', 'timestamp': datetime.now().isoformat()})}\n\n"
                return
            
            # Start coordination
            yield f"data: {json.dumps({'type': 'coordination_start', 'message': f'Starting coordination with {len(personas)} personas...', 'timestamp': datetime.now().isoformat()})}\n\n"
            
            # Process each persona
            persona_responses = {}
            for i, persona in enumerate(personas):
                persona_name = persona.get('name', f'Persona {i+1}')
                yield f"data: {json.dumps({'type': 'persona_thinking', 'persona': {'name': persona_name, 'id': persona.get('id')}, 'message': f'{persona_name} is analyzing the query...', 'timestamp': datetime.now().isoformat()})}\n\n"
                
                # Simulate some thinking time
                await asyncio.sleep(2)
                
                yield f"data: {json.dumps({'type': 'persona_responding', 'persona': {'name': persona_name, 'id': persona.get('id')}, 'message': f'{persona_name} is formulating response...', 'timestamp': datetime.now().isoformat()})}\n\n"
                
                # Get actual response (this would call the real Google ADK agent)
                try:
                    # For now, simulate the response - in real implementation, this would call the agent
                    await asyncio.sleep(3)  # Simulate processing time
                    
                    # This would be replaced with actual agent execution
                    response_content = f"Response from {persona_name} analyzing: {request.user_query}"
                    
                    persona_responses[persona_name] = {
                        "response": response_content,
                        "persona_id": persona.get('id'),
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    yield f"data: {json.dumps({'type': 'persona_completed', 'persona': {'name': persona_name, 'id': persona.get('id')}, 'response': response_content, 'timestamp': datetime.now().isoformat()})}\n\n"
                    
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'persona_error', 'persona': {'name': persona_name, 'id': persona.get('id')}, 'error': str(e), 'timestamp': datetime.now().isoformat()})}\n\n"
            
            # Synthesis phase
            yield f"data: {json.dumps({'type': 'synthesis_start', 'message': 'Generating synthesis from all perspectives...', 'timestamp': datetime.now().isoformat()})}\n\n"
            
            await asyncio.sleep(2)  # Simulate synthesis time
            
            synthesis = f"Synthesis of perspectives from {len(personas)} personas regarding: {request.user_query}"
            
            # Final result
            result = {
                "session_id": request.session_id,
                "synthesis": synthesis,
                "persona_responses": persona_responses,
                "coordination_events": [],
                "analysis": {
                    "total_personas": len(personas),
                    "successful_responses": len(persona_responses),
                    "execution_framework": "google-adk-streaming",
                    "model_used": "grok-3"
                }
            }
            
            yield f"data: {json.dumps({'type': 'completed', 'result': result, 'timestamp': datetime.now().isoformat()})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Stream error: {str(e)}', 'timestamp': datetime.now().isoformat()})}\n\n"
    
    return StreamingResponse(generate_stream(), media_type="text/plain")

@app.post("/multi-agent/analyze", response_model=MultiAgentResponse)
async def run_multi_agent_analysis(request: MultiAgentRequest, background_tasks: BackgroundTasks):
    """Run multi-agent analysis using LangGraph"""
    
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
        api_base_url = os.getenv('TYPESCRIPT_API_URL', 'http://localhost:3000')
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{api_base_url}/api/multi-agent-sessions/{session_id}/update",
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
