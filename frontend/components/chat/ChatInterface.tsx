"use client";

import {
  AnalysisResult,
  ChatMessage,
  NoGoalInsufficientAnalysis,
  NoGoalSufficientAnalysis,
} from "@/types";
import { Button, Card } from "@radix-ui/themes";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Dropzone from "./Dropzone";
import ReadyCareersView from "../career/ReadyCareersView";
import MultiCareerGapView from "../career/MultiCareerGapView";
import AnalysisPanel from "../roadmap/AnalysisPanel";
import { analyzeCareer, sendChat } from "@/utils/api";

interface ChatAreaProps {
  showResumeDropzone: boolean;
  isDraggingOver: boolean;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  setShowResumeDropzone: (show: boolean) => void;
}

const hasGoalExample: ChatMessage = {
  role: "assistant",
  message:
    "Based on your resume, you have a strong foundation in full-stack development with hands-on experience in modern frameworks. I recommend focusing on cloud-native skills and CI/CD to accelerate your path toward a senior role within 3 months.",
  timestamp: new Date(),
  analysis: {
    path_type: "has_goal",
    current_profile: {
      current_role:
        "Final-year Computer Science student / Full Stack Developer Intern",
      years_experience: 0.5,
      education:
        "Bachelor of Science in Computer Science, King Mongkut's University of Technology North Bangkok",
      summary:
        "คุณเป็นนักศึกษาปีสุดท้ายที่มีพื้นฐาน Full-stack ที่แข็งแกร่ง โดยเฉพาะการใช้ Next.js, Nest.js และ PostgreSQL จากประสบการณ์ฝึกงาน 7 เดือนที่ REPCO NEX นอกจากนี้ยังมีโปรเจกต์ที่หลากหลายทั้ง Mobile App (Flutter), Data Science (Python) และ Web App (MERN Stack) ถือเป็น Candidate ที่มีทักษะพร้อมลุยงานจริงและมี GPAX ที่โดดเด่น (3.51) แนะนำให้เน้นโชว์ผลงานการทำ System Migration ในช่วงสัมภาษณ์ครับ",
    },
    detected_skills: [
      { name: "JavaScript", level: "advanced", category: "technical" },
      { name: "TypeScript", level: "advanced", category: "technical" },
      { name: "Next.js", level: "intermediate", category: "technical" },
      { name: "Nest.js", level: "intermediate", category: "technical" },
      { name: "React", level: "intermediate", category: "technical" },
      { name: "Node.js", level: "intermediate", category: "technical" },
      { name: "PostgreSQL", level: "intermediate", category: "technical" },
      { name: "Docker", level: "beginner", category: "technical" },
      { name: "Python", level: "intermediate", category: "technical" },
      { name: "Java", level: "intermediate", category: "technical" },
    ],
    recommended_careers: [
      {
        title: "Full Stack Developer",
        match_score: 90,
        description:
          "Builds end-to-end web applications using modern frameworks. Your Next.js, Nest.js, and PostgreSQL experience directly maps to this role's core requirements.",
      },
      {
        title: "Backend Developer",
        match_score: 82,
        description:
          "Designs and maintains server-side APIs and databases. Strong Nest.js and PostgreSQL background provides a solid match.",
      },
    ],
    skill_gaps: [
      {
        skill: "Cloud Platforms (AWS/GCP/Azure)",
        importance: "critical",
        reason:
          "Modern enterprise architecture relies heavily on cloud-native services. Mastering AWS (EC2, Lambda, S3) or GCP is non-negotiable for senior-level roles.",
        demand_score: 9.8,
      },
      {
        skill: "CI/CD Pipelines (GitHub Actions/Jenkins)",
        importance: "critical",
        reason:
          "Automation is key to productivity. Companies expect developers to own the deployment process via automated testing and delivery pipelines.",
        demand_score: 9.2,
      },
      {
        skill: "System Design & Architecture",
        importance: "critical",
        reason:
          "Moving beyond feature implementation to designing scalable microservices and handling high-concurrency traffic is what separates mid-level from senior devs.",
        demand_score: 9.5,
      },
      {
        skill: "Unit/Integration Testing (Jest/Vitest)",
        importance: "critical",
        reason:
          "Production-grade code requires high test coverage. It ensures stability and reduces technical debt in fast-paced agile environments.",
        demand_score: 8.9,
      },
    ],
    roadmap: {
      target_role: "Senior Full-Stack Cloud-Native Developer",
      total_duration: "3 months",
      daily_commitment: "2-3 hours",
      motivational_message:
        "คุณมีพื้นฐานที่แข็งแกร่งอยู่แล้ว การก้าวไปสู่ระดับ Senior ไม่ใช่แค่เรื่องของ Code แต่คือการมองภาพรวมของระบบให้ขาด สู้ๆ นะครับ! การลงทุนกับเวลา 3 เดือนนี้จะเปลี่ยน career path ของคุณไปสู่ระดับที่สูงขึ้นอย่างแน่นอน",
      key_certifications: [
        "AWS Certified Developer – Associate",
        "Docker Certified Associate",
      ],
      milestones: [
        {
          month: 1,
          title: "Cloud & Container Foundation",
          focus: "AWS Core Services + Docker Proficiency",
          tasks: [
            "Complete AWS Cloud Practitioner Essentials (free tier)",
            "Deploy existing Next.js project to EC2 with Nginx reverse proxy",
            "Containerise Nest.js API with Docker and push to ECR",
            "Set up S3 bucket for static assets with CloudFront CDN",
            "Learn IAM roles, VPC basics, and security groups",
          ],
          deliverable:
            "Personal portfolio site live on AWS with Dockerised backend",
          success_metric:
            "Can independently deploy a full-stack app to AWS without tutorials",
        },
        {
          month: 2,
          title: "CI/CD & Automated Testing",
          focus: "GitHub Actions pipelines + Jest/Vitest test coverage",
          tasks: [
            "Write unit tests for existing Nest.js services (target 70%+ coverage)",
            "Add integration tests for PostgreSQL repositories using Testcontainers",
            "Build a GitHub Actions workflow: lint → test → build → deploy to EC2",
            "Add Slack notifications for failed pipeline runs",
            "Integrate SonarCloud for code quality gating",
          ],
          deliverable:
            "Production-grade CI/CD pipeline on at least one personal or open-source project",
          success_metric:
            "Zero manual deployments; every merge triggers automated test + deploy",
        },
        {
          month: 3,
          title: "System Design & AWS Developer Certification",
          focus: "Scalable architecture patterns + AWS associate exam",
          tasks: [
            "Study 5 classic system design problems (URL shortener, rate limiter, chat app, newsfeed, notification service)",
            "Refactor portfolio project to use Lambda + API Gateway (serverless pattern)",
            "Implement SQS queue for async job processing",
            "Complete AWS Certified Developer – Associate practice exams (score 80%+)",
            "Take and pass AWS Certified Developer – Associate exam",
          ],
          deliverable:
            "AWS Developer – Associate certificate + system design case study write-up on GitHub",
          success_metric:
            "Can whiteboard a scalable microservice architecture and explain trade-offs",
        },
      ],
    },
    market_insights: [
      "Your current stack (Next.js/Nest.js/TypeScript) is highly sought after in the Thai startup and fintech ecosystem.",
      "AI Literacy is becoming a differentiator; learn how to integrate LLM APIs (OpenAI/Anthropic) into your existing Node.js/Python apps.",
      "Soft skills like 'Systems Thinking' and technical communication are increasingly prioritized by recruiters to ensure cross-functional team alignment.",
      "The market is shifting from 'generalist' to 'cloud-native developer' who understands the full lifecycle of an application.",
    ],
    salary_range: {
      min: "70,000",
      max: "160,000",
      currency: "THB",
      period: "month",
    },
    preferences_applied: {
      exclude_work_type: [],
      prefer_work_type: ["Full-time"],
      exclude_industry: [],
      prefer_industry: [],
      location: "Bangkok/Pathum Thani",
      exclude_company_size: [],
      prefer_company_size: [],
    },
  },
  validation: {
    passed: true,
    quality_score: 94,
    summary:
      "ข้อมูลผ่านเกณฑ์การตรวจสอบทุกข้อ Roadmap มี 3 milestones ที่ครบถ้วน, match_score สะท้อนทักษะได้ถูกต้อง และทุก field ที่จำเป็นถูก populate แล้ว",
    warnings: [
      {
        section: "careers",
        severity: "warning",
        field: "match_score",
        issue:
          "Backend Developer match_score (82) may slightly overestimate fit given limited standalone backend-only project experience.",
        fix: "Consider lowering to 75-78 if more conservative scoring is preferred.",
      },
    ],
    critical_issues: [],
    retry_count: 0,
  },
};

