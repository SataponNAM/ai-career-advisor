import asyncio
import datetime
import json
import re
import time
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage


from app.core.config import get_settings
from app.prompts.prompts import (
    NODE_SKILL_UPGRADE,
    SYSTEM_CAREER_ADVISOR,
    NODE1_ANALYZE_GOAL,
    NODE2_ANALYZE_SKILLS,
    NODE2_ANALYZE_SKILLS_WITH_GOAL,
    NODE_RECOMMEND,
    NODE_MULTI_CAREER_GAP,
    NODE3_MARKET_ANALYSIS,
    NODE4_CREATE_ROADMAP,
    NODE5_VALIDATE,
    FINAL_RESPONSE_TEMPLATE,
)
from app.graph.models import (
    parse,
    Node1Output, Node2aOutput, Node2bOutput,
    RecommendFullOutput, MultiGapOutput,
    Node3Output, Node4Output, Node5Output,
)
from app.tools.search_tool import CareerSearchTool

settings = get_settings()

CACHE_TTL_SECONDS = 86400  # 24hr
MAX_RETRY = 1

RETRY_TARGET: dict[str, str] = {
    "node4":          "node4_roadmap",
    "recommend_full": "recommend_full",
    "multi_gap":      "multi_career_gap",
}

# ─── In-memory Tavily Cache ───────────────────────────────────────────────────
# รูปแบบ: { "คำค้นหา": (ผลลัพธ์, เวลาที่บันทึก) }
tavily_cache: dict[str, tuple[list, float]] = {}

async def search_cached(tool: CareerSearchTool, query: str, max_results: int = 5) -> list:
    if query in tavily_cache:
        result, timestamp = tavily_cache[query]
        
        # ถ้าเวลายังไม่หมดอายุ -> ดึงของเดิมมาใช้
        if time.time() - timestamp < settings.cache_ttl_seconds:
            print(f"[Cache HIT] {query[:50]}")
            return result
        else:
            # ถ้าหมดอายุแล้ว ให้ลบทิ้ง
            del tavily_cache[query]

    # ไม่มีข้อมูลใน Cache ค้นหาใหม่
    print(f"[Cache MISS] {query[:50]}")
    result = await tool.search(query, max_results)
    
    # Save to cache
    tavily_cache[query] = (result, time.time())
    
    return result

# ─── Helper ───────────────────────────────────────────────────────────────────

llm = ChatGoogleGenerativeAI(
    model=settings.gemini_model,
    google_api_key=settings.gemini_api_key,
    temperature=0.3,
)

async def call_llm(system: str, prompt: str, json_mode: bool = True):
    response = await llm.ainvoke([
        SystemMessage(content=system),
        HumanMessage(content=prompt),
    ])
    content = response.content

    # Gemini may return content as a list of blocks; extract text
    if isinstance(content, list):
        content = " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )

    if not content or not str(content).strip():
        print("[call_llm] ⚠️ LLM returned empty content")
        return {} if json_mode else ""

    if not json_mode:
        return str(content).strip()

    # Strip markdown fences first (Gemini often wraps JSON in ```json ... ```)
    stripped = content.strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", stripped)
    if fence_match:
        stripped = fence_match.group(1).strip()

    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        # Try extracting first {...} block from raw content
        brace_match = re.search(r"(\{[\s\S]+\})", content)
        if brace_match:
            try:
                return json.loads(brace_match.group(1))
            except json.JSONDecodeError:
                pass
        print(f"[call_llm] ⚠️ Could not parse JSON. Raw content (first 500 chars):\n{content[:500]}")
        return {}

def to_dict(value) -> dict:
    if isinstance(value, dict):
        return value
    if hasattr(value, "model_dump"):
        return value.model_dump()
    return {}

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
    market_data: Optional[dict] # {raw: dict, analysis: Node3Output}
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

