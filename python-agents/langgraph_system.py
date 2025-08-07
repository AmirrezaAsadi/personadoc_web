import os
from typing import Dict, List, Any, Optional
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel
import asyncio
import json
import httpx
from datetime import datetime

class AgentState(BaseModel):
    """State shared between all agents in the multi-agent system"""
    messages: List[BaseMessage] = []
    personas: List[Dict[str, Any]] = []
    current_analysis: Optional[Dict[str, Any]] = None
    coordination_events: List[Dict[str, Any]] = []
    session_id: str
    user_query: str
    active_agents: List[str] = []
    results: Dict[str, Any] = {}

class PersonaDocAgent:
    """Base class for all PersonaDoc agents"""
    
    def __init__(self, name: str, role: str, persona_id: Optional[str] = None):
        self.name = name
        self.role = role
        self.persona_id = persona_id
        self.llm = ChatOpenAI(
            model="grok-3",  # Using Grok-3 as per your system
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url="https://api.x.ai/v1"
        )
        
    async def get_persona_context(self, persona_id: str) -> Dict[str, Any]:
        """Fetch persona data from TypeScript API"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://localhost:3000/api/personas/{persona_id}",
                headers={"Authorization": f"Bearer {os.getenv('API_TOKEN')}"}
            )
            return response.json() if response.status_code == 200 else {}
    
    async def execute(self, state: AgentState) -> Dict[str, Any]:
        """Execute agent logic - to be implemented by subclasses"""
        raise NotImplementedError

class AnalystAgent(PersonaDocAgent):
    """Agent that analyzes user queries and coordinates other agents"""
    
    def __init__(self):
        super().__init__("analyst", "Query Analysis & Coordination")
    
    async def execute(self, state: AgentState) -> Dict[str, Any]:
        # Analyze the query and determine which personas should respond
        analysis_prompt = f"""
        Analyze this user query and determine which personas from the available list should respond:
        
        Query: {state.user_query}
        Available Personas: {[p.get('name', 'Unknown') for p in state.personas]}
        
        Return a JSON with:
        1. relevant_personas: list of persona names that should respond
        2. analysis_type: type of analysis needed
        3. coordination_strategy: how agents should work together
        """
        
        response = await self.llm.ainvoke([HumanMessage(content=analysis_prompt)])
        
        try:
            analysis = json.loads(response.content)
        except:
            # Fallback if JSON parsing fails
            analysis = {
                "relevant_personas": [p.get('name', 'Unknown') for p in state.personas[:3]],
                "analysis_type": "general_analysis",
                "coordination_strategy": "parallel_then_synthesize"
            }
        
        # Add coordination event
        coordination_event = {
            "timestamp": datetime.now().isoformat(),
            "agent": self.name,
            "action": "query_analysis",
            "details": analysis
        }
        
        return {
            "messages": state.messages + [response],
            "current_analysis": analysis,
            "coordination_events": state.coordination_events + [coordination_event],
            "active_agents": analysis.get("relevant_personas", [])
        }

class PersonaAgent(PersonaDocAgent):
    """Agent that represents a specific persona"""
    
    def __init__(self, persona_data: Dict[str, Any]):
        super().__init__(
            name=persona_data.get('name', 'Unknown'),
            role=f"Persona: {persona_data.get('name', 'Unknown')}",
            persona_id=persona_data.get('id')
        )
        self.persona_data = persona_data
    
    async def execute(self, state: AgentState) -> Dict[str, Any]:
        # Generate response from this persona's perspective
        persona_context = f"""
        You are {self.persona_data.get('name', 'Unknown')}.
        Background: {self.persona_data.get('background', '')}
        Perspective: {self.persona_data.get('perspective', '')}
        Values: {self.persona_data.get('values', '')}
        
        Respond to this query from your unique perspective:
        {state.user_query}
        
        Consider the current analysis context: {state.current_analysis}
        """
        
        response = await self.llm.ainvoke([HumanMessage(content=persona_context)])
        
        # Add coordination event
        coordination_event = {
            "timestamp": datetime.now().isoformat(),
            "agent": self.name,
            "action": "persona_response",
            "details": {"response_length": len(response.content)}
        }
        
        # Store result for this persona
        results = state.results.copy()
        results[self.name] = {
            "response": response.content,
            "timestamp": datetime.now().isoformat(),
            "persona_id": self.persona_id
        }
        
        return {
            "messages": state.messages + [response],
            "coordination_events": state.coordination_events + [coordination_event],
            "results": results
        }

class SynthesizerAgent(PersonaDocAgent):
    """Agent that synthesizes responses from all personas"""
    
    def __init__(self):
        super().__init__("synthesizer", "Response Synthesis")
    
    async def execute(self, state: AgentState) -> Dict[str, Any]:
        # Synthesize all persona responses
        synthesis_prompt = f"""
        Synthesize the following persona responses into a coherent multi-perspective analysis:
        
        Original Query: {state.user_query}
        
        Persona Responses:
        {json.dumps(state.results, indent=2)}
        
        Create a synthesis that:
        1. Highlights key agreements and disagreements
        2. Shows different perspectives clearly
        3. Provides actionable insights
        4. Maintains the unique voice of each persona
        """
        
        response = await self.llm.ainvoke([HumanMessage(content=synthesis_prompt)])
        
        # Add coordination event
        coordination_event = {
            "timestamp": datetime.now().isoformat(),
            "agent": self.name,
            "action": "synthesis_complete",
            "details": {"synthesized_responses": len(state.results)}
        }
        
        return {
            "messages": state.messages + [response],
            "coordination_events": state.coordination_events + [coordination_event],
            "results": {**state.results, "synthesis": response.content}
        }

class PersonaDocMultiAgentSystem:
    """LangGraph-based multi-agent system for PersonaDoc"""
    
    def __init__(self):
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("analyst", self._analyst_node)
        workflow.add_node("personas", self._personas_node)
        workflow.add_node("synthesizer", self._synthesizer_node)
        
        # Add edges
        workflow.set_entry_point("analyst")
        workflow.add_edge("analyst", "personas")
        workflow.add_edge("personas", "synthesizer")
        workflow.add_edge("synthesizer", END)
        
        return workflow.compile()
    
    async def _analyst_node(self, state: AgentState) -> AgentState:
        """Execute analyst agent"""
        analyst = AnalystAgent()
        updates = await analyst.execute(state)
        
        # Update state
        for key, value in updates.items():
            setattr(state, key, value)
        
        return state
    
    async def _personas_node(self, state: AgentState) -> AgentState:
        """Execute all relevant persona agents in parallel"""
        relevant_personas = state.current_analysis.get("relevant_personas", [])
        
        # Create persona agents
        persona_agents = []
        for persona in state.personas:
            if persona.get('name') in relevant_personas:
                persona_agents.append(PersonaAgent(persona))
        
        # Execute all persona agents in parallel
        tasks = [agent.execute(state) for agent in persona_agents]
        results = await asyncio.gather(*tasks)
        
        # Merge all updates
        for updates in results:
            for key, value in updates.items():
                if key == "messages":
                    state.messages.extend(value[len(state.messages):])
                elif key == "coordination_events":
                    state.coordination_events.extend(value[len(state.coordination_events):])
                elif key == "results":
                    state.results.update(value)
        
        return state
    
    async def _synthesizer_node(self, state: AgentState) -> AgentState:
        """Execute synthesizer agent"""
        synthesizer = SynthesizerAgent()
        updates = await synthesizer.execute(state)
        
        # Update state
        for key, value in updates.items():
            if key == "messages":
                state.messages.extend(value[len(state.messages):])
            elif key == "coordination_events":
                state.coordination_events.extend(value[len(state.coordination_events):])
            else:
                setattr(state, key, value)
        
        return state
    
    async def run_analysis(self, session_id: str, user_query: str, personas: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run the complete multi-agent analysis"""
        
        # Initialize state
        initial_state = AgentState(
            session_id=session_id,
            user_query=user_query,
            personas=personas,
            messages=[],
            coordination_events=[],
            results={}
        )
        
        # Run the graph
        final_state = await self.graph.ainvoke(initial_state)
        
        return {
            "session_id": session_id,
            "synthesis": final_state.results.get("synthesis", ""),
            "persona_responses": {k: v for k, v in final_state.results.items() if k != "synthesis"},
            "coordination_events": final_state.coordination_events,
            "analysis": final_state.current_analysis
        }

# Global instance
multi_agent_system = PersonaDocMultiAgentSystem()