const noGoalSufficientExample: ChatMessage = {
  role: "assistant",
  timestamp: new Date(),
  message:
    'สวัสดีครับ! ก่อนอื่นต้องขอชื่นชมเลยว่าประสบการณ์ 4 ปีในฐานะ Full Stack Developer ที่มีทักษะทั้ง React, Node.js, Python และ PostgreSQL ถือเป็น "รากฐานที่แข็งแกร่งมาก" (Solid Foundation) เลยครับ คุณมีทักษะที่ตลาดต้องการสูงมากและมีความยืดหยุ่นในการทำงานสูง ซึ่งเป็นจุดแข็งที่หาได้ยากครับ\n\nสำหรับเส้นทางที่น่าสนใจและต่อยอดจากสิ่งที่คุณมีอยู่ ผมขอแนะนำ 3 สายงานที่น่าจะเหมาะกับคุณครับ:\n1. **Senior Full Stack Developer:** เน้นการทำ System Architecture และการทำ Code Optimization เพื่อรองรับ Scale ที่ใหญ่ขึ้น\n2. **Cloud/DevOps Engineer:** ต่อยอดจากความรู้ Backend และ Database โดยเรียนรู้เรื่อง AWS/GCP, Docker, และ Kubernetes เพิ่มเติม\n3. **Data Engineer:** ใช้ทักษะ Python และ PostgreSQL ที่คุณมีอยู่แล้วไปต่อยอดเรื่อง Data Pipeline และ Big Data ซึ่งเป็นที่ต้องการสูงมากในปัจจุบัน\n\nคำแนะนำของผมคือ ลองเลือกสิ่งที่ "ทำแล้วสนุกที่สุด" ดูครับ ถ้าชอบงานฝั่ง UI/UX ให้ไปทาง Senior Full Stack แต่ถ้าชอบงานเบื้องหลังและการจัดการข้อมูล ให้ลองขยับไปทาง Data Engineer หรือ Cloud ดูครับ ช่วงนี้ลองหาเวลาทำ Side Project เล็กๆ โดยใช้เทคโนโลยีใหม่ๆ ที่คุณยังไม่เคยใช้ดู จะช่วยให้เห็นภาพชัดขึ้นว่าเราชอบทางไหนกันแน่ครับ\n\nคุณมีศักยภาพที่ยอดเยี่ยมอยู่แล้วครับ อย่าเพิ่งกดดันตัวเองจนเกินไป ค่อยๆ สำรวจและทดลองไปทีละนิด แล้วคุณจะพบเส้นทางที่ใช่สำหรับตัวเองแน่นอนครับ! Keep going, you\'ve got this!',
  analysis: {
    path_type: "no_goal_sufficient",
    detected_skills: [
      {
        name: "React",
        level: "intermediate",
        category: "technical",
      },
      {
        name: "Node.js",
        level: "intermediate",
        category: "technical",
      },
      {
        name: "Python",
        level: "intermediate",
        category: "technical",
      },
      {
        name: "PostgreSQL",
        level: "intermediate",
        category: "technical",
      },
    ],
    ready_careers: [
      {
        title: "Developer",
        match_score: 70,
        description: "string",
        matched_skills: ["Python", "React"],
        missing_minor: ["Missing", "Minor"],
        salary_range: "40k-50k THB",
        why_good_fit: "string",
        typical_companies: ["ASO"],
        time_to_ready: "1 year",
      },
    ],
    near_reach_careers: [
      {
        title: "Software Engineer (Generalist)",
        current_coverage: 82,
        missing_skills: [
          {
            skill: "Cloud (AWS/GCP)",
            importance: "critical",
            learn_time: "4-6wk",
          },
          {
            skill: "System Design",
            importance: "critical",
            learn_time: "4wk",
          },
        ],
        total_upskill_time: "2-3 เดือน",
        salary_range: "70k-130k THB",
        why_worth_it:
          "การเข้าใจ Cloud และ System Design จะช่วยยกระดับคุณจาก Developer ไปสู่ Senior/Architect ซึ่งมีโอกาสเติบโตและรายได้สูงมาก",
      },
    ],
    recommended_careers: [],
    skill_sufficient: true,
  },
  validation: {
    passed: false,
    quality_score: 20,
    summary:
      "ข้อมูลไม่ครบถ้วน: รายการอาชีพ, ช่องว่างทักษะ และแผนการพัฒนา (Roadmap) ว่างเปล่า ไม่ผ่านเกณฑ์การตรวจสอบ",
    warnings: [],
    critical_issues: [
      {
        section: "careers",
        severity: "critical",
        field: "careers",
        issue: "Careers list is empty.",
        fix: "Populate the careers array with at least one career object containing title, description, and score.",
      },
      {
        section: "gaps",
        severity: "critical",
        field: "gaps",
        issue: "Gaps list is empty.",
        fix: "Identify skill gaps based on the provided technical skills and add them with importance and reason.",
      },
      {
        section: "roadmap",
        severity: "critical",
        field: "roadmap",
        issue: "Roadmap is empty.",
        fix: "Define at least two milestones with concrete, actionable tasks.",
      },
    ],
    retry_count: 1,
  },
};

