"use client";

import { useState, useRef, useEffect } from "react";
import { X, UploadCloud, FileText, Loader2, CheckCircle2, BookOpen, Layers } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface UploadKBModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onUploaded: (subjectId: string, fileName: string) => void;
  availableSubjects?: any[];
}

export default function UploadKBModal({
  isOpen,
  onClose,
  token,
  onUploaded,
  availableSubjects = [],
}: UploadKBModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isUploading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB
    if (selectedFile.size > maxSizeBytes) {
      showToast("File size exceeds 25MB limit. Please choose a smaller file.", "error");
      return;
    }
    setFile(selectedFile);

    // Auto-suggest subject name if empty
    if (!subjectId) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setSubjectId(cleanName.slice(0, 30));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast("Please select a document to upload.", "error");
      return;
    }
    if (!subjectId.trim()) {
      showToast("Please specify a subject domain for this document.", "error");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subject_id", subjectId.trim());

      const res = await apiFetch("/kb/upload", {
        token,
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        showToast(`Document "${file.name}" successfully indexed into Knowledge Base!`, "success");
        onUploaded(subjectId.trim(), file.name);
        setFile(null);
        setSubjectId("");
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.detail || "Upload failed. Please check the file format.", "error");
      }
    } catch {
      showToast("Upload network error. Please verify backend connection.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={() => {
        if (!isUploading) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-[#111C31] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-4 sm:p-6 max-w-lg w-full mx-3 sm:mx-auto shadow-2xl space-y-4 sm:space-y-5 relative max-h-[92vh] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#263449] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9]">Upload New Knowledge Base Document</h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">Embed course notes or textbooks into Vector Store</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#111827] dark:hover:text-white p-1 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Subject / Domain Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#64748B] dark:text-[#A3B1C6] uppercase tracking-wider">
              Subject / Knowledge Domain <span className="text-blue-600 dark:text-blue-400">*</span>
            </label>
            <input
              type="text"
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              placeholder="e.g. Physics_Unit_2 or Machine_Learning"
              list="existing-subjects-datalist"
              className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] dark:text-[#F1F5F9] placeholder-[#A3B1C6] focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
            {availableSubjects.length > 0 && (
              <datalist id="existing-subjects-datalist">
                {availableSubjects.map((s: any) => (
                  <option key={s.subject_id || s.name} value={s.subject_id || s.name} />
                ))}
              </datalist>
            )}
            <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
              Type a new subject name or pick an existing subject domain to group documents.
            </p>
          </div>

          {/* Drag & Drop File Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#64748B] dark:text-[#A3B1C6] uppercase tracking-wider">
              Source Document File <span className="text-blue-600 dark:text-blue-400">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                  : file
                  ? "border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10"
                  : "border-[#E2E8F0] dark:border-[#263449] hover:border-blue-600/60 bg-[#F8FAFC] dark:bg-[#17243A]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.pptx,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#111C31] border border-emerald-500/30">
                  <div className="flex items-center gap-2.5 text-left truncate">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] truncate">{file.name}</div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 py-2">
                  <UploadCloud className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto" />
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Click to browse or drop file here
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">
                    Supports PDF, DOCX, TXT, PPTX, MD (Max: 25MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] text-xs font-bold text-[#64748B] dark:text-[#A3B1C6] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Embedding into Vector DB...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload & Index Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
