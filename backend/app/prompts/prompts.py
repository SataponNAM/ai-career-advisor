SYSTEM_CAREER_ADVISOR = """You are an expert AI Career Advisor with deep knowledge of the job market,
skill development, and career planning. Respond in Thai/English mix. Be encouraging, specific, and actionable in your advice."""

NODE1_ANALYZE_GOAL = """Extract career info. JSON only.
Message: {message}
resume_text: {resume_text}
Respond JSON:{{"has_career_goal":bool,"career_goal":str|null,"current_role":str|null,"years_experience":num|null,"education":str|null,"summary":"Thai summary","preferences":{{"exclude_work_type":[],"prefer_work_type":[],"exclude_industry":[],"prefer_industry":[],"location":null,"exclude_company_size":[],"prefer_company_size":[]}}}}"""

NODE2_ANALYZE_SKILLS = """Analyze skills and career fit. JSON only.
Role:{current_role} Exp:{years_experience}yr Edu:{education}
resume_text: {resume_text}
Message: {message}
prefs: {preferences}
Tasks:1. Extract all skills with level+category from resume/message
   - BE CONSERVATIVE: "เบื้องต้น/basic/beginner" = level:beginner, weight=0.3
   - Only count skills explicitly mentioned, do NOT assume/infer extra skills
2. Use market_data to identify what skills each career requires in Thailand market
3. For each of 5+ relevant careers, compare user skills vs market requirements
   - coverage_% = (matched skills weight) / (total required skills count) * 100
   - beginner skill counts as 0.3, intermediate=0.7, advanced=1.0
   - fresh grad with no work experience: cap max coverage at 70% unless resume proves otherwise
4. skill_sufficient=true ONLY if ANY career coverage ≥80%
   - If years_experience=0 or current_role=student/fresh grad → apply strict mode
Respond JSON:{{"detected_skills": [{{"name":"Python","level":"intermediate","category":"technical"}}],"skill_sufficient": true/false,"skill_coverage_summary": "brief summary in Thai","career_skill_coverage": [{{"career":"Backend Developer","coverage_percent":80,"has_skills":["Python"],"missing_skills":["Docker"], "market_required_skills":["Python","SQL","Docker","Redis","Git"]}}]}}"""

NODE2_ANALYZE_SKILLS_WITH_GOAL = """Gap analysis for target role. JSON only.
Role:{current_role} Exp:{years_experience}yr Edu:{education}, goal={goal}
resume_text: {resume_text}
Message: {message}
Market data: {market_data}
Respond JSON:{{"detected_skills": [{{"name":"Python","level":"intermediate","category":"technical"}}],"skill_gaps": [{{"skill":"Spark","importance": critical/important/nice-to-have,"reason":"why needed"}}],"gap_summary": "brief summary in Thai"}}"""

NODE_RECOMMEND = """List viable careers. JSON only.
Skills: {detected_skills}
Coverage: {career_skill_coverage}
Preferences: {preferences}
Respond JSON:
{{
  "ready_careers": [{{
    "title": "Backend Dev",
    "match_score": 88,
    "description": "Thai",
    "matched_skills": [],
    "missing_minor": [{{"skill": "Docker", "importance": "important", "learn_time": "2-3wk"}}],
    "salary_range": "60k-120k THB",
    "why_good_fit": "Thai",
    "typical_companies": [],
    "time_to_ready": "Thai"
  }}],
  "near_reach_careers": [{{
    "title": "Data Eng",
    "current_coverage": 55,
    "missing_skills": [{{"skill": "Spark", "importance": "critical", "learn_time": "4-6wk"}}],
    "total_upskill_time": "2-3mo",
    "salary_range": "80k-150k THB",
    "why_worth_it": "Thai"
  }}],
  "skill_gaps": [{{
    "skill": "Docker",
    "importance": "important",
    "reason": "Thai — ทำไมต้องเรียน",
    "learn_time": "2-3 สัปดาห์",
    "free_resource": "Play with Docker"
  }}],
  "recommendation_summary": "Thai"
}}"""