async def analyze_goal(state: CareerState) -> CareerState:
  print(f"▶ Node1:Analyze goal...")
  try:
      raw = await call_llm(
          system=SYSTEM_CAREER_ADVISOR,
          prompt=NODE1_ANALYZE_GOAL.format(
              message=state["message"],
              resume_text=state.get("resume_text") or "none",
          ),
      )
      result: Node1Output = parse(Node1Output, raw)

      return {
          **state,
          "has_career_goal": result.has_career_goal,
          "career_goal": result.career_goal or state.get("career_goal"),
          "current_profile": {
              "current_role": result.current_role,
              "years_experience": result.years_experience,
              "education": result.education,
              "summary": result.summary,
          },
          "preferences": result.preferences.model_dump(),
          "validation_retry_count": 0,
      }
  except Exception as e:
      return {**state, "error": str(e), "has_career_goal": False, "validation_retry_count": 0}
  
# ─── Node 2a: Skill Check (no goal) ──────────────────────────────────────────
# วิเคราะห์ทักษะที่มีอยู่และความเหมาะสมกับอาชีพต่าง ไม่มีเป้าหมายอาชีพที่ชัดเจน เช็คว่าทักษะเพียงพอหรือไม่

async def analyze_skills(state: CareerState) -> CareerState:
    print(f"▶ Node 2: Skills check...")
    try:
        tool = CareerSearchTool()
        profile = state.get("current_profile", {})
        prefs_json = json.dumps(state.get("preferences", {}), ensure_ascii=False)

        ind = " ".join(state.get("preferences", {}).get("prefer_industry", []))
        market_results = await search_cached(
            tool, f"in-demand tech careers required skills Thailand {ind}".strip()
        )
        market_data_json = json.dumps(market_results, ensure_ascii=False)

        raw = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE2_ANALYZE_SKILLS.format(
                current_role=profile.get("current_role", "Unknown"),
                years_experience=profile.get("years_experience", "Unknown"),
                education=profile.get("education", "Unknown"),
                resume_text=state.get("resume_text") or "No resume provided",
                message=state.get("message", ""),
                preferences=prefs_json,
                market_data=market_data_json,
            ),
        )
        result: Node2aOutput = parse(Node2aOutput, raw)

        years_exp = profile.get("years_experience", 0)
        try:
            years_exp_num = float(str(years_exp).replace("+", ""))
        except (ValueError, TypeError):
            years_exp_num = 0

        if years_exp_num == 0 or str(years_exp).lower() in ("0", "unknown", "none", ""):
            max_coverage = max(
                (c.coverage_percent for c in result.career_skill_coverage), default=0
            )
            if max_coverage < 80:
                result.skill_sufficient = False

        return {
            **state,
            "detected_skills": [s.model_dump() for s in result.detected_skills],
            "skill_sufficient": result.skill_sufficient,
            "career_skill_coverage": [c.model_dump() for c in result.career_skill_coverage],
        }
    except Exception as e:
        return {**state, "error": str(e), "skill_sufficient": False}
    
# ─── Node 2b: Gap Analysis (has goal) ────────────────────────────────────────
# วิเคราะห์ช่องว่างของทักษะสำหรับเป้าหมายอาชีพที่ชัดเจน

async def analyze_gaps(state: CareerState) -> CareerState:
    print(f"[Node2b] Gap analysis for: {state.get('career_goal')}")
    try:
        profile = state.get("current_profile", {})

        prefs_json = json.dumps(state.get("preferences", {}), ensure_ascii=False)

        raw = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE2_ANALYZE_SKILLS_WITH_GOAL.format(
                current_role=profile.get("current_role", "Unknown"),
                years_experience=profile.get("years_experience", "Unknown"),
                education=profile.get("education", "Unknown"),
                career_goal=state.get("career_goal", ""),
                resume=state.get("resume_text") or "No resume provided",
                message=state.get("message", ""),
                preferences=prefs_json,
            ),
        )
        result: Node2bOutput = parse(Node2bOutput, raw)

        return {
            **state,
            "detected_skills": [skill.model_dump() for skill in result.detected_skills],
            "skill_gaps": [gap.model_dump() for gap in result.skill_gaps],
            "recommended_careers": [{"title": state.get("career_goal"), "match_score": 0}],
            "path_type": "has_goal",
        }
    except Exception as e:
        print(f"[Node2b] fallback due to error: {e}")
        return {
            **state,
            "detected_skills": state.get("detected_skills") or [],
            "skill_gaps": state.get("skill_gaps") or [],
            "recommended_careers": [{"title": state.get("career_goal") or "Target Role", "match_score": 0}],
            "path_type": "has_goal",
            "error": None,
        }

