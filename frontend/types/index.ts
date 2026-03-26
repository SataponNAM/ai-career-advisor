// Shared

export interface SkillInfo {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced'
  category: 'technical' | 'soft' | 'domain'
}

export interface SkillGap {
  skill: string
  importance: 'critical' | 'important' | 'nice-to-have'
  reason: string
  learn_time?: string
  free_resource?: string | null
  demand_score?: number
}

export interface Resource {
  name: string
  url: string
  type: string
  cost: 'free' | 'paid'
}

export interface SalaryRange {
  min: string
  max: string
  currency: string
  period: string
}

// Roadmap

export interface RoadmapMilestone {
  month: number
  title: string
  focus: string
  tasks: string[]
  deliverable: string
  success_metric?: string
}

export interface CareerRoadmap {
  target_role: string
  total_duration: string
  milestones: RoadmapMilestone[]
  key_certifications: string[]
  daily_commitment?: string
  motivational_message?: string
}

// Has Goal Path

export interface CareerRecommendation {
  title: string
  match_score: number
  description?: string
}

// No Goal Sufficient Path

export interface NearReachMissingSkill {
  skill: string
  importance: 'critical' | 'important' | 'nice-to-have'
  learn_time: string
}

export interface ReadyCareer {
  title: string
  match_score: number
  description: string
  matched_skills: string[]
  missing_minor: string[]
  salary_range: string
  why_good_fit: string
  typical_companies: string[]
  time_to_ready: string
}

export interface NearReachCareer {
  title: string
  current_coverage: number
  missing_skills: NearReachMissingSkill[]
  total_upskill_time: string
  salary_range: string
  why_worth_it: string
}

// No Goal Insufficient Path

export interface MultiGapCareer {
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  current_coverage: number
  match_score: number
  description: string
  salary_range: string
  matched_skills: string[]
  skill_gaps: SkillGap[]
  total_upskill_time: string
  roadmap_summary: string[]
  typical_companies: string[]
  why_recommended: string
}

// Validation

export interface ValidationIssue {
  section: string
  severity: 'critical' | 'warning'
  field?: string
  issue: string
  fix?: string
}

export interface ValidationInfo {
  passed: boolean
  quality_score?: number
  summary?: string
  warnings?: ValidationIssue[]
  critical_issues?: ValidationIssue[]
  retry_count?: number
}

// Analysis

export type PathType = 'has_goal' | 'no_goal_sufficient' | 'no_goal_insufficient' | 'skill_upgrade'

export interface HasGoalAnalysis {
  path_type: 'has_goal'
  current_profile: { current_role?: string; years_experience?: number; education?: string; summary?: string } | null
  detected_skills: SkillInfo[]
  recommended_careers: CareerRecommendation[]
  skill_gaps: SkillGap[]
  roadmap: CareerRoadmap | null
  market_insights: string[]
  salary_range?: SalaryRange
  preferences_applied?: Record<string, unknown>
}

export interface NoGoalSufficientAnalysis {
  path_type: 'no_goal_sufficient'
  detected_skills: SkillInfo[]
  ready_careers: ReadyCareer[]
  near_reach_careers: NearReachCareer[]
  recommended_careers: ReadyCareer[]
  skill_sufficient: true
}

export interface NoGoalInsufficientAnalysis {
  path_type: 'no_goal_insufficient'
  detected_skills: SkillInfo[]
  recommended_careers: MultiGapCareer[]
  easiest_path?: string
  highest_salary_path?: string
  overall_advice?: string
  skill_sufficient: false
}

export type AnalysisResult = HasGoalAnalysis | NoGoalSufficientAnalysis | NoGoalInsufficientAnalysis

// API Response

export interface ApiResponse {
  user_id: string
  path_type: PathType
  message: string
  analysis: AnalysisResult
  validation?: ValidationInfo
  error?: string
}

export interface SkillUpgradeResponse {
  user_id: string
  selected_career: string
  skill_upgrade_plan: Record<string, unknown> | null
  message: string
  error?: string
}

// Chat

export interface ChatMessage {
  role?: "user" | "assistant";
  message: string;
  timestamp: Date;
  analysis?: AnalysisResult;
  validation?: ValidationInfo;
}
