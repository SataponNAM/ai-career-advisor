import { cn } from "@/utils/CN";
import { Button } from "@radix-ui/themes";
import { CheckCircle, FileText, Upload, X } from "lucide-react";
import { useState, useCallback } from "react";

interface DropzoneProps {
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
  onClearFile: () => void;
  isDraggingOver?: boolean;
}

export default function Dropzone({
  onFileUpload,
  uploadedFile,
  onClearFile,
  isDraggingOver,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const isActive = isDragging || isDraggingOver;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
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
          onFileUpload(file);
        }
      }
    },
    [onFileUpload],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileUpload(file);
      }
    },
    [onFileUpload],
  );

  if (uploadedFile) {
    return (
      <div className="border border-primary/50 bg-primary/10 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {uploadedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="3"
          onClick={onClearFile}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
        isActive
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 hover:bg-secondary/50",
      )}
    >
      <input
        type="file"
        id="resume-upload"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />
      <label htmlFor="resume-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
            {isActive ? (
              <FileText className="h-7 w-7 text-primary" />
            ) : (
              <Upload className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop your resume here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse (PDF, DOC, DOCX)
            </p>
          </div>
        </div>
      </label>
    </div>
  );
}
