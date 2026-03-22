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
      current_role: "Software Engineer",
      years_experience: 5,
      education: "Bachelor's in Computer Science",
      summary:
        "Experienced software engineer with a focus on backend development and a passion for learning new technologies.",
    },
    detected_skills: [
      { name: "Python", level: "advanced", category: "technical" },
      { name: "Java", level: "advanced", category: "technical" },
      { name: "SQL", level: "intermediate", category: "technical" },
    ],
    recommended_careers: [
      { title: "Cloud Engineer", match_score: 0.9 },
      { title: "DevOps Engineer", match_score: 0.85 },
    ],
    skill_gaps: [
      {
        skill: "AWS",
        importance: "critical",
        reason: "Highly recommended for cloud-related roles",
      },
      {
        skill: "Azure",
        importance: "important",
        reason: "Valuable for cloud-related roles",
      },
    ],
    roadmap: null,
    market_insights: [
      "Cloud computing is one of the fastest-growing sectors in tech.",
      "AWS and Azure are the leading cloud platforms with high demand for skilled professionals.",
    ],
    salary_range: {
      min: "80000",
      max: "120000",
      currency: "USD",
      period: "year",
    },
    preferences_applied: { location: "Bangkok", remote: true },
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
