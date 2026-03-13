SYSTEM_CAREER_ADVISOR = """You are an expert AI Career Advisor with deep knowledge of the job market,
skill development, and career planning. You communicate in both Thai and English naturally.
Always be encouraging, specific, and actionable in your advice."""

NODE1_ANALYZE_GOAL = """
Analyze the user's career situation from message and resume.

Message: {message}
Resume: {resume}

Respond JSON:
{{
  "has_career_goal": true/false,
  "career_goal": "goal or null",
  "current_role": "role or null",
  "years_experience": number or null,
  "education": "level or null",
  "summary": "brief summary in Thai",
  "preferences": {{"exclude_work_type": [], "prefer_industry": []}}
}}
"""

NODE2_ANALYZE_SKILLS = """
Analyze skills and check sufficiency for career options.

Profile: role={role}, exp={exp}yrs, edu={edu}
Resume: {resume}
Message: {message}
Preferences: {prefs}

Task 1: Extract ALL skills (name, level: beginner/intermediate/advanced, category: technical/soft/domain)
Task 2: For 5+ careers calculate coverage %
Task 3: skill_sufficient=true if coverage ≥70% for at least ONE career

Respond JSON:
{{
  "detected_skills": [{{"name":"Python","level":"intermediate","category":"technical"}}],
  "skill_sufficient": true/false,
  "skill_coverage_summary": "brief summary in Thai",
  "career_skill_coverage": [
    {{"career":"Backend Developer","coverage_percent":80,
      "has_skills":["Python"],"missing_skills":["Docker"]}}
  ]
}}
"""

NODE2_ANALYZE_SKILLS_WITH_GOAL = """
Gap analysis for target career.

Profile: role={role}, exp={exp}yrs, edu={edu}, goal={goal}
Resume: {resume}
Message: {message}

Respond JSON:
{{
  "detected_skills": [{{"name":"Python","level":"intermediate","category":"technical"}}],
  "skill_gaps": [
    {{"skill":"Spark","importance":"critical","reason":"why needed"}}
  ],
  "gap_summary": "brief summary in Thai"
}}
"""

NODE_RECOMMEND = """
User has enough skills for several careers. Present all viable options.

Skills: {skills}
Coverage: {coverage}
Preferences: {prefs}

Respond JSON:
{{
  "ready_careers": [
    {{"title":"Backend Developer","match_score":88,"description":"อธิบาย",
      "matched_skills":["Python"],"missing_minor":["Docker"],
      "salary_range":"60,000-120,000 THB","why_good_fit":"เหตุผล",
      "typical_companies":["Agoda","Grab"],"time_to_ready":"พร้อมเลย"}}
  ],
  "near_reach_careers": [
    {{"title":"Data Engineer","current_coverage":55,
      "missing_skills":[{{"skill":"Spark","importance":"critical","learn_time":"4-6 สัปดาห์"}}],
      "total_upskill_time":"2-3 เดือน","salary_range":"80,000-150,000 THB",
      "why_worth_it":"เหตุผล"}}
  ],
  "recommendation_summary": "brief summary in Thai"
}}
"""

NODE_MULTI_CAREER_GAP = """
User needs skill development. Show multiple career paths with gap analysis.
Sort easiest first (fewest missing critical skills). Minimum 4 careers.

Skills: {skills}
Coverage: {coverage}
Market data: {market}
Preferences: {prefs}

Respond JSON:
{{
  "recommended_careers": [
    {{"title":"Junior Data Analyst","difficulty":"easy","current_coverage":45,
      "match_score":70,"description":"อธิบาย","salary_range":"35,000-70,000 THB",
      "matched_skills":["Excel"],
      "skill_gaps":[{{"skill":"SQL","importance":"critical","reason":"ใช้ทุกวัน",
                    "learn_time":"3-4 สัปดาห์","free_resource":"SQLZoo"}}],
      "total_upskill_time":"3-4 เดือน",
      "roadmap_summary":["เดือน 1: SQL","เดือน 2: Python"],
      "typical_companies":["บริษัท"],"why_recommended":"เหตุผล"}}
  ],
  "easiest_path": "Junior Data Analyst",
  "highest_salary_path": "Data Engineer",
  "overall_advice": "brief advice in Thai"
}}
"""

NODE3_MARKET_ANALYSIS = """
Analyze job market for target role.

Role: {role}
Current skills: {skills}
Skill gaps: {gaps}
Preferences: {prefs}
Market data: {market}

Respond JSON:
{{
  "updated_skill_gaps": [{{"skill":"Spark","importance":"critical","reason":"...","demand_score":9.5}}],
  "salary_range": {{"min":"80,000","max":"150,000","currency":"THB","period":"month"}},
  "market_insights": ["insight1","insight2"],
  "top_companies": ["SCB Tech","Kasikorn"],
  "market_trend": "growing"
}}
"""

NODE4_CREATE_ROADMAP = """
Create week-by-week learning roadmap.

Target role: {role}
Current skills: {skills}
Skill gaps: {gaps}
Market insights: {insights}
Resources: {resources}
Preferences: {prefs}
{retry_context}

Respond JSON:
{{
  "target_role": "{role}",
  "total_duration": "X months",
  "milestones": [
    {{"week":"Week 1-2","title":"Foundation",
      "tasks":["task1","task2"],
      "resources":[{{"name":"Course","url":"https://...","type":"course","cost":"free"}}],
      "success_metric":"metric"}}
  ],
  "key_certifications": [],
  "daily_commitment": "2-3 hours",
  "motivational_message": "ข้อความให้กำลังใจภาษาไทย"
}}
"""

NODE5_VALIDATE = """
QA review — validate output quality.

Target: {role}
Skills: {skills}
Careers: {careers}
Gaps: {gaps}
Roadmap: {roadmap}
Preferences: {prefs}

Check: skills have valid levels, careers have title+description+score,
gaps have importance+reason, roadmap has ≥2 milestones with real tasks (no placeholders),
all resource URLs start with http.

Respond JSON:
{{
  "is_valid": true,
  "overall_quality_score": 0-100,
  "issues": [
    {{"section":"roadmap","severity":"critical/warning","field":"tasks",
      "issue":"description","fix":"how to fix"}}
  ],
  "auto_fixable": false,
  "fixes_applied": {{"skills":null,"careers":null,"skill_gaps":null,"roadmap":null}},
  "validation_summary": "brief summary in Thai"
}}
"""

FINAL_RESPONSE_TEMPLATE = """
Write a warm, encouraging response in Thai (3-4 paragraphs).

User message: {message}
Path: {path}
Summary: {summary}

- no_goal_sufficient: ชื่นชม skill, แจ้งอาชีพที่ทำได้เลย, แนะนำให้พัฒนาต่อ
- no_goal_insufficient: ให้กำลังใจ, ชี้ให้เห็น skill ที่มี, แนะนำเริ่มจากอาชีพง่ายสุด
- has_goal: รับทราบเป้าหมาย, วิเคราะห์ gap, ให้กำลังใจ

End with motivating sentence.
"""
