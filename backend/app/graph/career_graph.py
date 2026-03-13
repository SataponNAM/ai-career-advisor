import json
import re
import time
from typing import TypedDict, Optional
from openai import AsyncOpenAI
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.core.config import get_settings
from app.prompts.prompts import (
    SYSTEM_CAREER_ADVISOR,
    NODE1_ANALYZE_GOAL,
    NODE2_ANALYZE_SKILLS,
    NODE2_ANALYZE_SKILLS_WITH_GOAL,
    NODE_RECOMMEND,
    NODE_MULTI_CAREER_GAP,
    NODE_SKILL_UPGRADE,
    NODE3_MARKET_ANALYSIS,
    NODE4_CREATE_ROADMAP,
    NODE5_VALIDATE,
    FINAL_RESPONSE_TEMPLATE,
)
from app.tools.search_tool import CareerSearchTool

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

settings = get_settings()
openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

CACHE_TTL_SECONDS = 86400  # 24hr
MAX_RETRY = 2

# ─── In-memory Tavily Cache ───────────────────────────────────────────────────
_tavily_cache: dict[str, tuple[list, float]] = {}

def _cache_get(query: str) -> list | None:
    if query in _tavily_cache:
        result, ts = _tavily_cache[query]
        if time.time() - ts < settings.cache_ttl_seconds:
            return result
        del _tavily_cache[query]  # expired
    return None

def _cache_set(query: str, result: list) -> None:
    _tavily_cache[query] = (result, time.time())


async def search_cached(tool, query: str, max_results: int = 5) -> list:
    cached = _cache_get(query)
    if cached is not None:
        print(f"[Cache HIT] {query[:50]}")
        return cached
    print(f"[Cache MISS] {query[:50]}")
    result = await tool.search(query, max_results)
    _cache_set(query, result)
    return result

# ─── Helper ───────────────────────────────────────────────────────────────────

# async def call_llm(system: str, prompt: str, json_mode: bool = True):
#     response = await openai_client.chat.completions.create(
#         model=settings.openai_model,
#         response_format={"type": "json_object"} if json_mode else {"type": "text"},
#         messages=[
#             {"role": "system", "content": system},
#             {"role": "user", "content": prompt},
#         ],
#         temperature=0.3,
#     )
#     content = response.choices[0].message.content
#     if json_mode:
#         try:
#             return json.loads(content)
#         except json.JSONDecodeError:
#             match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", content)
#             return json.loads(match.group(1)) if match else {}
#     return content

# Alternative Gemini API call (if needed)
llm = ChatGoogleGenerativeAI(
    model=settings.gemini_model,
    google_api_key=settings.gemini_api_key,
    temperature=0.3,
)

async def call_llm(system: str, prompt: str, json_mode: bool = True):
    if json_mode:
        full_prompt = prompt + "\n\nIMPORTANT: Respond with valid JSON only. No markdown, no explanation."
    else:
        full_prompt = prompt

    response = await llm.ainvoke([
        SystemMessage(content=system),
        HumanMessage(content=full_prompt),
    ])
    content = response.content

    if json_mode:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", content)
            return json.loads(match.group(1)) if match else {}
    return content


# ── State ─────────────────────────────────────────────────────────────────────
class CareerState(TypedDict):
    message: str
    resume_text: Optional[str]
    career_goal: Optional[str]
    has_career_goal: Optional[bool]
    current_profile: Optional[dict]
    preferences: Optional[dict]

    # Skill analysis
    detected_skills: Optional[list]
    skill_sufficient: Optional[bool]
    career_skill_coverage: Optional[list]

    # Output per path
    recommended_careers: Optional[list]
    ready_careers: Optional[list]           # no_goal_sufficient
    near_reach_careers: Optional[list]      # no_goal_sufficient
    skill_gaps: Optional[list]              # has_goal

    # Skill upgrade (on-demand)
    selected_career_for_upgrade: Optional[str]
    skill_upgrade_plan: Optional[dict]

    # Market + Roadmap (has_goal)
    market_data: Optional[dict]
    roadmap: Optional[dict]

    # Path tracking
    path_type: Optional[str]  # "has_goal" | "no_goal_sufficient" | "no_goal_insufficient"
    previous_node: Optional[str]

    # Validation
    validation_result: Optional[dict]
    validation_passed: Optional[bool]
    validation_retry_count: Optional[int]

    final_response: Optional[str]
    error: Optional[str]

