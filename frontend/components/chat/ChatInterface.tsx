"use client";

import {
  AnalysisResult,
  ChatMessage,
  NoGoalInsufficientAnalysis,
  NoGoalSufficientAnalysis,
} from "@/types";
import { Button } from "@radix-ui/themes";
import { Send, Sparkles } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Dropzone from "./Dropzone";
import ReadyCareersView from "../career/ReadyCareersView";
import MultiCareerGapView from "../career/MultiCareerGapView";
import AnalysisPanel from "../roadmap/AnalysisPanel";

interface ChatAreaProps {
  showResumeDropzone: boolean;
  isDraggingOver: boolean;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  setShowResumeDropzone: (show: boolean) => void;
}

const analysisExample: ChatMessage = {
  role: "assistant",
  content:
    "Based on your resume, you have strong experience in software development but limited exposure to cloud technologies. I recommend focusing on learning AWS or Azure to enhance your career prospects in the cloud computing field.",
  timestamp: new Date(),
  analysis: {
    path_type: "has_goal",
    current_profile: {
      current_role:
        "Final-year Computer Science student / Full Stack Developer Intern",
      years_experience: 0.5,
      education:
        "Bachelor of Science in Computer Science, King Mongkut’s University of Technology North Bangkok",
      summary:
        "คุณ Satapon เป็นนักศึกษาปีสุดท้ายที่มีพื้นฐาน Full-stack ที่แข็งแกร่ง โดยเฉพาะการใช้ Next.js, Nest.js และ PostgreSQL จากประสบการณ์ฝึกงาน 7 เดือนที่ REPCO NEX นอกจากนี้ยังมีโปรเจกต์ที่หลากหลายทั้ง Mobile App (Flutter), Data Science (Python) และ Web App (MERN Stack) ถือเป็น Candidate ที่มีทักษะพร้อมลุยงานจริงและมี GPAX ที่โดดเด่น (3.51) แนะนำให้เน้นโชว์ผลงานการทำ System Migration ในช่วงสัมภาษณ์ครับ",
    },
    detected_skills: [
      {
        name: "JavaScript",
        level: "advanced",
        category: "technical",
      },
      {
        name: "TypeScript",
        level: "advanced",
        category: "technical",
      },
      {
        name: "Next.js",
        level: "intermediate",
        category: "technical",
      },
      {
        name: "Nest.js",
        level: "intermediate",
        category: "technical",
      },
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
        name: "PostgreSQL",
        level: "intermediate",
        category: "technical",
      },
      {
        name: "Docker",
        level: "beginner",
        category: "technical",
      },
      {
        name: "Python",
        level: "intermediate",
        category: "technical",
      },
      {
        name: "Java",
        level: "intermediate",
        category: "technical",
      },
    ],
    recommended_careers: [
      {
        title: "Software Developer",
        match_score: 0,
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
      milestones: [],
      key_certifications: [
        "AWS Certified Developer – Associate",
        "Docker Certified Associate",
      ],
      daily_commitment: "2-3 hours",
      motivational_message:
        "คุณมีพื้นฐานที่แข็งแกร่งอยู่แล้ว การก้าวไปสู่ระดับ Senior ไม่ใช่แค่เรื่องของ Code แต่คือการมองภาพรวมของระบบให้ขาด สู้ๆ นะครับ! การลงทุนกับเวลา 3 เดือนนี้จะเปลี่ยน career path ของคุณไปสู่ระดับที่สูงขึ้นอย่างแน่นอน",
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
    passed: false,
    quality_score: 65,
    summary:
      "ข้อมูลไม่ผ่านเกณฑ์การตรวจสอบ เนื่องจาก Roadmap ว่างเปล่าและคะแนนความเหมาะสม (match_score) ไม่สมเหตุสมผลกับทักษะที่มีอยู่",
    warnings: [
      {
        section: "careers",
        severity: "warning",
        field: "description",
        issue:
          "The careers object is missing the 'description' field required by the validation rules.",
        fix: "Add a professional summary description for the Software Developer role.",
      },
    ],
    critical_issues: [
      {
        section: "careers",
        severity: "critical",
        field: "match_score",
        issue:
          "The match_score is 0, which contradicts the provided skill set that clearly aligns with the Software Developer role.",
        fix: "Recalculate match_score based on skill overlap (expected: 85-95).",
      },
      {
        section: "roadmap",
        severity: "critical",
        field: "milestones",
        issue:
          "The milestones array is empty, which violates the requirement for at least 2 milestones with real tasks.",
        fix: "Populate milestones with concrete tasks (e.g., Month 1: AWS fundamentals, Month 2: CI/CD implementation).",
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
    "Review my resume",
    "Career transition tips",
    "Learning Roadmap",
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addMessage = (msg: Omit<ChatMessage, "timestamp">) =>
    setMessages((prev) => [...prev, { ...msg, timestamp: new Date() }]);

  useEffect(() => {
    setMessages([analysisExample]);
  }, []);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();

    setInput("");
    setIsLoading(true);
    addMessage({ role: "user", content: input });

    try {
      if (!hasAnalyzed) {
        // Call analysis API
        setHasAnalyzed(true);
        setUploadedFile(null);
        // addMessage({
        //   role: 'assistant',
        //   content: result.message,
        //   // inject user_id so child components can call skill-upgrade
        //   analysis: result.analysis ? { ...result.analysis, user_id: userId } as any : undefined,
        //   validation: result.validation,
        // })
      } else {
        // Call chat API
      }
    } catch (err) {
      addMessage({
        role: "assistant",
        content: `❌ เกิดข้อผิดพลาด: ${err.response?.data?.detail || err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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
      const a = analysis as NoGoalSufficientAnalysis & { user_id?: string };
      return (
        <ReadyCareersView
          readyCareers={a.ready_careers || []}
          nearReachCareers={a.near_reach_careers || []}
        />
      );
    }
    if (analysis.path_type === "no_goal_insufficient") {
      const a = analysis as NoGoalInsufficientAnalysis & { user_id?: string };
      return (
        <MultiCareerGapView
          careers={(a.recommended_careers || []) as any}
          easiest_path={a.easiest_path}
          highest_salary_path={a.highest_salary_path}
          overall_advice={a.overall_advice}
          detected_skills={(a.detected_skills || []).map((s) => s.name)}
        />
      );
    }
    return <AnalysisPanel analysis={analysis} sessionType="with_goal" />;
    // return <p>asas</p>
  };

  return (
    <>
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="h-10 w-10 text-primary" />
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
                className="px-4 py-2 rounded-full bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors border border-border"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <div key={i} className="flex justify-center">
          <div
            className={`max-w-[85%] space-y-3 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${
                    msg.role === "user"
                      ? "bg-brand-500 text-white rounded-br-sm"
                      : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm"
                  }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>

            {/* {msg.validation && (
              <div className="w-full">
                <ValidationBadge validation={msg.validation} />
              </div>
            )} */}

            {msg.analysis && (
              <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-500" />
                  ผลการวิเคราะห์
                </h3>

                {renderAnalysis(
                  msg.analysis as AnalysisResult & { user_id?: string },
                )}
              </div>
            )}

            <span className="text-xs text-gray-300 px-1">
              {msg.timestamp.toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ))}

      <div className="border-t border-border p-4 bg-card/50">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {(showResumeDropzone || isDraggingOver || !!uploadedFile) && (
            <Dropzone
              onFileUpload={handleFileUpload}
              uploadedFile={uploadedFile}
              onClearFile={handleClearFile}
              isDraggingOver={isDraggingOver}
            />
          )}

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
              <Button
                type="submit"
                size="3"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
