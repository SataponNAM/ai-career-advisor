"use client";

import { ChatMessage } from "@/types";
import { Button } from "@radix-ui/themes";
import { Send, Sparkles } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import Dropzone from "./Dropzone";

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