# ─── Node 1 ───────────────────────────────────────────────────────────────────
# Analyze career goal from user message and resume.
async def node1_analyze_goal(state: CareerState) -> CareerState:
    try:
        result = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE1_ANALYZE_GOAL.format(
                message=state["message"],
                resume_text=state.get("resume_text") or "No resume provided",
            ),
        )
        
        return {
            **state,
            "has_career_goal": result.get("has_career_goal", False),
            "career_goal": result.get("career_goal") or state.get("career_goal"),
            "current_profile": {
                "current_role": result.get("current_role"),
                "years_experience": result.get("years_experience"),
                "education": result.get("education"),
                "summary": result.get("summary", ""),
            },
            "preferences": result.get("preferences", state.get("preferences", {})),
            "validation_retry_count": 0,
        }
    except Exception as e:
        return {**state, "error": str(e), "has_career_goal": False, "validation_retry_count": 0}


# ─── Node 2a: Skill Check (no goal) ──────────────────────────────────────────

async def node2_analyze_skills(state: CareerState) -> CareerState:
    print("[Node2a] Skill analysis + sufficiency check")
    try:
        profile = state.get("current_profile", {})
        result = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE2_ANALYZE_SKILLS.format(
                current_role=profile.get("current_role", "Unknown"),
                years_experience=profile.get("years_experience", "Unknown"),
                education=profile.get("education", "Unknown"),
                resume_text=state.get("resume_text") or "No resume provided",
                message=state["message"],
                preferences=json.dumps(state.get("preferences", {}), ensure_ascii=False),
            ),
        )
        return {
            **state,
            "detected_skills": result.get("detected_skills", []),
            "skill_sufficient": result.get("skill_sufficient", False),
            "career_skill_coverage": result.get("career_skill_coverage", []),
        }
    except Exception as e:
        return {**state, "error": str(e), "skill_sufficient": False}
    
# ─── Node 2b: Gap Analysis (has goal) ────────────────────────────────────────

async def node2_analyze_gaps(state: CareerState) -> CareerState:
    print(f"[Node2b] Gap analysis for: {state.get('career_goal')}")
    try:
        profile = state.get("current_profile", {})
        result = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE2_ANALYZE_SKILLS_WITH_GOAL.format(
                current_role=profile.get("current_role", "Unknown"),
                years_experience=profile.get("years_experience", "Unknown"),
                education=profile.get("education", "Unknown"),
                career_goal=state.get("career_goal", ""),
                resume_text=state.get("resume_text") or "No resume provided",
                message=state["message"],
                preferences=json.dumps(state.get("preferences", {}), ensure_ascii=False),
            ),
        )
        return {
            **state,
            "detected_skills": result.get("detected_skills", []),
            "skill_gaps": result.get("skill_gaps", []),
            "recommended_careers": [{"title": state.get("career_goal"), "match_score": 0}],
            "path_type": "has_goal",
        }
    except Exception as e:
        return {**state, "error": str(e), "path_type": "has_goal"}

# ─── Node RecommendFull: skill_sufficient = true ──────────────────────────────