NODE_MULTI_CAREER_GAP = """You are a career advisor. Analyze skill gaps for multiple career paths.
INPUT:
- Detected skills: {detected_skills}
- Coverage analysis: {career_skill_coverage}  
- Market data: {market_data}
- Preferences: {preferences}
OUTPUT RULES:
- Return JSON only, no explanation
- Minimum 4 careers, sorted easiest → hardest
- All description/reason/why fields must be in Thai
- salary in THB/month
REQUIRED JSON FORMAT:
{{
  "recommended_careers": [
    {{
      "title": "Junior Data Analyst",
      "difficulty": "easy",
      "current_coverage": 45,
      "match_score": 70,
      "description": "คำอธิบายภาษาไทย",
      "salary_range": "35000-70000",
      "matched_skills": ["Python", "Excel"],
      "skill_gaps": [
        {{
          "skill": "SQL",
          "importance": "critical",
          "reason": "เหตุผลภาษาไทย",
          "learn_time": "3-4 สัปดาห์",
          "free_resource": "SQLZoo"
        }}
      ],
      "total_upskill_time": "3-4 เดือน",
      "roadmap_summary": ["เดือน 1: เรียน SQL", "เดือน 2: Python pandas"],
      "typical_companies": ["SCB", "Agoda", "Grab"],
      "why_recommended": "เหตุผลภาษาไทย"
    }}
  ],
  "easiest_path": "Junior Data Analyst",
  "highest_salary_path": "Backend Developer",
  "overall_advice": "คำแนะนำภาษาไทย"
}}"""

NODE_SKILL_UPGRADE = """You are a career development specialist.
The user has sufficient skills for some careers but wants to know
what to learn to unlock MORE career options.
Current Skills: {detected_skills}
Ready Careers: {ready_careers}
Selected Career to Explore: {selected_career}
Market Data: {market_data}
Provide detailed skill upgrade plan for the selected career.
Respond in JSON:
{{
    "target_career": "Data Engineer",
    "current_coverage": 55,
    "gap_analysis": [
        {{
            "skill": "Apache Spark",
            "current_level": "none/beginner/intermediate",
            "required_level": "intermediate",
            "importance": "critical",
            "reason": "ทำไมถึงต้องการ skill นี้",
            "learn_time": "4-6 สัปดาห์",
            "resources": [
                {{"name": "Spark by Examples", "url": "https://sparkbyexamples.com", "type": "website", "cost": "free"}},
                {{"name": "Udemy PySpark Course", "url": "https://udemy.com", "type": "course", "cost": "paid"}}
            ]
        }}
    ],
    "learning_roadmap": [
        {{
            "phase": "Phase 1 (สัปดาห์ 1-4)",
            "focus": "SQL Advanced + Python Data Libraries",
            "skills": ["SQL Advanced", "Pandas", "NumPy"],
            "milestone": "สามารถทำ data manipulation ขั้นสูงได้"
        }}
    ],
    "total_time": "3-4 เดือน",
    "salary_increase": "จาก 60,000 → 100,000+ THB",
    "motivation": "ข้อความให้กำลังใจเป็นภาษาไทย"
}}
"""

NODE3_MARKET_ANALYSIS = """Analyze job market for target role. JSON only.
Role:{target_role} Skills:{current_skills} Gaps:{skill_gaps}
Exclude:{exclude_work_type} Prefer industry:{prefer_industry}
Market data:{market_data}
Respond JSON: {{"updated_skill_gaps": [{{"skill":"Spark","importance":critical/important/nice-to-have,"reason":"...","demand_score":9.5}}],"salary_range": {{"min":"80,000","max":"150,000","currency":"THB","period":"month"}},"market_insights": ["insight1","insight2"],"top_companies": ["SCB Tech","Kasikorn"],"market_trend": "growing"}}"""

