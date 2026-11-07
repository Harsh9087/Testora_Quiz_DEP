'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FolderPlus, 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  DownloadCloud, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { createStudentDirectory, importStudentsCSV } from '@/lib/api/studentDirectories';
import { StudentDirectory } from '@/types/studentDirectory';
import { API_V1, apiFetch, getFrontendBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface CreateDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newDir: StudentDirectory) => void;
  defaultMethod?: 'csv' | 'form';
}

export default function CreateDirectoryModal({
  isOpen,
  onClose,
  onCreated,
  defaultMethod = 'csv'
}: CreateDirectoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rosterMethod, setRosterMethod] = useState<'csv' | 'form'>(defaultMethod);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [csvValidationError, setCsvValidationError] = useState<string | null>(null);
  
  // Successful creation share state
  const [shareData, setShareData] = useState<{
    directory: StudentDirectory;
    formSlug: string;
    shareUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRosterMethod(defaultMethod);
    }
  }, [isOpen, defaultMethod]);

  const validateCsvFileHeaders = (file: File) => {
    setCsvValidationError(null);
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setCsvValidationError('The selected CSV file is empty.');
        return;
      }
      const firstLine = content.split('\n')[0].toLowerCase();
      const hasName = firstLine.includes('name');
      const hasEmail = firstLine.includes('email') || firstLine.includes('mail');
      const hasRoll = firstLine.includes('roll') || firstLine.includes('id') || firstLine.includes('reg') || firstLine.includes('enroll');

      if (!hasName || !hasEmail || !hasRoll) {
        const missing = [];
        if (!hasRoll) missing.push('Roll Number / Student ID');
        if (!hasName) missing.push('Full Name');
        if (!hasEmail) missing.push('Email Address');
        setCsvValidationError(
          `Invalid CSV Format: File is missing required platform columns (${missing.join(', ')}). Platform rule: Student Directory CSV must strictly include Roll Number, Name, and Email.`
        );
      }
    };
    reader.readAsText(file.slice(0, 4096));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        handleModalClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, shareData]);

  if (!isOpen) return null;

  const handleModalClose = () => {
    if (shareData) {
      onCreated(shareData.directory);
    }
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCsvFile(null);
    setRosterMethod('csv');
    setShareData(null);
    setError(null);
    setCopied(false);
    setCsvValidationError(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validExts = ['.csv', '.xlsx', '.xls', '.tsv', '.txt'];
      const isValid = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (isValid) {
        setCsvFile(file);
        setError(null);
        validateCsvFileHeaders(file);
      } else {
        setError('Please drop a valid Excel (.xlsx, .xls) or CSV (.csv, .tsv) file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      setError(null);
      validateCsvFileHeaders(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this Student Directory.');
      return;
    }

    setLoading(true);
    setError(null);

    const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');

    try {
      // 1. Create the Student Directory
      const newDir = await createStudentDirectory(
        {
          name: name.trim(),
          description: description.trim() || undefined
        },
        token
      );

      // 2A. Method: CSV / Excel Upload
      if (rosterMethod === 'csv') {
        if (csvFile) {
          try {
            const importResult = await importStudentsCSV(newDir.id, csvFile, token);
            newDir.student_count = importResult.imported_count;
          } catch (err: any) {
            console.error('CSV import warning:', err);
          }
        }
        onCreated(newDir);
        resetForm();
        onClose();
        return;
      }

      // 2B. Method: Auto-generate Student Registration Form & WhatsApp Link
      if (rosterMethod === 'form') {
        let formSlug = '';
        try {
          const formRes = await apiFetch('/registration-forms', {
            method: 'POST',
            token,
            body: JSON.stringify({
              title: name.trim(),
              description: `[dir_id:${newDir.id}] - ${description.trim() || 'Online student registration form'}`
            })
          });

          if (formRes.ok) {
            const formData = await formRes.json();
            formSlug = formData.share_slug || '';
          }
        } catch (err) {
          console.error('Failed to create registration form:', err);
        }

        const frontendUrl = getFrontendBaseUrl();
        const shareUrl = formSlug ? `${frontendUrl}/forms/${formSlug}` : '';

        // Transition modal to WhatsApp Share & Invite screen
        setShareData({
          directory: newDir,
          formSlug,
          shareUrl
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create student directory');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!shareData?.shareUrl) return;
    const msg = `Dear Students, please register your details for "${shareData.directory.name}":\n\n📝 Registration Form: ${shareData.shareUrl}\n\nPlease submit your Full Name, Roll Number, and Section so your details are synced for upcoming assessments.`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    if (!shareData?.shareUrl) return;
    navigator.clipboard.writeText(shareData.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!loading) handleModalClose();
      }}
    >
      <div 
        className="relative w-full max-w-lg mx-auto overflow-hidden bg-[#FFFFFF] dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#141312] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border border-[#C84B18]/20">
              {shareData ? <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#242321] dark:text-[#F5F5F4]">
                {shareData ? 'Directory & Form Ready!' : 'Create Student Directory'}
              </h3>
              <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">
                {shareData ? 'Share link via WhatsApp to auto-collect student data' : 'Add a cohort or class roster for assessments'}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-2 text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white rounded-lg hover:bg-[#F0ECE4] dark:hover:bg-[#292524] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {shareData ? (
          /* SUCCESS STATE: WhatsApp Sharing & Link Screen */
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#242321] dark:text-[#F5F5F4]">
                  Directory &quot;{shareData.directory.name}&quot; Created
                </h4>
                <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-0.5">
                  An online registration form has been configured. Spread the link to students via WhatsApp so they submit their details.
                </p>
              </div>
            </div>

            {/* WhatsApp 1-Click Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/10 transition-all cursor-pointer text-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.33C9.33 7.33 9 7.41 8.76 7.67C8.5 7.94 7.82 8.58 7.82 9.87C7.82 11.16 8.76 12.41 8.9 12.59C9.03 12.77 10.73 15.4 13.36 16.54C15.54 17.48 16 17.29 16.46 17.25C16.93 17.21 17.97 16.63 18.19 16.03C18.41 15.42 18.41 14.9 18.34 14.79C18.28 14.68 18.1 14.62 17.84 14.49C17.58 14.36 16.3 13.73 16.06 13.65C15.83 13.56 15.66 13.52 15.5 13.78C15.33 14.04 14.85 14.62 14.71 14.79C14.56 14.96 14.42 14.98 14.16 14.85C13.9 14.72 13.06 14.45 12.06 13.56C11.28 12.87 10.76 12.01 10.61 11.75C10.46 11.49 10.6 11.35 10.73 11.22C10.84 11.11 10.98 10.92 11.12 10.76C11.25 10.6 11.3 10.48 11.39 10.31C11.47 10.13 11.43 9.98 11.37 9.85C11.3 9.72 10.83 8.56 10.63 8.08C10.44 7.62 10.24 7.68 10.09 7.67C9.95 7.67 9.78 7.33 9.53 7.33Z"/>
              </svg>
              <span>Share Link on WhatsApp</span>
            </button>

            {/* Copyable Link Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#57534E] dark:text-[#A8A29E]">
                Student Registration URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareData.shareUrl}
                  className="flex-1 px-3 py-2 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#1E1C1A] text-[#242321] dark:text-[#F5F5F4] hover:bg-[#F5F2EB] dark:hover:bg-[#292524] flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Note on data flow */}
            <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] text-[11px] text-[#716D67] dark:text-[#A8A29E] space-y-1">
              <div className="font-semibold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C84B18]" />
                <span>Automatic Directory Synchronization</span>
              </div>
              <p>
                As students complete the mobile form, their verified Name, Roll Number, and Email can be imported directly into this directory and ready to assign in live tests.
              </p>
            </div>

            {/* Finish Action */}
            <div className="pt-3 border-t border-[#E5E0D8] dark:border-[#292524] flex justify-end">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#C84B18] hover:bg-[#B33F12] rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Done & Open Directory</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* FORM CREATION STATE */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E] mb-1.5">
                Directory Name <span className="text-[#C84B18]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CS 301 - Algorithm Design (Fall 2026)"
                className="w-full px-4 py-2.5 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-sm text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E] mb-1.5">
                Description <span className="text-[#716D67] dark:text-[#A8A29E] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Section B morning laboratory batch"
                className="w-full px-4 py-2.5 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-sm text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18] transition-all"
              />
            </div>

            {/* Segmented Method Selection: Excel Upload VS WhatsApp Form Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E]">
                Choose How to Populate Students
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Method 1: Upload Existing File */}
                <button
                  type="button"
                  onClick={() => setRosterMethod('csv')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    rosterMethod === 'csv'
                      ? 'bg-[#C84B18]/5 border-[#C84B18] ring-1 ring-[#C84B18]/30 dark:bg-[#EA580C]/10 dark:border-[#EA580C]'
                      : 'bg-[#F7F4EF]/60 dark:bg-[#141312] border-[#E5E0D8] dark:border-[#292524] hover:border-[#C84B18]/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-lg ${rosterMethod === 'csv' ? 'bg-[#C84B18] text-white' : 'bg-[#E5E0D8] dark:bg-[#292524] text-[#716D67]'}`}>
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">Upload Excel / CSV</span>
                  </div>
                  <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E] leading-snug">
                    Instant upload if you already have a class roster file
                  </p>
                </button>

                {/* Method 2: AI WhatsApp Form Link */}
                <button
                  type="button"
                  onClick={() => setRosterMethod('form')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    rosterMethod === 'form'
                      ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30 dark:bg-emerald-950/25 dark:border-emerald-500'
                      : 'bg-[#F7F4EF]/60 dark:bg-[#141312] border-[#E5E0D8] dark:border-[#292524] hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${rosterMethod === 'form' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'}`}>
                        <Share2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">AI WhatsApp Link</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E] leading-snug">
                    Generate share link. Students fill on mobile; auto-syncs to this directory
                  </p>
                </button>
              </div>
            </div>

            {/* Option A: CSV / Excel Upload Dropzone */}
            {rosterMethod === 'csv' && (
              <div className="space-y-3">
                {/* Platform Required CSV Schema Specification Banner */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Platform Required CSV Format</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded">
                      Strict Schema
                    </span>
                  </div>
                  <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                    Student directories strictly require these columns to publish exams:
                  </p>
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-[#1E1C1A] text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded">Roll Number *</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-[#1E1C1A] text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded">Name *</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-[#1E1C1A] text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded">Email *</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-[#716D67] dark:text-[#A8A29E]">
                    Initial Student Roster File
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#716D67]">
                    <span>Sample:</span>
                    <a
                      href={`${API_V1}/student-directories/template/excel`}
                      download="student_roster_template.xlsx"
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Excel
                    </a>
                    <span>·</span>
                    <a
                      href={`${API_V1}/student-directories/template/csv`}
                      download="student_roster_template.csv"
                      className="text-[#C84B18] font-semibold hover:underline"
                    >
                      CSV
                    </a>
                  </div>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv, .xlsx, .xls, .tsv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!csvFile ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E5E0D8] dark:border-[#292524] hover:border-[#C84B18]/50 bg-[#F7F4EF] dark:bg-[#141312] hover:bg-[#F0ECE4] dark:hover:bg-[#1C1A17] rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <div className="p-2.5 rounded-full bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C]">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-xs text-[#242321] dark:text-[#F5F5F4]">
                      <span className="text-[#C84B18] font-medium hover:underline">Click to upload Excel</span> or drag and drop
                    </div>
                    <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                      Supports .xlsx, .xls, .csv, and .tsv with automatic column detection
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3.5 bg-[#C84B18]/10 border border-[#C84B18]/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#C84B18]" />
                        <div>
                          <p className="text-xs font-medium text-[#242321] dark:text-[#F5F5F4] truncate max-w-[240px]">{csvFile.name}</p>
                          <p className="text-[10px] text-[#716D67] dark:text-[#A8A29E]">{(csvFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCsvFile(null);
                          setCsvValidationError(null);
                        }}
                        className="p-1 text-[#716D67] hover:text-red-500 rounded transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {csvValidationError ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{csvValidationError}</span>
                      </div>
                    ) : (
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>✓ Platform CSV Verified: Required columns detected!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Option B: Collect via WhatsApp & Online Form */}
            {rosterMethod === 'form' && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 via-[#F7F4EF] to-emerald-500/10 dark:from-emerald-950/20 dark:via-[#141312] dark:to-[#171615] border border-emerald-500/30 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-[#242321] dark:text-[#F5F5F4]">
                      Auto-Generate WhatsApp Registration Form
                    </h4>
                    <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E] leading-relaxed">
                      Don&apos;t have the CSV yet? An online form will be created for this directory. You will get a shareable WhatsApp invite link that students can fill from any mobile device.
                    </p>
                  </div>
                </div>

                {/* Pre-formatted Fields Badge */}
                <div className="pt-2 border-t border-emerald-500/20">
                  <p className="text-[10px] font-semibold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider mb-1.5">
                    Required fields collected from students:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Full Name', 'Roll Number', 'Email Address', 'Phone Number', 'Section', 'Branch'].map((field) => (
                      <span 
                        key={field} 
                        className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-md"
                      >
                        ✓ {field}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Responses auto-format to required CSV schema for instant test scheduling</span>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D8] dark:border-[#292524]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer ${
                  rosterMethod === 'form'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#C84B18] hover:bg-[#B33F12]'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>{rosterMethod === 'form' ? 'Creating Form & Directory...' : 'Creating Directory...'}</span>
                  </>
                ) : rosterMethod === 'form' ? (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Create & Get WhatsApp Link</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Create & Select Directory</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