# ─── Node RecommendFull: skill_sufficient = true ──────────────────────────────
#  แนะนำเส้นทางอาชีพที่เหมาะสมโดยพิจารณาจากทักษะที่มีอยู่และความชอบของผู้ใช้ ไม่มีเป้าหมายอาชีพที่ชัดเจนทักษะเพียงพอ
async def node_recommend(state: CareerState) -> CareerState:
    print(f"▶ Node Recommend Career")
    try:
        detected_skills_json = json.dumps(state.get("detected_skills", []), ensure_ascii=False)
        career_coverage_json = json.dumps(state.get("career_skill_coverage", []), ensure_ascii=False, separators=(",", ":"))
        pref_json = json.dumps(state.get("preferences", {}), ensure_ascii=False)

        raw = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE_RECOMMEND.format(
                detected_skills=detected_skills_json,
                career_skill_coverage=career_coverage_json,
                preferences=pref_json,
            ),
        )
        result: RecommendFullOutput = parse(RecommendFullOutput, raw)

        ready = [rc.model_dump() for rc in result.ready_careers]

        return {
            **state,
            "ready_careers": ready,
            "near_reach_careers": [career.model_dump() for career in result.near_reach_careers],
            "recommended_careers": ready,
            "path_type": "no_goal_sufficient",
            "previous_node": "recommend_full",
        }
    except Exception as e:
        return {**state, "error": str(e), "path_type": "no_goal_sufficient"}
    
# ─── Node MultiCareerGap: skill_sufficient = false ────────────────────────────
#  แนะนำเส้นทางอาชีพที่เหมาะสมโดยพิจารณาจากทักษะที่มีอยู่ ไม่มีเป้าหมายอาชีพที่ชัดเจน และทักษะยังไม่เพียงพอ
async def node_multi_career_gap(state: CareerState) -> CareerState:
    print(f"▶ Node Multi-Career Gap Analysis")
    try:
        tool = CareerSearchTool()

        top_skills = [s["name"] for s in (state.get("detected_skills") or [])[:3]]
        query = (f"career paths for {' '.join(top_skills)} Thailand 2025 2026"
                 if top_skills else "entry level tech careers Thailand")
        results = await search_cached(tool, query, max_results=5)
        market_data = {"results": results}

        detected_skills_json = json.dumps(state.get("detected_skills", []), ensure_ascii=False)
        career_coverage_json = json.dumps(state.get("career_skill_coverage", []), ensure_ascii=False)
        market_data_json = json.dumps(market_data, ensure_ascii=False)
        pref_json = json.dumps(state.get("preferences", {}), ensure_ascii=False)

        raw = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE_MULTI_CAREER_GAP.format(
                detected_skills=detected_skills_json,
                career_skill_coverage=career_coverage_json,
                market_data=market_data_json,
                preferences=pref_json,
            ),
        )
        result: MultiGapOutput = parse(MultiGapOutput, raw)

        return {
            **state,
            "recommended_careers": [career.model_dump() for career in result.recommended_careers],
            "skill_gaps": [],
            "market_data": {"raw": market_data, "analysis": result.model_dump()},
            "path_type": "no_goal_insufficient",
            "previous_node": "multi_gap",
        }
    except Exception as e:
        return {**state, "error": str(e), "path_type": "no_goal_insufficient"}

# ── NodeSkillUpgrade (on-demand) ──────────────────────────────────────────────

async def node_skill_upgrade(state: CareerState) -> CareerState:
    career = state.get("selected_career_for_upgrade", "")

    try:
        tool = CareerSearchTool()

        results = await search_cached(tool, f"learn {career} skills courses resources 2024")
        raw = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE_SKILL_UPGRADE.format(
                detected_skills=json.dumps(state.get("detected_skills", []), ensure_ascii=False),
                ready_careers=json.dumps(state.get("ready_careers", []), ensure_ascii=False),
                selected_career=career,
                market_data=json.dumps({"results": results}, ensure_ascii=False)[:2000],
            ),
        )

        return {**state, "skill_upgrade_plan": raw}
    except Exception as e:
        return {**state, "error": str(e)}