const noGoalInsufficientExample: ChatMessage = {
  role: "assistant",
  timestamp: new Date(),
  message:
    'ยินดีด้วยนะครับที่เรียนจบแล้ว! การที่คุณมีพื้นฐานทั้ง Excel และ Python ถือเป็นจุดเริ่มต้นที่ดีมากครับ เพราะทักษะเหล่านี้คือหัวใจสำคัญของงานสาย IT ในปัจจุบัน แม้ตอนนี้จะยังไม่แน่ใจว่าอยากไปทางไหน แต่ไม่ต้องกังวลไปครับ การที่คุณมีทักษะเหล่านี้อยู่ในมือถือว่าคุณมี "ต้นทุน" ที่พร้อมจะต่อยอดไปได้ไกลมากแล้ว\n\nสำหรับก้าวแรก ผมแนะนำให้ลองมองหาตำแหน่ง **IT Support หรือ Helpdesk** ดูก่อนครับ งานสายนี้จะช่วยให้คุณได้เห็นภาพรวมของระบบ IT ในองค์กร ได้แก้ปัญหาหน้างานจริง และได้ฝึกทักษะการสื่อสาร ซึ่งเป็นพื้นฐานสำคัญมากก่อนจะขยับไปสายงานที่เฉพาะทางมากขึ้น นอกจากนี้ คุณควรเริ่มพัฒนาทักษะด้าน **SQL (Database)** เพิ่มเติม เพราะเป็นทักษะที่เชื่อมโยงกับทั้ง Excel และ Python ได้อย่างดีเยี่ยม และเป็นที่ต้องการสูงในทุกสายงาน IT ครับ\n\nลองเปิดใจเรียนรู้และเก็บเกี่ยวประสบการณ์จากงานแรกดูนะครับ ไม่ต้องรีบตัดสินใจว่าจะต้องเป็นอะไรในอีก 10 ปีข้างหน้า แค่เริ่มจากสิ่งที่มีและพัฒนาตัวเองไปทีละนิด คุณจะค่อยๆ ค้นพบเองว่างานแบบไหนที่ทำแล้วสนุกและเหมาะกับคุณที่สุดครับ\n\n**"ทุกก้าวเล็กๆ ที่คุณลงมือทำในวันนี้ คือการปูทางไปสู่ความสำเร็จที่ยิ่งใหญ่ในอนาคต สู้ๆ นะครับ!"**',
  analysis: {
    path_type: "no_goal_insufficient",
    detected_skills: [
      {
        name: "Excel",
        level: "beginner",
        category: "technical",
      },
      {
        name: "Python",
        level: "beginner",
        category: "technical",
      },
    ],
    recommended_careers: [
      {
        title: "IT Support / Helpdesk",
        difficulty: "easy",
        current_coverage: 30,
        match_score: 65,
        description:
          "ดูแลระบบไอทีพื้นฐาน แก้ไขปัญหาฮาร์ดแวร์และซอฟต์แวร์เบื้องต้นให้กับผู้ใช้งานในองค์กร",
        salary_range: "18000-30000",
        matched_skills: ["Excel"],
        skill_gaps: [
          {
            skill: "OS Troubleshooting",
            importance: "critical",
            reason: "เป็นทักษะหลักในการแก้ปัญหา Windows/macOS ให้กับพนักงาน",
            learn_time: "2-3 สัปดาห์",
            free_resource:
              "Google IT Support Professional Certificate (Coursera)",
          },
        ],
        total_upskill_time: "1-2 เดือน",
        roadmap_summary: [
          "เดือน 1: เรียนรู้ Network Basics และ OS Troubleshooting",
          "เดือน 2: ฝึกใช้ Active Directory และ Hardware Support",
        ],
        typical_companies: ["บริษัทเอกชนทั่วไป", "โรงพยาบาล", "ธนาคาร"],
        why_recommended:
          "เป็นจุดเริ่มต้นที่ดีที่สุดสำหรับคนที่มีทักษะ Excel และต้องการเข้าสู่สายงาน IT โดยใช้เวลาเรียนรู้น้อยที่สุด",
      },
      {
        title: "QA Tester (Manual)",
        difficulty: "medium",
        current_coverage: 15,
        match_score: 55,
        description:
          "ตรวจสอบคุณภาพซอฟต์แวร์ ออกแบบเคสการทดสอบ และรายงานบั๊กเพื่อพัฒนาผลิตภัณฑ์ให้สมบูรณ์",
        salary_range: "25000-45000",
        matched_skills: ["Excel"],
        skill_gaps: [
          {
            skill: "Test Case Design",
            importance: "critical",
            reason: "หัวใจสำคัญของการทำ QA คือการวางแผนทดสอบที่ครอบคลุม",
            learn_time: "3-4 สัปดาห์",
            free_resource: "Guru99 Software Testing Tutorial",
          },
        ],
        total_upskill_time: "2-3 เดือน",
        roadmap_summary: [
          "เดือน 1: ศึกษา SDLC และการเขียน Test Case",
          "เดือน 2: ฝึกใช้ Bug Tracking Tools และ SQL พื้นฐาน",
        ],
        typical_companies: ["Software House", "E-commerce", "FinTech"],
        why_recommended:
          "เป็นสายงานที่ต้องการความละเอียดรอบคอบ ซึ่งทักษะ Excel ของคุณช่วยในการจัดการข้อมูลได้ดี",
      },
      {
        title: "Business Analyst (Junior)",
        difficulty: "medium",
        current_coverage: 20,
        match_score: 50,
        description:
          "วิเคราะห์ความต้องการทางธุรกิจและเชื่อมโยงกับทีมพัฒนาเพื่อสร้างโซลูชันที่ตอบโจทย์",
        salary_range: "30000-55000",
        matched_skills: ["Excel"],
        skill_gaps: [
          {
            skill: "Requirement Gathering",
            importance: "critical",
            reason:
              "ทักษะการสื่อสารและรวบรวมความต้องการจากลูกค้าเป็นสิ่งสำคัญที่สุด",
            learn_time: "4-6 สัปดาห์",
            free_resource: "IIBA Learning Resources",
          },
        ],
        total_upskill_time: "3-4 เดือน",
        roadmap_summary: [
          "เดือน 1: เรียนรู้การทำ Requirement Gathering",
          "เดือน 2: ฝึก Process Mapping และ SQL",
        ],
        typical_companies: ["บริษัทที่ปรึกษา", "ธนาคาร", "Retail"],
        why_recommended:
          "ใช้ทักษะการวิเคราะห์และ Excel ที่คุณมีอยู่แล้วมาต่อยอดในเชิงธุรกิจได้ทันที",
      },
      {
        title: "Junior Data Analyst",
        difficulty: "hard",
        current_coverage: 20,
        match_score: 45,
        description:
          "วิเคราะห์ข้อมูลเพื่อหา Insight ช่วยให้องค์กรตัดสินใจทางธุรกิจได้อย่างแม่นยำ",
        salary_range: "35000-70000",
        matched_skills: ["Python", "Excel"],
        skill_gaps: [
          {
            skill: "SQL",
            importance: "critical",
            reason: "เป็นภาษาหลักที่ใช้ดึงข้อมูลจากฐานข้อมูลในทุกองค์กร",
            learn_time: "4-6 สัปดาห์",
            free_resource: "SQLZoo",
          },
        ],
        total_upskill_time: "4-6 เดือน",
        roadmap_summary: [
          "เดือน 1-2: ฝึก SQL และ Data Visualization (Tableau/PowerBI)",
          "เดือน 3-4: เรียน Statistics และ Python Pandas",
        ],
        typical_companies: ["SCB", "Agoda", "Grab"],
        why_recommended:
          "เป็นสายงานที่ตลาดต้องการสูงมากในไทยปี 2026 และสอดคล้องกับทักษะ Python ที่คุณเริ่มเรียนรู้แล้ว",
      },
    ],
    easiest_path: "IT Support / Helpdesk",
    highest_salary_path: "Junior Data Analyst",
    overall_advice:
      "คุณมีพื้นฐานที่ดีในด้าน Technical (Python/Excel) ซึ่งเป็นจุดแข็งสำคัญในตลาดงานปี 2026 ผมแนะนำให้เริ่มจากสายงานที่ตรงกับความสนใจมากที่สุด หากชอบงานเทคนิคแนะนำ Data Analyst แต่หากต้องการงานที่มั่นคงและเริ่มได้เร็ว IT Support คือทางเลือกที่ดีครับ",
    skill_sufficient: false,
  },
  validation: {
    passed: false,
    quality_score: 85,
    summary:
      "ข้อมูลมีความครบถ้วนตามโครงสร้างที่กำหนด แต่พบปัญหาเรื่องแหล่งข้อมูล (free_resource) ที่ยังเป็นชื่อแหล่งเรียนรู้ ไม่ใช่ลิงก์ URL ที่ขึ้นต้นด้วย https ตามเงื่อนไขที่ระบุไว้",
    warnings: [],
    critical_issues: [
      {
        section: "skill_gaps",
        severity: "critical",
        field: "free_resource",
        issue:
          "Resources provided are names of platforms or general search terms, not direct HTTPS URLs as required by the schema constraints.",
        fix: "Replace resource names with direct, valid HTTPS URLs to specific learning materials.",
      },
    ],
    retry_count: 1,
  },
};

