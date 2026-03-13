from pydantic import BaseModel, Field, ValidationError, field_validator
from typing import Literal, Optional
import logging

logger = logging.getLogger(__name__)

# Shared sub-models

class Skill(BaseModel):
    name: str
    level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    category: Literal["technical", "soft", "domain"] = "technical"

class SkillGap(BaseModel):
    skill: str
    importance: Literal["critical", "important", "nice-to-have"] = "important"
    reason: str = ""
    learn_time: str = ""
    free_resource: Optional[str] = None

class SalaryRange(BaseModel):
    min: str = ""
    max: str = ""
    currency: str = "THB"
    period: str = "month"

class Resource(BaseModel):
    name: str
    url: str = ""
    type: str = "course"
    cost: Literal["free", "paid"] = "free"

    @field_validator("url")
    @classmethod
    def url_must_start_http(cls, v):
        if v and not v.startswith("http"):
            return ""
        return v

# Node 1 output model

class Preferences(BaseModel):
    exclude_work_type:    list[str] = []
    prefer_work_type:     list[str] = []
    exclude_industry:     list[str] = []
    prefer_industry:      list[str] = []
    location:             Optional[str] = None
    exclude_company_size: list[str] = []
    prefer_company_size:  list[str] = []

class Node1Output(BaseModel):
    has_career_goal:  bool = False
    career_goal:      Optional[str] = None
    current_role:     Optional[str] = None
    years_experience: Optional[float] = None
    education:        Optional[str] = None
    summary:          str = ""
    preferences:      Preferences = Field(default_factory=Preferences)

# Node 2a output model

class CareerCoverage(BaseModel):
    career:           str
    coverage_percent: int = 0
    has_skills:       list[str] = []
    missing_skills:   list[str] = []

class Node2aOutput(BaseModel):
    detected_skills:        list[Skill] = []
    skill_sufficient:       bool = False
    skill_coverage_summary: str = ""
    career_skill_coverage:  list[CareerCoverage] = []

# Node 2b output model

class Node2bOutput(BaseModel):
    detected_skills: list[Skill] = []
    skill_gaps:      list[SkillGap] = []
    gap_summary:     str = ""

# ── parse() — 3-stage fallback ────────────────────────────────────────────────

def _coerce_list(val) -> list:
    """ถ้า LLM return dict หรือ string แทน list → แปลงให้เป็น list"""
    if isinstance(val, list): return val
    if isinstance(val, dict): return [val]
    if isinstance(val, str):  return [val] if val else []
    return []

def _repair(model: type[BaseModel], raw: dict) -> dict:
    """
    Pre-validate repair:
    - list field ที่ได้มาเป็น dict/string → _coerce_list
    - drop explicit None → Pydantic ใช้ default แทน
    - drop extra keys ที่ไม่ได้ define ใน model
    """
    if not isinstance(raw, dict):
        return {}
    
    repaired = {}
    hints = model.model_fields

    for key, val in raw.items():
        if key not in hints:
            continue

        annotation = str(hints[key].annotation)
        
        if "list" in annotation.lower() and not isinstance(val, list):
            val = _coerce_list(val)
        if val is None:
            continue
        repaired[key] = val

    return repaired