async def NODE_RECOMMEND(state: CareerState) -> CareerState:
    print("[NodeRecommendFull] Recommending all viable careers")
    try:
        result = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE_RECOMMEND.format(
                detected_skills=json.dumps(state.get("detected_skills", []), ensure_ascii=False),
                career_skill_coverage=json.dumps(state.get("career_skill_coverage", []), ensure_ascii=False),
                preferences=json.dumps(state.get("preferences", {}), ensure_ascii=False),
            ),
        )
        ready = result.get("ready_careers", [])
        near = result.get("near_reach_careers", [])
        return {
            **state,
            "ready_careers": ready,
            "near_reach_careers": near,
            "recommended_careers": ready,
            "path_type": "no_goal_sufficient",
        }
    except Exception as e:
        return {**state, "error": str(e), "path_type": "no_goal_sufficient"}
    
# ─── Node MultiCareerGap: skill_sufficient = false ────────────────────────────

async def node_multi_career_gap(state: CareerState) -> CareerState:
    print("[NodeMultiCareerGap]")
    try:
        tool = CareerSearchTool()

        top_skills = [s["name"] for s in (state.get("detected_skills") or [])[:3]]
        query = (f"career paths for {' '.join(top_skills)} Thailand 2025 2026"
                 if top_skills else "entry level tech careers Thailand")
        results = await search_cached(tool, query, max_results=5)
        market_data = {"results": results}

        result = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE_MULTI_CAREER_GAP.format(
                detected_skills=json.dumps(state.get("detected_skills", []), ensure_ascii=False),
                career_skill_coverage=json.dumps(state.get("career_skill_coverage", []), ensure_ascii=False),
                market_data=json.dumps(market_data, ensure_ascii=False)[:2000],
                preferences=json.dumps(state.get("preferences", {}), ensure_ascii=False),
            ),
        )
        return {
            **state,
            "recommended_careers": result.get("recommended_careers", []),
            "skill_gaps": [],
            "market_data": {"raw": market_data, "analysis": result},
            "path_type": "no_goal_insufficient",
        }
    except Exception as e:
        return {**state, "error": str(e), "path_type": "no_goal_insufficient"}

# ─── Node 3: Market Agent (has_goal) ─────────────────────────────────────────

async def node3_market_agent(state: CareerState) -> CareerState:
    print(f"[Node3] Market: {state.get('career_goal')}")
    try:
        from app.tools.search_tool import CareerSearchTool
        tool = CareerSearchTool()
        target_role = state.get("career_goal", "Software Developer")
        preferences = state.get("preferences", {})

        # Use cached search
        queries = {
            "skills": f"{target_role} required skills 2025 2026",
            "salary": f"{target_role} salary Thailand",
            "resources": f"best courses learn {target_role} free",
            "outlook": f"{target_role} job demand Thailand",
        }
        results = {}
        for key, query in queries.items():
            results[key] = await search_cached(tool, query)

        market_data = {
            "skills_data": results["skills"],
            "salary_data": results["salary"],
            "learning_resources": results["resources"],
            "market_outlook": results["outlook"],
        }

        gap_skills = [g["skill"] for g in (state.get("skill_gaps") or [])[:3]]
        if gap_skills:
            for skill in gap_skills:
                q = f"best free course learn {skill} 2025 2026"
                skill_results = await search_cached(tool, q, max_results=3)
                market_data.setdefault("skill_resources", []).extend(skill_results)

        result = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE3_MARKET_ANALYSIS.format(
                target_role=target_role,
                current_skills=json.dumps((state.get("detected_skills") or [])[:10]),
                skill_gaps=json.dumps((state.get("skill_gaps") or [])[:5]),
                preferences=json.dumps(preferences, ensure_ascii=False),
                exclude_work_type=preferences.get("exclude_work_type", []),
                prefer_industry=preferences.get("prefer_industry", []),
                market_data=json.dumps(market_data, ensure_ascii=False)[:3000],
            ),
        )
        return {
            **state,
            "market_data": {"raw": market_data, "analysis": result},
            "skill_gaps": result.get("updated_skill_gaps", state.get("skill_gaps", [])),
        }
    except Exception as e:
        return {**state, "error": str(e), "market_data": {}}