# ─── Node 3: Market Agent (has_goal) ─────────────────────────────────────────
# วิเคราะห์ตลาดงานสำหรับเป้าหมายอาชีพ
async def market_agent(state: CareerState) -> CareerState:
    print(f"▶ Node Market Agent")
    market_data = {}
    try:
        tool = CareerSearchTool()
        target_role = state.get("career_goal", "Software Developer")
        preferences = state.get("preferences", {})
        industry = " ".join(preferences.get("prefer_industry", []))
        excludedWorkType = " -startup" if "startup" in preferences.get("exclude_work_type", []) else ""

        results = await asyncio.gather(
            search_cached(tool, f"{target_role} required skills 2025 2026"),
            search_cached(tool, f"{target_role} salary Thailand {industry}{excludedWorkType}"),
            search_cached(tool, f"best courses learn {target_role} free"),
            search_cached(tool, f"{target_role} job demand Thailand"),
        )

        market_data = {
            "skills_data": results[0],
            "salary_data": results[1],
            "learning_resources": results[2],
            "market_outlook": results[3],
        }

        gap_skills = [gap["skill"] for gap in (state.get("skill_gaps") or [])[:3]]
        for skill in gap_skills:
            query = f"best free course learn {skill} 2026"
            skill_results = await search_cached(tool, query, max_results=3)
            market_data.setdefault("skill_resources", []).extend(skill_results)

        skills_json = json.dumps((state.get("detected_skills") or [])[:10])
        skill_gaps_json = json.dumps((state.get("skill_gaps") or [])[:5])
        prefs_json = json.dumps(preferences, ensure_ascii=False)
        ex_work_type_json = json.dumps(preferences.get("exclude_work_type", []), ensure_ascii=False)
        prefer_industry_json = json.dumps(preferences.get("prefer_industry", []), ensure_ascii=False)
        market_json = json.dumps(market_data, ensure_ascii=False)[:3000]

        raw = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE3_MARKET_ANALYSIS.format(
                target_role=target_role,
                current_skills=skills_json,
                skill_gaps=skill_gaps_json,
                preferences=prefs_json,
                exclude_work_type=ex_work_type_json,
                prefer_industry=prefer_industry_json,
                market_data=market_json,
            ),
        )
        result: Node3Output = parse(Node3Output, raw)

        return {
            **state,
            "market_data": {"raw": market_data, "analysis": result.model_dump()},
            "skill_gaps": [gap.model_dump() for gap in result.updated_skill_gaps],
        }
    except Exception as e:
        print(f"[Node3] fallback due to error: {e}")
        fallback_analysis = {
            "updated_skill_gaps": state.get("skill_gaps") or [],
            "salary_range": {},
            "market_insights": [],
            "top_companies": [],
            "market_trend": "",
        }
        return {
            **state,
            "market_data": {"raw": market_data, "analysis": fallback_analysis},
            "error": None,
        }