NODE4_CREATE_ROADMAP = """Create week-by-week learning roadmap. JSON only.
Role:{target_role} Skills:{current_skills} Gaps:{skill_gaps}
Market:{market_insights} Companies:{resources_data} Prefs:{preferences}
Respond JSON: {{"target_role": "{target_role}","total_duration": "X months","milestones": [{{"week":"Week 1-2","title":"Foundation","tasks":["task1","task2"],"resources":[{{"name":"Course","url":"https://...","type":"course","cost":"free"}}],"success_metric":"metric"}}],"key_certifications": [],"daily_commitment": "2-3 hours","motivational_message": "ข้อความให้กำลังใจภาษาไทย"}}"""

NODE5_VALIDATE = """QA check career advisor output. JSON only.
Role:{target_role}
Skills:{detected_skills}
Careers:{recommended_careers}
Gaps:{skill_gaps}
Roadmap:{roadmap}
Insights:{market_insights}
Prefs:{preferences}
Check: skills have valid levels, careers have title+description+score,gaps have importance+reason, roadmap has ≥2 milestones with real tasks (no placeholders),all resource URLs start with https.
Respond JSON: {{"is_valid":bool,"overall_quality_score":0-100,"issues":[{{"section":"roadmap","severity":"critical","field":"tasks","issue":"str","fix":"str"}}],"auto_fixable":bool,"fixes_applied":{{"skills":null,"careers":null,"skill_gaps":null,"roadmap":null}},"validation_summary":"Thai"}}"""

FINAL_RESPONSE_TEMPLATE = """ Write a warm, encouraging response in Thai (3-4 paragraphs).
User: {message}
Path: {path_type}
Data: {analysis_summary}
no_goal_sufficient:  แจ้งอาชีพที่ทำได้พร้อมบอก skill สำหรับอาชีพ, แนะนำให้พัฒนาต่อ
no_goal_insufficient: ชี้ให้เห็น skill ที่มี, แนะนำเริ่มจากอาชีพง่ายสุด, แนะนำพัฒนาทักษะที่ขาด
has_goal: รับทราบเป้าหมาย, วิเคราะห์ gap, แนะนำ roadmap
End with motivating sentence."""

# ── JD Score 

JD_EXTRACT_PROMPT = """Extract JD requirements. JSON only.
JD:{jd_text}
{{"job_title":"str","company":str|null,"required_skills":[{{"skill":"Python","level":"advanced","is_mandatory":true}}],"required_experience_years":num|null,"required_education":str|null,"responsibilities":[],"nice_to_have":[],"keywords":[],"seniority_level":"junior|mid|senior|lead","tech_stack":[]}}"""

resume_text_SCORE_PROMPT = """Score resume_text vs JD. JSON only.
JD: {job_title} ({seniority_level})
Skills:{required_skills} Exp:{required_experience_years}yr Edu:{required_education}
Resp:{responsibilities} Keywords:{keywords}
resume_text:{resume_text_text}
Candidate skills:{current_skills}
Scoring: skills(40)+responsibilities(20)+experience(15)+keywords(15)+education(10)
{{"overall_score":0-100,"ats_score":0-100,"breakdown":{{"skills_score":0-40,"experience_score":0-15,"education_score":0-10,"keywords_score":0-15,"responsibilities_score":0-20}},"matched_skills":[],"missing_skills":[{{"skill":"Kafka","is_mandatory":true,"importance":critical/important/nice-to-have}}],"matched_keywords":[],"missing_keywords":[],"experience_gap":"str","education_match":bool,"verdict":"strong_match|good_match|partial_match|weak_match","verdict_reason":"Thai"}}"""

resume_text_IMPROVEMENT_PROMPT = """resume_text improvement advice. JSON only.
Job:{job_title} Score:{overall_score}/100
Missing skills:{missing_skills} Missing keywords:{missing_keywords}
Exp gap:{experience_gap}
resume_text:{resume_text_text}
{{"priority_fixes":[{{"section":"skills","priority":"critical","issue":"Thai","suggestion":"Thai","before_example":"str","after_example":"str"}}],"keywords_to_add":[{{"keyword":"Kafka","add_to_section":"skills","context":"str"}}],"summary_rewrite":"Thai","quick_wins":[],"long_term_gaps":[],"estimated_improvement":"Thai","overall_advice":"Thai"}}"""
