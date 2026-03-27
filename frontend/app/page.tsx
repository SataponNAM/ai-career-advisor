"use client";

import ChatInterface from "@/components/chat/ChatInterface";
import { Navbar } from "@/components/Navbar";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
  const dragCounterRef = useRef(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showResumeDropzone, setShowResumeDropzone] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const resetDragState = useCallback(() => {
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    if (!uploadedFile) setShowResumeDropzone(false);
  }, [uploadedFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.dataTransfer.types.includes("Files")) return;

    dragCounterRef.current += 1;
    setIsDraggingOver(true);
    setShowResumeDropzone(true);
  }, []);

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();

      // ออกนอก container จริง ๆ
      const isOutside =
        e.clientX <= rect.left ||
        e.clientX >= rect.right ||
        e.clientY <= rect.top ||
        e.clientY >= rect.bottom;

      if (isOutside) {
        resetDragState();
        return;
      }

      // กรณีสลับผ่าน child elements
      const related = e.relatedTarget as Node | null;
      if (related && container.contains(related)) return;

      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setIsDraggingOver(false);
        if (!uploadedFile) setShowResumeDropzone(false);
      }
    },
    [resetDragState, uploadedFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const isValidType =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx");

      if (isValidType) {
        setUploadedFile(file);
        setShowResumeDropzone(false);
      }
    }
  }, []);

  useEffect(() => {
    const forceReset = () => resetDragState();
    window.addEventListener("drop", forceReset);
    window.addEventListener("dragend", forceReset);
    window.addEventListener("blur", forceReset);

    return () => {
      window.removeEventListener("drop", forceReset);
      window.removeEventListener("dragend", forceReset);
      window.removeEventListener("blur", forceReset);
    };
  }, [resetDragState]);

  return (
    <div
      className="flex flex-col h-screen bg-background relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Navbar />

      <main className="flex-1 flex flex-col min-h-0">
        <ChatInterface
          showResumeDropzone={showResumeDropzone}
          isDraggingOver={isDraggingOver}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          setShowResumeDropzone={setShowResumeDropzone}
        />
      </main>
    </div>
  );
}
