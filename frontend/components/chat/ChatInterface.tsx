"use client";

import {
  AnalysisResult,
  ChatMessage,
  NoGoalInsufficientAnalysis,
  NoGoalSufficientAnalysis,
} from "@/types";
import { Button } from "@radix-ui/themes";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import Dropzone from "./Dropzone";
import ReadyCareersView from "../career/ReadyCareersView";
import MultiCareerGapView from "../career/MultiCareerGapView";
import AnalysisPanel from "../roadmap/AnalysisPanel";
import { analyzeCareer } from "@/utils/api";

interface ChatAreaProps {
  showResumeDropzone: boolean;
  isDraggingOver: boolean;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  setShowResumeDropzone: (show: boolean) => void;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const resetChatView = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setMessages([]);
    setHasAnalyzed(false);
    setWorkflowStep(null);
    setUploadedFile(null);
    setShowResumeDropzone(false);
  }, [setShowResumeDropzone, setUploadedFile]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();

    if (hasAnalyzed) {
      resetChatView();
    }

    setInput("");
    setIsLoading(true);
    addMessage({ role: "user", message: userMessage });

    try {
      // Listen workflow progress from backend SSE while waiting for /analyze
      setWorkflowStep("กำลังเริ่มรันขั้นตอน...");
      const es = new EventSource(
        `${process.env.API_URL || "http://localhost:8000"}/stream`,
      );
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

  const handleFileUpload = useCallback(
    (file: File) => {
      setUploadedFile(file);
      setShowResumeDropzone(false);
    },
    [setShowResumeDropzone, setUploadedFile],
  );

  const handleUploadButtonClick = useCallback(() => {
    setShowResumeDropzone(true);
    fileInputRef.current?.click();
  }, [setShowResumeDropzone]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
      // Allow re-selecting the same file.
      e.currentTarget.value = "";
    },
    [handleFileUpload],
  );

  const handleClearFile = useCallback(() => {
    setUploadedFile(null);
    setShowResumeDropzone(false);
  }, [setShowResumeDropzone, setUploadedFile]);

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

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex flex-col gap-2 p-2 bg-secondary rounded-xl border border-border">
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

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex w-full">
                <div className="flex flex-1 items-center ml-2">
                  <Button
                    size="3"
                    className="h-10 w-10 shrink-0 bg-black hover:bg-black/90"
                    variant="ghost"
                    type="button"
                    onClick={handleUploadButtonClick}
                    title="Upload file"
                    aria-label="Upload file"
                  >
                    <Plus className="h-5 w-5 text-gray-500" />
                    <span className="sr-only">Upload File</span>
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
