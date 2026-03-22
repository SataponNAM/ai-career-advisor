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
        years_experience: 0.6,
        education:
          "Bachelor of Science in Computer Science, King Mongkut’s University of Technology North Bangkok",
        summary:
          "คุณ Satapon เป็นนักศึกษาปีสุดท้ายที่มีพื้นฐานด้าน Full-stack Development ที่แข็งแกร่ง โดยมีประสบการณ์ฝึกงาน 7 เดือนที่ REPCO NEX ในการทำ Modernization ระบบเก่าให้เป็นเทคโนโลยีสมัยใหม่ (Next.js, Nest.js, PostgreSQL) มีทักษะครอบคลุมทั้ง Web, Mobile (Flutter), และ Data Science (Python/ML) พร้อมด้วย GPAX 3.51 ถือเป็น Candidate ที่มีศักยภาพสูงและพร้อมเริ่มงาน Full-time ครับ",
      },
      detected_skills: [],
      recommended_careers: [
        {
          title: "Software Developer",
          match_score: 0,
        },
      ],
      skill_gaps: [
        {
          skill: "Python (AI/ML Integration)",
          importance: "critical",
          reason:
            "Python is the industry standard for AI/ML and data-driven development. Mastering it is essential for modern backend and data engineering roles.",
          demand_score: 9.8,
        },
        {
          skill: "Cloud Computing (AWS/Azure)",
          importance: "important",
          reason:
            "Enterprise systems are moving to cloud-native architectures; understanding deployment and scalability is a key differentiator.",
          demand_score: 9.2,
        },
        {
          skill: "SQL & Database Optimization",
          importance: "important",
          reason:
            "Data-centric applications require deep knowledge of relational databases to ensure performance and reliability.",
          demand_score: 8.9,
        },
        {
          skill: "AI Literacy & Prompt Engineering",
          importance: "important",
          reason:
            "Using AI tools to accelerate coding and documentation is becoming a baseline expectation for productivity.",
          demand_score: 8.5,
        },
      ],
      roadmap: {
        target_role: "Software Developer (AI-Integrated/Cloud-Native)",
        total_duration: "3 months",
        milestones: [
          {
            week: "Week 1-3",
            title: "Python Mastery & AI Literacy",
            tasks: [
              "Master Python advanced concepts (Decorators, Generators, AsyncIO)",
              "Learn Prompt Engineering for code generation and debugging",
              "Integrate OpenAI API or LangChain into a simple CLI project",
            ],
            resources: [
              {
                name: "Python for Data Science and AI (Coursera/FreeCodeCamp)",
                url: "https://www.freecodecamp.org/",
                type: "course",
                cost: "free",
              },
            ],
            success_metric:
              "Build a functional AI-powered CLI tool that automates a daily task.",
          },
          {
            week: "Week 4-7",
            title: "SQL & Database Optimization",
            tasks: [
              "Deep dive into SQL indexing, query execution plans, and normalization",
              "Learn NoSQL basics (MongoDB) for unstructured data",
              "Practice complex joins and window functions for data analytics",
            ],
            resources: [
              {
                name: "SQL Tutorial (W3Schools/Mode Analytics)",
                url: "https://mode.com/sql-tutorial/",
                type: "course",
                cost: "free",
              },
            ],
            success_metric:
              "Optimize a slow-running SQL query and demonstrate performance improvement.",
          },
          {
            week: "Week 8-10",
            title: "Cloud Computing (AWS/Azure)",
            tasks: [
              "Understand Cloud architecture (IaaS, PaaS, Serverless)",
              "Deploy a Python application to AWS Lambda or Azure Functions",
              "Learn basic CI/CD pipeline setup using GitHub Actions",
            ],
            resources: [
              {
                name: "AWS Cloud Practitioner Essentials",
                url: "https://explore.skillbuilder.aws/",
                type: "course",
                cost: "free",
              },
            ],
            success_metric:
              "Successfully deploy a web service to the cloud with automated deployment.",
          },
          {
            week: "Week 11-12",
            title: "Architect-Thinker Integration",
            tasks: [
              "Study System Design patterns (Microservices, Event-driven)",
              "Practice technical communication: Documenting architecture decisions",
              "Build a capstone project combining Python, SQL, and Cloud",
            ],
            resources: [
              {
                name: "System Design Primer (GitHub)",
                url: "https://github.com/donnemartin/system-design-primer",
                type: "documentation",
                cost: "free",
              },
            ],
            success_metric:
              "Present a technical project portfolio that explains the 'why' behind your architecture.",
          },
        ],
        key_certifications: [
          "AWS Certified Developer – Associate",
          "Microsoft Certified: Azure Developer Associate",
          "PCAP – Certified Associate in Python Programming",
        ],
        daily_commitment: "2-3 hours",
        motivational_message:
          "เส้นทางนี้อาจจะดูท้าทาย แต่ทุกบรรทัดที่คุณเขียนและทุกความรู้ที่คุณเก็บเกี่ยวในวันนี้ คือการลงทุนเพื่ออนาคตที่มั่นคงในฐานะ Architect-Thinker คุณทำได้แน่นอนครับ! สู้ๆ นะครับ!",
      },
      market_insights: [
        "Tech recruiters in 2026 are shifting focus from 'code-only' developers to 'architect-thinkers' who can communicate technical value to product teams.",
        "Soft skills like technical communication and systems thinking are now as critical as core programming languages.",
        "The demand for SQL and Python continues to surge as businesses prioritize data-driven decision-making and AI integration.",
        "AI literacy is no longer a 'nice-to-have'; it is a core competency for maintaining developer velocity.",
      ],
      salary_range: {
        min: "60,000",
        max: "180,000",
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
      quality_score: 75,
      summary:
        "ข้อมูลไม่ผ่านเกณฑ์การตรวจสอบ เนื่องจากขาดฟิลด์ 'description' ในส่วนของ careers และข้อมูลในส่วนของ skills ว่างเปล่า ซึ่งขัดกับข้อกำหนดที่ระบุไว้",
      warnings: [],
      critical_issues: [
        {
          section: "careers",
          severity: "critical",
          field: "description",
          issue:
            "The 'careers' array objects are missing the 'description' field required by the validation schema.",
          fix: "Add a 'description' field to each career object explaining the role.",
        },
        {
          section: "skills",
          severity: "critical",
          field: "skills",
          issue:
            "The 'skills' array is empty, making it impossible to assess current proficiency levels.",
          fix: "Populate the 'skills' array with at least one skill and a corresponding proficiency level.",
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