# ── Node 4: Roadmap Planner ───────────────────────────────────────────────────
async def create_roadmap(state: CareerState) -> CareerState:
    print(f"▶ Node Roadmap Planner")
    retry = state.get("validation_retry_count", 0)

    try:
        market_analysis = to_dict((state.get("market_data") or {}).get("analysis", {}))
        market_raw = (state.get("market_data") or {}).get("raw", {})

        retry_context = ""
        if retry > 0:
            issues = (state.get("validation_result") or {}).get("issues", [])

            if issues:
                retry_context = "\n\nIMPORTANT — Fix these issues:\n" + "\n".join(
                    f"- [{issue['severity']}] {issue['section']}: {issue['issue']} → {issue['fix']}"
                    for issue in issues
                )

        skills_json = json.dumps((state.get("detected_skills") or [])[:10])
        skill_gaps_json = json.dumps((state.get("skill_gaps") or [])[:5])
        market_json = json.dumps(market_analysis.get("market_insights", []), ensure_ascii=False)
        resource_json = json.dumps(market_raw.get("learning_resources", [])[:5], ensure_ascii=False)[:2000]
        prefs_json = json.dumps(state.get("preferences", {}), ensure_ascii=False)

        raw = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=NODE4_CREATE_ROADMAP.format(
                target_role=state.get("career_goal", "Target Role"),
                current_skills=skills_json,
                skill_gaps=skill_gaps_json,
                market_insights=market_json,
                resources_data=resource_json,
                preferences=prefs_json,
            ) + retry_context,
        )
        result: Node4Output = parse(Node4Output, raw)

        return {**state, "roadmap": result.model_dump(), "previous_node": "node4"}
    except Exception as e:
        print(f"[Node4] fallback due to error: {e}")
        fallback_roadmap = {
            "target_role": state.get("career_goal") or "Target Role",
            "total_duration": "8-12 weeks",
            "milestones": [
                {
                    "week": "1-2",
                    "title": "Set learning baseline",
                    "tasks": ["Review core skills", "Create weekly schedule"],
                    "resources": [],
                    "success_metric": "Complete first learning checklist",
                }
            ],
            "key_certifications": [],
            "daily_commitment": "1-2 hours/day",
            "motivational_message": "Keep improving step by step.",
        }
        return {
            **state,
            "roadmap": fallback_roadmap,
            "previous_node": "node4",
            "error": None,
        }

# ── Node 5: Validator ─────────────────────────────────────────────────────────
async def validate(state: CareerState) -> CareerState:
    print(f"▶ Node 5: Validation ")

    try:
        market_data = state.get("market_data") or {}
        market_analysis = to_dict(market_data.get("analysis", {}))

        skills_json = json.dumps((state.get("detected_skills") or [])[:15], ensure_ascii=False)
        careers_json = json.dumps(state.get("recommended_careers") or [], ensure_ascii=False)
        gaps_json = json.dumps((state.get("skill_gaps") or [])[:10], ensure_ascii=False)
        roadmap_json = json.dumps(state.get("roadmap") or {}, ensure_ascii=False)[:3000]
        market_json = json.dumps(market_analysis.get("market_insights", []), ensure_ascii=False)
        prefs_json = json.dumps(state.get("preferences", {}), ensure_ascii=False)

        raw = await call_llm(
            system="You are a strict QA reviewer. Respond in valid JSON only.",
            prompt=NODE5_VALIDATE.format(
                target_role=state.get("career_goal", "Multiple careers"),
                detected_skills=skills_json,
                recommended_careers=careers_json,
                skill_gaps=gaps_json,
                roadmap=roadmap_json,
                market_insights=market_json,
                preferences=prefs_json,
            ),
        )
        result: Node5Output = parse(Node5Output, raw)

        critical = [
            issue for issue in result.issues 
            if issue.severity == "critical"
        ]
        has_no_critical = len(critical) == 0
        has_passing_score = result.overall_quality_score >= 60

        is_passed = has_no_critical and has_passing_score

        updated = {**state, "validation_result": result.model_dump()}

        # Auto-fix (validated by Pydantic)
        fixes = result.fixes_applied
        if fixes.skills:     
            updated["detected_skills"] = fixes.skills;    
        if fixes.careers:    
            updated["recommended_careers"] = fixes.careers;  
        if fixes.skill_gaps: 
            updated["skill_gaps"] = fixes.skill_gaps; 
        if fixes.roadmap:    
            updated["roadmap"] = fixes.roadmap;   

        updated["validation_passed"] = is_passed

        if not is_passed:
            retry = state.get("validation_retry_count", 0)
            updated["validation_retry_count"] = retry + 1
        
        return updated
    except Exception as e:
        return {**state, "validation_passed": True}

