import os
import asyncio
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Google ADK imports for coordination
import vertexai
from vertexai.generative_models import GenerativeModel, ChatSession
from google.cloud import aiplatform
import google.generativeai as genai

# Base imports
from pydantic import BaseModel
import httpx

# Grok-3 API integration
class GrokAPI:
    """Grok-3 API client for AI completions"""
    
    def __init__(self):
        self.api_key = os.getenv("GROK_API_KEY")  # Using X.AI API key for Grok
        self.base_url = "https://api.x.ai/v1"
        self.model = "grok-3"
    
    async def complete(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Get completion from Grok-3"""
        try:
            if not self.api_key:
                raise Exception("GROK_API_KEY not set")
                
            async with httpx.AsyncClient() as client:
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.7
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    error_text = response.text
                    print(f"Grok API error {response.status_code}: {error_text}")
                    raise Exception(f"Grok API error {response.status_code}: {error_text}")
        except Exception as e:
            print(f"Grok completion error: {str(e)}")
            raise Exception(f"Grok completion failed: {str(e)}")

@dataclass
class AgentConfig:
    """Configuration for Google ADK agents"""
    name: str
    role: str
    persona_id: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2048

class GoogleADKAgentState(BaseModel):
    """Shared state for Google ADK multi-agent system"""
    session_id: str
    user_query: str
    personas: List[Dict[str, Any]] = []
    agent_responses: Dict[str, Any] = {}
    coordination_events: List[Dict[str, Any]] = []
    synthesis: Optional[str] = None
    status: str = "initialized"

class GoogleADKCoordinator:
    """Google ADK-based coordination system using Grok-3 for intelligence"""
    
    def __init__(self):
        self.grok = GrokAPI()
        self.agents: Dict[str, 'GoogleADKAgent'] = {}
        self.event_bus = []  # Simple event bus for coordination
        self.message_router = {}  # Message routing system
    
    async def register_agent(self, agent: 'GoogleADKAgent'):
        """Register an agent with the coordinator"""
        self.agents[agent.config.name] = agent
        await self._emit_coordination_event({
            "type": "agent_registered",
            "agent": agent.config.name,
            "role": agent.config.role,
            "timestamp": datetime.now().isoformat()
        })
    
    async def coordinate_agents(self, state: GoogleADKAgentState) -> GoogleADKAgentState:
        """Coordinate agent interactions using Google ADK patterns"""
        
        # Analyze coordination needs
        coordination_plan = await self._analyze_coordination_needs(state)
        
        # Execute coordination plan
        for step in coordination_plan.get("steps", []):
            await self._execute_coordination_step(step, state)
        
        return state
    
    async def _analyze_coordination_needs(self, state: GoogleADKAgentState) -> Dict[str, Any]:
        """Use Grok-3 to analyze coordination requirements"""
        
        prompt = f"""
        Analyze this multi-agent scenario and create a coordination plan:
        
        User Query: {state.user_query}
        Available Agents: {list(self.agents.keys())}
        Agent Roles: {[agent.config.role for agent in self.agents.values()]}
        
        Create a coordination plan with:
        1. Execution order (sequential/parallel)
        2. Information dependencies between agents
        3. Synchronization points
        4. Conflict resolution strategy
        
        Return as JSON with steps array.
        """
        
        system_prompt = "You are a multi-agent coordination specialist. Create efficient coordination plans."
        
        response = await self.grok.complete(prompt, system_prompt)
        
        try:
            return json.loads(response)
        except:
            # Fallback coordination plan
            return {
                "steps": [
                    {"type": "parallel_execution", "agents": list(self.agents.keys())},
                    {"type": "synthesis", "agent": "coordinator"}
                ]
            }
    
    async def _execute_coordination_step(self, step: Dict[str, Any], state: GoogleADKAgentState):
        """Execute a coordination step"""
        
        step_type = step.get("type")
        print(f"🔄 Executing coordination step: {step_type}")
        
        if step_type == "parallel_execution":
            # Execute agents in parallel
            agents_to_run = step.get("agents", [])
            print(f"🤖 Running {len(agents_to_run)} agents: {agents_to_run}")
            tasks = []
            
            for agent_name in agents_to_run:
                if agent_name in self.agents:
                    print(f"✅ Adding task for agent: {agent_name}")
                    tasks.append(self.agents[agent_name].execute(state))
                else:
                    print(f"❌ Agent not found: {agent_name}")
            
            # Wait for all agents to complete
            print(f"⏳ Waiting for {len(tasks)} agents to complete...")
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for i, result in enumerate(results):
                agent_name = agents_to_run[i] if i < len(agents_to_run) else f"unknown_{i}"
                if not isinstance(result, Exception):
                    print(f"✅ Agent {agent_name} completed successfully")
                    state.agent_responses[agent_name] = result
                else:
                    print(f"❌ Agent {agent_name} failed: {result}")
                    state.agent_responses[agent_name] = {
                        "error": str(result),
                        "agent": agent_name,
                        "timestamp": datetime.now().isoformat()
                    }
        
        elif step_type == "synthesis":
            # Synthesize all agent responses
            print(f"🧠 Starting synthesis with {len(state.agent_responses)} agent responses")
            await self._synthesize_responses(state)
            print(f"📝 Synthesis completed, length: {len(str(state.synthesis))}")
        
        # Emit coordination event
        await self._emit_coordination_event({
            "type": "coordination_step_completed",
            "step": step,
            "timestamp": datetime.now().isoformat()
        })
    
    async def _synthesize_responses(self, state: GoogleADKAgentState):
        """Use Grok-3 to synthesize all agent responses"""
        
        prompt = f"""
        Synthesize these multi-persona responses into a comprehensive analysis:
        
        Original Query: {state.user_query}
        
        Agent Responses:
        {json.dumps(state.agent_responses, indent=2)}
        
        Create a synthesis that:
        1. Highlights key insights from each perspective
        2. Identifies agreements and disagreements
        3. Provides actionable recommendations
        4. Maintains the unique voice of each persona
        """
        
        system_prompt = "You are an expert at synthesizing diverse perspectives into coherent insights."
        
        synthesis = await self.grok.complete(prompt, system_prompt)
        state.synthesis = synthesis
        state.status = "completed"
    
    async def _emit_coordination_event(self, event: Dict[str, Any]):
        """Emit a coordination event"""
        self.event_bus.append(event)

class GoogleADKAgent:
    """Google ADK-based agent for PersonaDoc using Grok-3 for intelligence"""
    
    def __init__(self, config: AgentConfig, persona_data: Optional[Dict[str, Any]] = None):
        self.config = config
        self.persona_data = persona_data or {}
        self.grok = GrokAPI()
    
    async def execute(self, state: GoogleADKAgentState) -> Dict[str, Any]:
        """Execute agent logic using Grok-3 for intelligence"""
        
        # Build persona-specific prompt
        if self.persona_data:
            persona_prompt = f"""
            You are {self.persona_data.get('name', 'Unknown')}.
            Background: {self.persona_data.get('background', '')}
            Perspective: {self.persona_data.get('perspective', '')}
            Values: {self.persona_data.get('values', '')}
            
            Respond to this query from your unique perspective:
            {state.user_query}
            
            Be authentic to your persona while providing valuable insights.
            """
        else:
            persona_prompt = f"""
            You are {self.config.name}, a {self.config.role}.
            
            Analyze this query and provide your expert perspective:
            {state.user_query}
            """
        
        # Get response from Grok-3
        try:
            response = await self.grok.complete(
                prompt=persona_prompt,
                system_prompt=f"You are {self.config.name}, an expert {self.config.role}. Provide thoughtful, persona-appropriate responses."
            )
            
            return {
                "agent": self.config.name,
                "role": self.config.role,
                "response": response,
                "persona_id": self.config.persona_id,
                "timestamp": datetime.now().isoformat(),
                "model_used": "grok-3"
            }
            
        except Exception as e:
            print(f"Error executing agent {self.config.name}: {e}")
            return {
                "agent": self.config.name,
                "role": self.config.role,
                "response": f"Error: Unable to generate response ({str(e)})",
                "persona_id": self.config.persona_id,
                "timestamp": datetime.now().isoformat(),
                "model_used": "grok-3",
                "error": True
            }
        
        start_time = datetime.now()
        
        try:
            # Get persona context if this is a persona agent
            persona_context = ""
            if self.config.persona_id:
                persona_data = await self.get_persona_context(self.config.persona_id)
                persona_context = f"""
                You are {persona_data.get('name', 'Unknown')}.
                Background: {persona_data.get('background', '')}
                Perspective: {persona_data.get('perspective', '')}
                Values: {persona_data.get('values', '')}
                Occupation: {persona_data.get('occupation', '')}
                Location: {persona_data.get('location', '')}
                """
            
            # Create role-specific prompt
            if self.config.role == "coordinator":
                prompt = self._create_coordinator_prompt(state, persona_context)
            elif self.config.role == "persona":
                prompt = self._create_persona_prompt(state, persona_context)
            elif self.config.role == "synthesizer":
                prompt = self._create_synthesizer_prompt(state, persona_context)
            else:
                prompt = f"{persona_context}\n\nUser Query: {state.user_query}"
            
            # Generate response using Google ADK
            if self.model:
                if hasattr(self.model, 'generate_content'):  # Gemini API
                    response = await asyncio.to_thread(self.model.generate_content, prompt)
                    content = response.text
                else:  # Vertex AI
                    response = await asyncio.to_thread(self.model.generate_content, prompt)
                    content = response.text
            else:
                content = f"Agent {self.config.name} is not properly initialized"
            
            # Create coordination event
            coordination_event = {
                "timestamp": datetime.now().isoformat(),
                "agent": self.config.name,
                "role": self.config.role,
                "action": "response_generated",
                "execution_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                "model_used": self.config.model_name,
                "framework": "google-adk"
            }
            
            return {
                "agent_name": self.config.name,
                "role": self.config.role,
                "response": content,
                "coordination_event": coordination_event,
                "persona_id": self.config.persona_id,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            error_event = {
                "timestamp": datetime.now().isoformat(),
                "agent": self.config.name,
                "role": self.config.role,
                "action": "error",
                "error": str(e),
                "framework": "google-adk"
            }
            
            return {
                "agent_name": self.config.name,
                "role": self.config.role,
                "response": f"Error in {self.config.name}: {str(e)}",
                "coordination_event": error_event,
                "persona_id": self.config.persona_id,
                "timestamp": datetime.now().isoformat()
            }
    
    def _create_coordinator_prompt(self, state: GoogleADKAgentState, persona_context: str) -> str:
        return f"""
        {persona_context}
        
        You are the Coordinator Agent in a multi-agent analysis system.
        
        User Query: {state.user_query}
        Available Personas: {[p.get('name', 'Unknown') for p in state.personas]}
        
        Your tasks:
        1. Analyze the user query
        2. Determine which personas should respond
        3. Identify key discussion points
        4. Suggest coordination strategy
        
        Provide a structured analysis in JSON format:
        {{
            "query_analysis": "analysis of the user query",
            "relevant_personas": ["list", "of", "persona", "names"],
            "key_topics": ["topic1", "topic2"],
            "coordination_strategy": "how agents should work together",
            "expected_outcomes": "what we expect to achieve"
        }}
        """
    
    def _create_persona_prompt(self, state: GoogleADKAgentState, persona_context: str) -> str:
        return f"""
        {persona_context}
        
        Respond to this query from your unique perspective and expertise:
        
        Query: {state.user_query}
        
        Consider:
        - Your background and experience
        - Your values and worldview
        - Your professional expertise
        - Any relevant personal experiences
        
        Provide a thoughtful, authentic response that reflects your perspective.
        Keep it focused and actionable where appropriate.
        """
    
    def _create_synthesizer_prompt(self, state: GoogleADKAgentState, persona_context: str) -> str:
        return f"""
        {persona_context}
        
        You are the Synthesizer Agent. Your role is to synthesize responses from multiple personas.
        
        Original Query: {state.user_query}
        
        Agent Responses:
        {json.dumps(state.agent_responses, indent=2)}
        
        Create a comprehensive synthesis that:
        1. Highlights key insights from each perspective
        2. Identifies areas of agreement and disagreement
        3. Synthesizes actionable recommendations
        4. Maintains the unique voice of each persona
        5. Provides a balanced, multi-perspective analysis
        
        Format as a well-structured analysis with clear sections.
        """

class GoogleADKMultiAgentSystem:
    """Google ADK-based multi-agent system for PersonaDoc"""
    
    def __init__(self):
        self.agents = {}
        
    async def run_analysis(
        self, 
        session_id: str, 
        user_query: str, 
        personas: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Run multi-agent analysis using Google ADK"""
        
        print(f"🚀 Starting Google ADK multi-agent analysis for session {session_id}")
        
        # Initialize state
        state = GoogleADKAgentState(
            session_id=session_id,
            user_query=user_query,
            personas=personas,
            status="running"
        )
        
        try:
            # Initialize Google ADK coordinator for orchestration
            coordinator = GoogleADKCoordinator()
            
            # Phase 1: Create and register agents
            agents = []
            
            # Create coordinator agent
            coord_agent = GoogleADKAgent(AgentConfig(
                name="coordinator",
                role="Analysis Coordinator",
                temperature=0.3
            ))
            await coordinator.register_agent(coord_agent)
            agents.append(coord_agent)
            
            print(f"✅ Coordinator agent registered")
            
            # Phase 2: Create persona agents
            for persona in personas:
                agent = GoogleADKAgent(
                    AgentConfig(
                        name=persona.get('name', 'Unknown'),
                        role="Persona Analyst",
                        persona_id=persona.get('id'),
                        temperature=0.7
                    ),
                    persona_data=persona
                )
                await coordinator.register_agent(agent)
                agents.append(agent)
            
            print(f"✅ {len(personas)} persona agents registered")
            
            # Phase 3: Create synthesizer agent
            synthesizer_agent = GoogleADKAgent(AgentConfig(
                name="synthesizer",
                role="Response Synthesizer",
                temperature=0.4
            ))
            await coordinator.register_agent(synthesizer_agent)
            agents.append(synthesizer_agent)
            
            print(f"✅ Synthesizer agent registered")
            
            # Phase 4: Execute coordination using Google ADK patterns
            final_state = await coordinator.coordinate_agents(state)
            
            print(f"✅ Google ADK coordination complete")
            
            # Final result
            final_state.status = "completed"
            
            return {
                "session_id": session_id,
                "synthesis": final_state.synthesis,
                "persona_responses": {
                    name: data.get("response", "") 
                    for name, data in final_state.agent_responses.items()
                },
                "coordination_events": final_state.coordination_events,
                "analysis": {
                    "total_agents": len(agents),
                    "execution_framework": "google-adk-with-grok3",
                    "model_used": "grok-3",
                    "coordination_system": "google-adk"
                },
                "status": final_state.status
            }
            
        except Exception as e:
            print(f"❌ Google ADK analysis failed: {e}")
            
            error_event = {
                "timestamp": datetime.now().isoformat(),
                "agent": "system",
                "action": "system_error",
                "error": str(e),
                "framework": "google-adk"
            }
            
            state.coordination_events.append(error_event)
            state.status = "failed"
            
            return {
                "session_id": session_id,
                "synthesis": f"Analysis failed: {str(e)}",
                "persona_responses": {},
                "coordination_events": state.coordination_events,
                "analysis": {"error": str(e), "framework": "google-adk"},
                "status": "failed"
            }

# Global instance
google_adk_system = GoogleADKMultiAgentSystem()