export default function ChatInterface({
  showResumeDropzone,
  isDraggingOver,
  uploadedFile,
  setUploadedFile,
  setShowResumeDropzone,
}: ChatAreaProps) {
  const suggestionsMessages = [
    "🔎​ Resume Review",
    "📝 Career Pivot Guide",
    "🗺️ Skill Roadmap",
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [workflowStep, setWorkflowStep] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const addMessage = (msg: Omit<ChatMessage, "timestamp">) =>
    setMessages((prev) => [...prev, { ...msg, timestamp: new Date() }]);

  // useEffect(() => {
  //   setMessages([hasGoalExample]);
  // }, []);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();

    setInput("");
    setIsLoading(true);
    addMessage({ role: "user", message: input });

    try {
      if (!hasAnalyzed) {
        // Listen workflow progress from backend SSE while waiting for /analyze
        setWorkflowStep("กำลังเริ่มรันขั้นตอน...");
        const es = new EventSource(`${process.env.API_URL}/stream`);
        eventSourceRef.current = es;

        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data?.event === "node_start") {
              setWorkflowStep(data?.desc || data?.node || "กำลังรันขั้นตอน...");
            } else if (data?.event === "done") {
              setWorkflowStep(null);
              es.close();
              eventSourceRef.current = null;
            }
          } catch {
            // Ignore malformed SSE payloads
          }
        };

        es.onerror = () => {
          setWorkflowStep(null);
          es.close();
          if (eventSourceRef.current === es) {
            eventSourceRef.current = null;
          }
        };

        // Call analysis API
        const result = await analyzeCareer(
          userMessage,
          uploadedFile || undefined,
        );
        setHasAnalyzed(true);
        setUploadedFile(null);
        addMessage({
          role: "assistant",
          message: result.message,
          analysis: result.analysis || undefined,
          validation: result.validation,
        });
      } else {
        const result = await sendChat(userMessage);
        addMessage({ role: "assistant", message: result.message });
      }
    } catch (err) {
      const e = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      addMessage({
        role: "assistant",
        message: `❌ เกิดข้อผิดพลาด: ${
          e.response?.data?.detail || e.message || String(err)
        }`,
      });
    } finally {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setWorkflowStep(null);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = useCallback((file: File) => {
    setUploadedFile(file);
    setShowResumeDropzone(false);
  }, []);

  const handleClearFile = useCallback(() => {
    setUploadedFile(null);
    setShowResumeDropzone(false);
  }, []);

  const renderAnalysis = (analysis: AnalysisResult & { user_id?: string }) => {
    if (analysis.path_type === "no_goal_sufficient") {
      const analy = analysis as NoGoalSufficientAnalysis & { user_id?: string };

      // no_goal_sufficient
      return (
        <ReadyCareersView
          readyCareers={analy.ready_careers || []}
          nearReachCareers={analy.near_reach_careers || []}
        />
      );
    }

    if (analysis.path_type === "no_goal_insufficient") {
      const analy = analysis as NoGoalInsufficientAnalysis & {
        user_id?: string;
      };

      const normalizedCareers = (analy.recommended_careers || []).map(
        (career) => ({
          ...career,
          skill_gaps: (career.skill_gaps || []).map((gap) => ({
            ...gap,
            // `MultiCareerGapView` expects learn_time always be a string.
            learn_time: gap.learn_time ?? "",
            // Normalize `null` -> `undefined` to match `MultiCareerGapView` prop types.
            free_resource: gap.free_resource ?? undefined,
          })),
        }),
      );

      // no_goal_insufficient
      return (
        <MultiCareerGapView
          careers={normalizedCareers}
          easiest_path={analy.easiest_path}
          highest_salary_path={analy.highest_salary_path}
          overall_advice={analy.overall_advice}
          detected_skills={(analy.detected_skills || []).map((s) => s.name)}
        />
      );
    }

    // has_goal path
    return <AnalysisPanel analysis={analysis} sessionType="with_goal" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#eaeaea]">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 bg-black">
              <Sparkles className="h-8 w-8 text-primary text-white" />
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-3 font-mono tracking-tight text-balance">
              Your AI Career Advisor
            </h2>
            <p className="text-muted-foreground max-w-md leading-relaxed text-balance">
              Get personalized career guidance, resume feedback, interview tips,
              and job search strategies. Upload your resume or start a
              conversation.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {suggestionsMessages.map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-4 py-2 rounded-xl bg-secondary text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors border bg-gray-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {workflowStep && !hasAnalyzed && isLoading && (
          <div className="mx-auto w-[90%] mt-4 mb-2 bg-brand-50 border border-gray-400 rounded-2xl p-3 flex items-center gap-2 text-brand-700">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-medium">กำลังรันขั้นตอน:</span>
            <span className="text-sm">{workflowStep}</span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="flex justify-center w-full">
            <div
              className={`max-w-[85%] space-y-3 flex flex-col items-start w-[90%] mt-5 mb-5`}
            >
              {/* <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${
                      msg.role === "user"
                        ? "bg-brand-500 text-white rounded-br-sm"
                        : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm"
                    }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                  </div>
                ) : (
                  msg.message
                )}
              </div> */}

              {/* {msg.validation && (
                <div className="w-full">
                  <ValidationBadge validation={msg.validation} />
                </div>
              )} */}

              {msg.analysis && (
                // <Card className="w-full bg-white p-4">
                <div className="w-full">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      ผลการวิเคราะห์
                    </h2>
                  </div>

                  {renderAnalysis(
                    msg.analysis as AnalysisResult & { user_id?: string },
                  )}
                </div>
                // </Card>
              )}

              {/* <span className="text-xs text-gray-300 px-1">
                {msg.timestamp.toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span> */}
            </div>
          </div>
        ))}
      </div>

      {/* Input Section - Fixed at Bottom */}
      <div className="bg-white">
        <div className="max-w-3xl mx-auto flex flex-col gap-4 m-4">
          {(showResumeDropzone || isDraggingOver || !!uploadedFile) && (
            <Dropzone
              onFileUpload={handleFileUpload}
              uploadedFile={uploadedFile}
              onClearFile={handleClearFile}
              isDraggingOver={isDraggingOver}
            />
          )}
          {!hasAnalyzed && (
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end gap-2 p-2 bg-secondary rounded-xl border border-border">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your career, skills, or job search..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground py-2.5 px-2 min-h-[44px] max-h-[200px]"
                />
                {/* <Button
                  type="submit"
                  size="3"
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send message</span>
                </Button> */}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