# ── Final Response ────────────────────────────────────────────────────────────
async def final_response(state: CareerState) -> CareerState:
    print(f"▶ Node Final: Generate final response for user")
    path = state.get("path_type", "has_goal")

    try:
        market_analysis = to_dict((state.get("market_data") or {}).get("analysis", {}))

        if path == "no_goal_sufficient": # มีทักษะเพียงพอแต่ไม่มีเป้าหมายชัดเจน
            summary = {
                "ready_careers_count":      len(state.get("ready_careers") or []),
                "near_reach_careers_count": len(state.get("near_reach_careers") or []),
                "skills_count":             len(state.get("detected_skills") or []),
            }
        elif path == "no_goal_insufficient": # ไม่มีเป้าหมายชัดเจนและทักษะยังไม่เพียงพอ
            summary = {
                "careers_count": len(state.get("recommended_careers") or []),
                "skills_count":  len(state.get("detected_skills") or []),
                "easiest_path":  market_analysis.get("easiest_path"),
            }
        else: # has_goal — มีเป้าหมายชัดเจน
            summary = {
                "target_role":      state.get("career_goal"),
                "skills_count":     len(state.get("detected_skills") or []),
                "gap_count":        len(state.get("skill_gaps") or []),
                "roadmap_duration": (state.get("roadmap") or {}).get("total_duration"),
                "salary_range":     market_analysis.get("salary_range"),
            }
            
        response = await call_llm(
            system=SYSTEM_CAREER_ADVISOR,
            prompt=FINAL_RESPONSE_TEMPLATE.format(
                message=state["message"],
                path_type=path,
                analysis_summary=json.dumps(summary, ensure_ascii=False),
            ),
            json_mode=False,
        )
                 
        return {**state, "final_response": response, "timestamp": datetime.datetime.now()}

    except Exception as e:
        print(f"[Final Response] fallback due to error: {e}")
        return {**state, "final_response": "การวิเคราะห์เสร็จสิ้นแล้ว กรุณาดูผลลัพธ์ด้านล่าง", "timestamp": datetime.datetime.now()}

# ── Routers ───────────────────────────────────────────────────────────────────

def route_by_goal(state: CareerState) -> str:
    return "node2_gaps" if state.get("has_career_goal") else "node2_skills"


def route_by_sufficiency(state: CareerState) -> str:
    return "recommend_full" if state.get("skill_sufficient") else "multi_career_gap"


def route_after_validation(state: CareerState) -> str:
    if state.get("validation_passed"):
        return "final_response"

    retry = state.get("validation_retry_count", 0)

    if retry < MAX_RETRY:
        prev = state.get("previous_node", "node4")
        target = RETRY_TARGET.get(prev, "final_response")

        return target

    return "final_response"

#  Build graph
_memory = MemorySaver()

def build_career_graph():
    g = StateGraph(CareerState)

    g.add_node("node1_analyze",    analyze_goal)
    g.add_node("node2_skills",     analyze_skills)
    g.add_node("node2_gaps",       analyze_gaps)
    g.add_node("recommend_full",   node_recommend)
    g.add_node("multi_career_gap", node_multi_career_gap)
    g.add_node("node3_market",     market_agent)
    g.add_node("node4_roadmap",    create_roadmap)
    g.add_node("node5_validate",   validate)
    g.add_node("final_response",   final_response)

    g.set_entry_point("node1_analyze")

    g.add_conditional_edges("node1_analyze", route_by_goal, {
        "node2_gaps":   "node2_gaps",
        "node2_skills": "node2_skills",
    })

    # has_goal path
    g.add_edge("node2_gaps",    "node3_market")
    g.add_edge("node3_market",  "node4_roadmap")
    g.add_edge("node4_roadmap", "node5_validate")

    # no_goal path
    g.add_conditional_edges("node2_skills", route_by_sufficiency, {
        "recommend_full":   "recommend_full",
        "multi_career_gap": "multi_career_gap",
    })
    g.add_edge("recommend_full",   "node5_validate")
    g.add_edge("multi_career_gap", "node5_validate")

    # Validation: retry → previous_node OR proceed to final
    g.add_conditional_edges("node5_validate", route_after_validation, {
        "final_response":  "final_response",
        "node4_roadmap":   "node4_roadmap",
        "recommend_full":  "recommend_full",
        "multi_career_gap":"multi_career_gap",
    })
    g.add_edge("final_response", END)

    return g.compile(checkpointer=_memory)

career_graph  = build_career_graph()

print("Career graph module loaded")