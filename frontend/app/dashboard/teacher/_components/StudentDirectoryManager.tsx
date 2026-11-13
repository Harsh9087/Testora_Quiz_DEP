'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  FolderPlus,
  UploadCloud,
  DownloadCloud,
  Search,
  Trash2,
  Plus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Hash,
  FileText,
  X,
  Share2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  fetchStudentDirectories,
  fetchDirectoryStudents,
  createStudentDirectory,
  deleteStudentDirectory,
  addStudentToDirectory,
  removeStudentFromDirectory,
  importStudentsCSV
} from '@/lib/api/studentDirectories';
import {
  StudentDirectory,
  DirectoryStudent,
  CSVImportResult
} from '@/types/studentDirectory';
import { API_V1, apiFetch, getFrontendBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import CreateDirectoryModal from './CreateDirectoryModal';

interface StudentDirectoryManagerProps {
  token?: string | null;
}

export default function StudentDirectoryManager({ token: propToken }: StudentDirectoryManagerProps = {}) {
  const storeToken = useAuthStore((state) => state.token);
  const token = propToken || storeToken || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');

  const [directories, setDirectories] = useState<StudentDirectory[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<StudentDirectory | null>(null);
  const [students, setStudents] = useState<DirectoryStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Add Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentDivision, setNewStudentDivision] = useState('');
  const [newStudentDepartment, setNewStudentDepartment] = useState('');
  const [studentActionLoading, setStudentActionLoading] = useState(false);
  const [studentActionError, setStudentActionError] = useState<string | null>(null);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportResult, setCsvImportResult] = useState<CSVImportResult | null>(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp Roster & Form Collection State
  const [createModalMethod, setCreateModalMethod] = useState<'csv' | 'form'>('csv');
  const [shareModalDir, setShareModalDir] = useState<StudentDirectory | null>(null);
  const [shareModalSlug, setShareModalSlug] = useState<string>('');
  const [shareModalLoading, setShareModalLoading] = useState(false);
  const [shareModalCopied, setShareModalCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Active Main Tab: Directories vs AI Forms
  const [activeMainTab, setActiveMainTab] = useState<'directories' | 'forms'>('directories');
  const [registrationForms, setRegistrationForms] = useState<any[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [csvValidationError, setCsvValidationError] = useState<string | null>(null);
  const [importingFormId, setImportingFormId] = useState<string | null>(null);
  const [formImportSuccess, setFormImportSuccess] = useState<string | null>(null);

  const loadDirectories = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStudentDirectories(activeToken);
      setDirectories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load student directories');
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrationForms = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;
    try {
      setFormsLoading(true);
      const [regRes, customRes] = await Promise.all([
        apiFetch('/registration-forms', { token: activeToken }).catch(() => null),
        apiFetch('/custom-forms', { token: activeToken }).catch(() => null),
      ]);
      const allForms: any[] = [];
      const frontendUrl = getFrontendBaseUrl();

      if (regRes && regRes.ok) {
        const regData = await regRes.json().catch(() => []);
        if (Array.isArray(regData)) {
          regData.forEach((f: any) => {
            allForms.push({
              ...f,
              form_origin: 'registration',
              origin_label: 'Registration Form',
              is_compatible_with_directory: true,
              compatibility_reason: 'Platform required schema (Roll, Name, Email, Phone, Section, Branch)',
              share_link: `${frontendUrl}/forms/${f.share_slug}`,
            });
          });
        }
      }

      if (customRes && customRes.ok) {
        const customData = await customRes.json().catch(() => []);
        if (Array.isArray(customData)) {
          customData.forEach((f: any) => {
            const fList = f.fields || [];
            const hasRoll = fList.some((field: any) => {
              const l = (field.label || '').toLowerCase();
              return l.includes('roll') || l.includes('id') || l.includes('reg') || l.includes('enroll') || l.includes('usn');
            });
            const hasName = fList.some((field: any) => {
              const l = (field.label || '').toLowerCase();
              return l.includes('name');
            });
            const hasEmail = fList.some((field: any) => {
              const l = (field.label || '').toLowerCase();
              const t = (field.field_type || '').toLowerCase();
              return t === 'email' || l.includes('email') || l.includes('mail');
            });
            const isCompatible = hasRoll && hasName && hasEmail;

            allForms.push({
              ...f,
              form_origin: 'custom',
              origin_label: 'AI Form Studio',
              is_compatible_with_directory: isCompatible,
              compatibility_reason: isCompatible
                ? 'Matches platform required student schema (Roll, Name, Email)'
                : 'Missing Roll Number, Name, or Email',
              share_link: `${frontendUrl}/custom-forms/${f.share_slug}`,
            });
          });
        }
      }

      allForms.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRegistrationForms(allForms);
    } catch (err) {
      console.error('Failed to load registration forms:', err);
    } finally {
      setFormsLoading(false);
    }
  };

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

  const handleDownloadFormCsv = (form: any) => {
    const downloadUrl = form.form_origin === 'custom'
      ? `${API_V1}/custom-forms/${form.id}/export-excel?token=${encodeURIComponent(token)}`
      : `${API_V1}/registration-forms/${form.id}/export-csv?token=${encodeURIComponent(token)}`;
    window.open(downloadUrl, '_blank');
  };

  const handleDownloadFormExcel = (form: any) => {
    const downloadUrl = form.form_origin === 'custom'
      ? `${API_V1}/custom-forms/${form.id}/export-excel?token=${encodeURIComponent(token)}`
      : `${API_V1}/registration-forms/${form.id}/export-excel?token=${encodeURIComponent(token)}`;
    window.open(downloadUrl, '_blank');
  };

  const handleImportFormAsDirectory = async (form: any) => {
    try {
      setImportingFormId(form.id);
      setFormImportSuccess(null);
      const endpoint = form.form_origin === 'custom'
        ? `/custom-forms/${form.id}/import-to-directory`
        : `/registration-forms/${form.id}/import-to-directory`;

      const res = await apiFetch(endpoint, {
        method: 'POST',
        token,
        body: JSON.stringify({
          target_mode: 'new',
          new_directory_name: form.title,
          new_directory_description: form.description || `Imported via AI Form: ${form.title}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFormImportSuccess(
          `✓ Created Directory "${form.title}" with ${data.imported_count} candidate(s) in required CSV format!`
        );
        loadDirectories(token);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("refresh-student-directories"));
        }
        setTimeout(() => {
          setActiveMainTab('directories');
          setFormImportSuccess(null);
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to import form as student directory');
      }
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setImportingFormId(null);
    }
  };

  const loadStudents = async (dirId: string, authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;
    try {
      setStudentsLoading(true);
      const data = await fetchDirectoryStudents(dirId, activeToken);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load students for this directory');
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDirectories(token);
      loadRegistrationForms(token);
    }
  }, [token]);

  const handleSelectDirectory = (dir: StudentDirectory) => {
    setSelectedDirectory(dir);
    loadStudents(dir.id);
  };

  const handleDeleteDirectory = async (dirId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this student directory?')) return;
    try {
      await deleteStudentDirectory(dirId, token);
      setDirectories((prev) => prev.filter((d) => d.id !== dirId));
      if (selectedDirectory?.id === dirId) {
        setSelectedDirectory(null);
        setStudents([]);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-student-directories'));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete directory');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirectory) return;
    setStudentActionLoading(true);
    setStudentActionError(null);

    try {
      const created = await addStudentToDirectory(
        selectedDirectory.id,
        {
          name: newStudentName.trim(),
          email: newStudentEmail.trim().toLowerCase(),
          roll_number: newStudentRoll.trim() || undefined,
          phone: newStudentPhone.trim() || undefined,
          division: newStudentDivision.trim() || undefined,
          department: newStudentDepartment.trim() || undefined
        },
        token
      );
      setStudents((prev) => [created, ...prev]);
      // Increment directory student count
      setSelectedDirectory((prev) =>
        prev ? { ...prev, student_count: prev.student_count + 1 } : null
      );
      setDirectories((prev) =>
        prev.map((d) =>
          d.id === selectedDirectory.id ? { ...d, student_count: d.student_count + 1 } : d
        )
      );
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentRoll('');
      setNewStudentPhone('');
      setNewStudentDivision('');
      setNewStudentDepartment('');
      setIsAddStudentModalOpen(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-student-directories'));
      }
    } catch (err: any) {
      setStudentActionError(err.message || 'Failed to add student');
    } finally {
      setStudentActionLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedDirectory) return;
    if (!window.confirm('Remove this student from the directory?')) return;

    try {
      await removeStudentFromDirectory(selectedDirectory.id, studentId, token);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setSelectedDirectory((prev) =>
        prev ? { ...prev, student_count: Math.max(0, prev.student_count - 1) } : null
      );
      setDirectories((prev) =>
        prev.map((d) =>
          d.id === selectedDirectory.id
            ? { ...d, student_count: Math.max(0, d.student_count - 1) }
            : d
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  const handleImportCsv = async () => {
    if (!selectedDirectory || !csvFile) return;
    setCsvImportLoading(true);
    setCsvImportResult(null);

    try {
      const result = await importStudentsCSV(selectedDirectory.id, csvFile, token);
      setCsvImportResult(result);
      // Reload students
      await loadStudents(selectedDirectory.id);
      // Update counts
      setSelectedDirectory((prev) =>
        prev ? { ...prev, student_count: prev.student_count + result.imported_count } : null
      );
      setDirectories((prev) =>
        prev.map((d) =>
          d.id === selectedDirectory.id
            ? { ...d, student_count: d.student_count + result.imported_count }
            : d
        )
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-student-directories'));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload student roster');
    } finally {
      setCsvImportLoading(false);
    }
  };

    const handleExportCsv = () => {
    if (!selectedDirectory) return;
    const downloadUrl = `${API_V1}/student-directories/${selectedDirectory.id}/export-csv?token=${encodeURIComponent(
      token
    )}`;
    window.open(downloadUrl, '_blank');
  };

  const handleExportExcel = () => {
    if (!selectedDirectory) return;
    const downloadUrl = `${API_V1}/student-directories/${selectedDirectory.id}/export-excel?token=${encodeURIComponent(
      token
    )}`;
    window.open(downloadUrl, '_blank');
  };

  // Open WhatsApp Share & Form Modal for a Directory
  const handleOpenWhatsAppShare = async (dir: StudentDirectory, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShareModalDir(dir);
    setShareModalSlug('');
    setSyncResult(null);
    setShareModalLoading(true);

    try {
      // 1. Check if a registration form already exists for this directory
      const res = await apiFetch('/registration-forms', { token });
      if (res.ok) {
        const forms = await res.json();
        const matched = forms.find(
          (f: any) => f.title.toLowerCase().trim() === dir.name.toLowerCase().trim()
        );
        if (matched) {
          setShareModalSlug(matched.share_slug);
          setShareModalLoading(false);
          return;
        }
      }

      // 2. If no matching form, auto-create one for this directory
      const createRes = await apiFetch('/registration-forms', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: dir.name,
          description: dir.description || undefined
        })
      });
      if (createRes.ok) {
        const newForm = await createRes.json();
        setShareModalSlug(newForm.share_slug);
      }
    } catch (err) {
      console.error('Failed to configure WhatsApp form for directory:', err);
    } finally {
      setShareModalLoading(false);
    }
  };

  // Sync Form Submissions directly into Directory
  const handleSyncSubmissions = async () => {
    if (!shareModalDir || !shareModalSlug) return;
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await apiFetch('/registration-forms', { token });
      if (res.ok) {
        const forms = await res.json();
        const matched = forms.find((f: any) => f.share_slug === shareModalSlug);
        if (matched) {
          const importRes = await apiFetch(`/registration-forms/${matched.id}/import-to-directory`, {
            method: 'POST',
            token,
            body: JSON.stringify({
              target_mode: 'existing',
              directory_id: shareModalDir.id
            })
          });

          if (importRes.ok) {
            const data = await importRes.json();
            setSyncResult(
              `Synced ${data.imported_count} new student(s) into directory! (Duplicates skipped: ${data.skipped_duplicate_count})`
            );
            if (selectedDirectory?.id === shareModalDir.id) {
              loadStudents(shareModalDir.id);
            }
            loadDirectories(token);
          } else {
            const err = await importRes.json().catch(() => ({}));
            setSyncResult(err.detail || 'Failed to sync submissions');
          }
        }
      }
    } catch (err: any) {
      setSyncResult(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!shareModalDir || !shareModalSlug) return;
    const formUrl = `${getFrontendBaseUrl()}/forms/${shareModalSlug}`;
    const msg = `Dear Students, please register your details for "${shareModalDir.name}":\n\n📝 Registration Form: ${formUrl}\n\nPlease submit your Full Name, Roll Number, Email, and Section so your details are saved for upcoming tests.`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyShareLink = () => {
    if (!shareModalSlug) return;
    const formUrl = `${getFrontendBaseUrl()}/forms/${shareModalSlug}`;
    navigator.clipboard.writeText(formUrl);
    setShareModalCopied(true);
    setTimeout(() => setShareModalCopied(false), 2200);
  };

  const filteredDirectories = directories.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.division && s.division.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] dark:bg-[#171615] p-4 sm:p-6 rounded-2xl border border-[#E5E0D8] dark:border-[#292524] shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border border-[#C84B18]/20">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#242321] dark:text-[#F5F5F4] tracking-tight">Student Directories</h2>
          </div>
          <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">
            Create independent student directories for courses, batches, and candidate cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => {
              setCreateModalMethod('form');
              setIsCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap text-center"
            title="Create directory & collect students via WhatsApp Form"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Collect via WhatsApp</span>
          </button>
          <button
            onClick={() => {
              setCreateModalMethod('csv');
              setIsCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#C84B18] hover:bg-[#B33F12] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap text-center"
          >
            <FolderPlus className="w-4 h-4 shrink-0" />
            <span>New Student Directory</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Mode Switcher: Directories vs AI Forms (visible when no directory is open) */}
      {!selectedDirectory && (
        <div className="flex items-center gap-1.5 p-1 bg-[#F5F2EB] dark:bg-[#1E1C1A] rounded-2xl border border-[#E5E0D8] dark:border-[#292524] w-full sm:w-fit overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveMainTab('directories')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeMainTab === 'directories'
                ? 'bg-[#FFFFFF] dark:bg-[#292524] text-[#C84B18] dark:text-[#EA580C] shadow-sm'
                : 'text-[#716D67] hover:text-[#242321] dark:hover:text-[#F5F5F4]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Student Directories ({directories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('forms')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeMainTab === 'forms'
                ? 'bg-[#FFFFFF] dark:bg-[#292524] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-[#716D67] hover:text-[#242321] dark:hover:text-[#F5F5F4]'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>AI Registration Forms ({registrationForms.length})</span>
          </button>
        </div>
      )}

      {formImportSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{formImportSuccess}</span>
        </div>
      )}

      {/* Main View: Directory Roster Detail OR AI Forms Tab OR Directories Grid */}
      {selectedDirectory ? (
        /* DETAIL ROSTER VIEW */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Breadcrumb / Back Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-[#FFFFFF] dark:bg-[#171615] rounded-2xl border border-[#E5E0D8] dark:border-[#292524] shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedDirectory(null);
                  setSearchQuery('');
                }}
                className="p-2 rounded-xl bg-[#F0ECE4] dark:bg-[#292524] text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-[#242321] dark:text-[#F5F5F4]">{selectedDirectory.name}</h3>
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border border-[#C84B18]/20 rounded-full">
                    {students.length} Students
                  </span>
                </div>
                {selectedDirectory.description && (
                  <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-0.5">{selectedDirectory.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                onClick={() => handleOpenWhatsAppShare(selectedDirectory)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366]/10 text-emerald-700 dark:text-emerald-400 hover:bg-[#25D366]/20 text-xs font-semibold rounded-xl border border-emerald-500/30 transition-colors cursor-pointer shadow-2xs"
                title="Share WhatsApp Registration Form & Sync Responses to CSV"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp Form</span>
              </button>

              <button
                onClick={() => {
                  setCsvFile(null);
                  setCsvImportResult(null);
                  setIsCsvModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F0ECE4] dark:bg-[#292524] text-[#242321] dark:text-[#F5F5F4] hover:bg-[#E5E0D8] dark:hover:bg-[#3E3A36] text-xs font-medium rounded-xl border border-[#E5E0D8] dark:border-[#3E3A36] transition-colors cursor-pointer shadow-2xs"
                title="Upload student roster from Excel (.xlsx, .xls) or CSV (.csv, .tsv)"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#C84B18]" />
                <span>Upload Excel</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F0ECE4] dark:bg-[#292524] text-[#242321] dark:text-[#F5F5F4] hover:bg-[#E5E0D8] dark:hover:bg-[#3E3A36] text-xs font-medium rounded-xl border border-[#E5E0D8] dark:border-[#3E3A36] transition-colors cursor-pointer shadow-2xs"
                title="Export roster as Microsoft Excel (.xlsx)"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F0ECE4] dark:bg-[#292524] text-[#242321] dark:text-[#F5F5F4] hover:bg-[#E5E0D8] dark:hover:bg-[#3E3A36] text-xs font-medium rounded-xl border border-[#E5E0D8] dark:border-[#3E3A36] transition-colors cursor-pointer shadow-2xs"
                title="Export roster as CSV (.csv)"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => setIsAddStudentModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C84B18] hover:bg-[#B33F12] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Search bar inside directory */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#716D67] dark:text-[#A8A29E] w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name, email, or roll number..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#FFFFFF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18] transition-all"
            />
          </div>

          {/* Students Table */}
          <div className="bg-[#FFFFFF] dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl overflow-hidden shadow-sm">
            {studentsLoading ? (
              <div className="py-16 text-center text-[#716D67] dark:text-[#A8A29E] flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#C84B18] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading candidate roster...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F0ECE4] dark:bg-[#292524] text-[#716D67] dark:text-[#A8A29E] flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#242321] dark:text-[#F5F5F4]">No students in this directory yet</p>
                <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-1 max-w-sm mx-auto">
                  Add students manually or upload an Excel class roster file to target them in assessments.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsCsvModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold bg-[#C84B18] hover:bg-[#B33F12] text-white rounded-xl cursor-pointer shadow-sm"
                  >
                    Upload Excel
                  </button>
                  <button
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="px-4 py-2 text-xs font-medium bg-[#F0ECE4] dark:bg-[#292524] text-[#242321] dark:text-[#F5F5F4] hover:bg-[#E5E0D8] dark:hover:bg-[#3E3A36] rounded-xl cursor-pointer"
                  >
                    Add Single Student
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Stacked Card View (< 768px): All student info at a single glance without horizontal scrolling */}
                <div className="block md:hidden divide-y divide-[#E5E0D8] dark:divide-[#292524]">
                  {filteredStudents.map((s) => (
                    <div key={s.id} className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border border-[#C84B18]/20 flex items-center justify-center text-xs font-bold shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#242321] dark:text-[#F5F5F4] truncate">
                              {s.name}
                            </div>
                            <div className="text-[10px] text-[#716D67] dark:text-[#A8A29E] truncate">
                              {s.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(s.id)}
                            className="p-1.5 text-[#716D67] hover:text-red-500 rounded-lg hover:bg-[#F0ECE4] dark:hover:bg-[#292524] transition-colors cursor-pointer"
                            title="Remove student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-[#F7F4EF]/70 dark:bg-[#141312] p-2 rounded-lg border border-[#E5E0D8]/60 dark:border-[#292524] text-[11px]">
                        <div>
                          <span className="text-[10px] text-[#716D67] block">Roll / ID</span>
                          <span className="font-mono text-[#242321] dark:text-[#F5F5F4] font-medium break-all">
                            {s.roll_number || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#716D67] block">Phone</span>
                          <span className="text-[#242321] dark:text-[#F5F5F4] break-all">
                            {s.phone || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#716D67] block">Division</span>
                          <span className="text-[#242321] dark:text-[#F5F5F4] font-medium break-all">
                            {s.division || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#716D67] block">Department</span>
                          <span className="text-[#242321] dark:text-[#F5F5F4] truncate block" title={s.department || ''}>
                            {s.department || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (>= 768px) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#242321] dark:text-[#F5F5F4]">
                    <thead className="bg-[#F7F4EF] dark:bg-[#1C1A17] text-[#716D67] dark:text-[#A8A29E] uppercase tracking-wider font-semibold border-b border-[#E5E0D8] dark:border-[#292524] text-[10px]">
                      <tr>
                        <th className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">Student Name</th>
                        <th className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">Email Address</th>
                        <th className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">Roll / ID</th>
                        <th className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">Division</th>
                        <th className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">Department</th>
                        <th className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">Phone Number</th>
                        <th className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">Status</th>
                        <th className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#292524]">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A17] transition-colors">
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap font-medium text-[#242321] dark:text-[#F5F5F4] flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border border-[#C84B18]/20 flex items-center justify-center text-xs font-bold shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">{s.name}</span>
                          </td>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap text-[#716D67] dark:text-[#A8A29E]">{s.email}</td>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap text-[#716D67] dark:text-[#A8A29E]">{s.roll_number || '—'}</td>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">
                            {s.division ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border border-[#C84B18]/20">
                                {s.division}
                              </span>
                            ) : (
                              <span className="text-[#716D67] dark:text-[#A8A29E]">—</span>
                            )}
                          </td>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap text-[#716D67] dark:text-[#A8A29E] max-w-[150px] truncate" title={s.department || ''}>
                            {s.department || '—'}
                          </td>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap text-[#716D67] dark:text-[#A8A29E]">{s.phone || '—'}</td>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </td>
                          <td className="px-3.5 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleRemoveStudent(s.id)}
                              className="p-1.5 text-[#716D67] dark:text-[#A8A29E] hover:text-red-500 rounded-lg hover:bg-[#F0ECE4] dark:hover:bg-[#292524] transition-colors cursor-pointer"
                              title="Remove student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      ) : activeMainTab === 'forms' ? (
        /* AI REGISTRATION FORMS VIEW */
        <div className="space-y-6">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>AI Registration Forms — 100% Platform Required CSV Guaranteed</span>
              </div>
              <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] max-w-2xl leading-relaxed">
                Forms created with AI collect student responses matching the exact required platform schema (Roll Number, Name, Email, Phone, Division, Department). You can share via WhatsApp, copy link, download the verified CSV, or import directly into a Student Directory!
              </p>
            </div>
            <button
              onClick={() => {
                setCreateModalMethod('form');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Share2 className="w-4 h-4" />
              <span>Create New AI Form</span>
            </button>
          </div>

          {formsLoading ? (
            <div className="py-20 text-center text-[#716D67] dark:text-[#A8A29E] flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading AI registration forms...</p>
            </div>
          ) : registrationForms.length === 0 ? (
            <div className="py-20 text-center bg-[#FFFFFF] dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">No AI Registration Forms Created Yet</h3>
              <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-1 max-w-md mx-auto">
                Generate online registration links to spread via WhatsApp so candidates can submit their details in the required CSV schema.
              </p>
              <button
                onClick={() => {
                  setCreateModalMethod('form');
                  setIsCreateModalOpen(true);
                }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Create AI Form & Get WhatsApp Link</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {registrationForms.map((f: any) => (
                <div
                  key={f.id}
                  className="bg-[#FFFFFF] dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] hover:border-emerald-500/50 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-full">
                        {f.submission_count} Submissions
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          f.form_origin === 'custom'
                            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {f.origin_label || 'AI Form'}
                        </span>
                        {f.is_compatible_with_directory ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-md flex items-center gap-1">
                            ✓ Platform CSV Schema
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-md" title={f.compatibility_reason}>
                            Survey (Lacks Roll/Email)
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">{f.title}</h4>
                      <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-1 line-clamp-2">
                        {f.description || (f.form_origin === 'custom' ? 'Created via AI Form Studio' : 'Public student registration link')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[10px]">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-md font-mono">
                        ✓ Roll Number
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-md font-mono">
                        ✓ Name
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-md font-mono">
                        ✓ Email
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E5E0D8] dark:border-[#292524] space-y-2.5">
                    {/* Primary WhatsApp Action */}
                    <button
                      type="button"
                      onClick={() => {
                        const formUrl = f.share_link || `${getFrontendBaseUrl()}/${f.form_origin === 'custom' ? 'custom-forms' : 'forms'}/${f.share_slug}`;
                        const msg = `Dear Students, please register your details for "${f.title}":\n\n📝 Registration Form: ${formUrl}\n\nPlease submit your Full Name, Roll Number, and Section so your details are synced for upcoming tests.`;
                        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                        window.open(waUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share on WhatsApp</span>
                    </button>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const formUrl = f.share_link || `${getFrontendBaseUrl()}/${f.form_origin === 'custom' ? 'custom-forms' : 'forms'}/${f.share_slug}`;
                          navigator.clipboard.writeText(formUrl);
                          alert('Form link copied to clipboard!');
                        }}
                        className="py-1.5 px-2 bg-[#F0ECE4] dark:bg-[#292524] text-[#242321] dark:text-[#F5F5F4] hover:bg-[#E5E0D8] dark:hover:bg-[#3E3A36] text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Copy Form URL"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadFormCsv(f)}
                        className="py-1.5 px-2 bg-[#F0ECE4] dark:bg-[#292524] text-[#242321] dark:text-[#F5F5F4] hover:bg-[#E5E0D8] dark:hover:bg-[#3E3A36] text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Download Responses as Platform Required CSV/Excel"
                      >
                        <DownloadCloud className="w-3 h-3 text-[#C84B18]" />
                        <span>CSV</span>
                      </button>

                      <button
                        type="button"
                        disabled={importingFormId === f.id || !f.is_compatible_with_directory}
                        onClick={() => handleImportFormAsDirectory(f)}
                        className="py-1.5 px-2 bg-[#C84B18] hover:bg-[#B33F12] disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title={f.is_compatible_with_directory ? "Convert Submissions into a Student Directory" : "Cannot import: Form is missing Roll Number or Email required by platform"}
                      >
                        <FolderPlus className="w-3 h-3" />
                        <span>{importingFormId === f.id ? 'Importing...' : 'To Directory'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* DIRECTORIES GRID VIEW */
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#716D67] dark:text-[#A8A29E] w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search directories by name or description..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#FFFFFF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18] transition-all"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center text-[#716D67] dark:text-[#A8A29E] flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#C84B18] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading student directories...</p>
            </div>
          ) : filteredDirectories.length === 0 ? (
            <div className="py-20 text-center bg-[#FFFFFF] dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border border-[#C84B18]/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">No Student Directories Found</h3>
              <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-1 max-w-md mx-auto">
                Directories organize your students into distinct classes or cohorts so you can target them seamlessly when publishing exams.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
                <button
                  onClick={() => {
                    setCreateModalMethod('form');
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Collect via WhatsApp Form</span>
                </button>
                <button
                  onClick={() => {
                    setCreateModalMethod('csv');
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F0ECE4] dark:bg-[#292524] text-[#242321] dark:text-[#F5F5F4] hover:bg-[#E5E0D8] dark:hover:bg-[#3E3A36] text-xs font-semibold rounded-xl border border-[#E5E0D8] dark:border-[#3E3A36] transition-all cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-[#C84B18]" />
                  <span>Create with Excel / CSV</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDirectories.map((dir) => (
                <div
                  key={dir.id}
                  onClick={() => handleSelectDirectory(dir)}
                  className="group relative bg-[#FFFFFF] dark:bg-[#171615] hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524] hover:border-[#C84B18]/50 dark:hover:border-[#EA580C]/50 rounded-2xl p-5 transition-all shadow-sm cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border border-[#C84B18]/20 group-hover:bg-[#C84B18]/20 transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border border-[#C84B18]/20 rounded-full">
                        {dir.student_count} Candidates
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4] group-hover:text-[#C84B18] transition-colors">
                      {dir.name}
                    </h4>
                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-1 line-clamp-2">
                      {dir.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E5E0D8] dark:border-[#292524] flex items-center justify-between text-xs text-[#716D67] dark:text-[#A8A29E]">
                    <span className="text-[11px]">
                      Created {new Date(dir.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenWhatsAppShare(dir, e)}
                        className="px-2 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                        title="Share WhatsApp Registration Form"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteDirectory(dir.id, e)}
                        className="p-1.5 text-[#716D67] dark:text-[#A8A29E] hover:text-red-500 rounded-lg hover:bg-[#F0ECE4] dark:hover:bg-[#292524] transition-colors cursor-pointer"
                        title="Delete Directory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE DIRECTORY MODAL */}
      <CreateDirectoryModal
        isOpen={isCreateModalOpen}
        defaultMethod={createModalMethod}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newDir) => {
          setDirectories((prev) => [newDir, ...prev]);
          handleSelectDirectory(newDir);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('refresh-student-directories'));
          }
        }}
      />

      {/* WHATSAPP FORM SHARE & SYNC MODAL FOR EXISTING DIRECTORY */}
      {shareModalDir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShareModalDir(null)}
        >
          <div
            className="w-full max-w-md mx-3 sm:mx-auto bg-[#FFFFFF] dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#141312] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4] truncate max-w-[240px]">
                    {shareModalDir.name}
                  </h3>
                  <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                    WhatsApp Roster Collection & Sync
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareModalDir(null)}
                className="p-1.5 text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {shareModalLoading ? (
                <div className="py-10 text-center flex flex-col items-center gap-2 text-xs text-[#716D67]">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Configuring registration link...</span>
                </div>
              ) : (
                <>
                  {/* WhatsApp Action Button */}
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/10 transition-all cursor-pointer text-xs sm:text-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.33C9.33 7.33 9 7.41 8.76 7.67C8.5 7.94 7.82 8.58 7.82 9.87C7.82 11.16 8.76 12.41 8.9 12.59C9.03 12.77 10.73 15.4 13.36 16.54C15.54 17.48 16 17.29 16.46 17.25C16.93 17.21 17.97 16.63 18.19 16.03C18.41 15.42 18.41 14.9 18.34 14.79C18.28 14.68 18.1 14.62 17.84 14.49C17.58 14.36 16.3 13.73 16.06 13.65C15.83 13.56 15.66 13.52 15.5 13.78C15.33 14.04 14.85 14.62 14.71 14.79C14.56 14.96 14.42 14.98 14.16 14.85C13.9 14.72 13.06 14.45 12.06 13.56C11.28 12.87 10.76 12.01 10.61 11.75C10.46 11.49 10.6 11.35 10.73 11.22C10.84 11.11 10.98 10.92 11.12 10.76C11.25 10.6 11.3 10.48 11.39 10.31C11.47 10.13 11.43 9.98 11.37 9.85C11.3 9.72 10.83 8.56 10.63 8.08C10.44 7.62 10.24 7.68 10.09 7.67C9.95 7.67 9.78 7.33 9.53 7.33Z"/>
                    </svg>
                    <span>Share on WhatsApp</span>
                  </button>

                  {/* Copy Link Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#57534E] dark:text-[#A8A29E]">
                      Student Registration Form Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareModalSlug ? `${getFrontendBaseUrl()}/forms/${shareModalSlug}` : ''}
                        className="flex-1 px-3 py-2 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] select-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyShareLink}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#1E1C1A] text-[#242321] dark:text-[#F5F5F4] hover:bg-[#F5F2EB] dark:hover:bg-[#292524] flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        {shareModalCopied ? (
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

                  {/* Sync Form Submissions directly into directory */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h5 className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#C84B18]" />
                          <span>Sync WhatsApp Submissions</span>
                        </h5>
                        <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E] mt-0.5">
                          Import new responses from the online form directly into this directory
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={handleSyncSubmissions}
                        className="px-3.5 py-2 text-xs font-semibold bg-[#C84B18] hover:bg-[#B33F12] text-white rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Responses'}</span>
                      </button>
                    </div>

                    {syncResult && (
                      <div className="p-2.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                        {syncResult}
                      </div>
                    )}
                  </div>

                  {/* Pre-formatted Schema Guidance */}
                  <div className="text-[11px] text-[#716D67] dark:text-[#A8A29E] bg-[#F7F4EF]/60 dark:bg-[#141312] p-2.5 rounded-xl border border-[#E5E0D8]/60 dark:border-[#292524]">
                    Students submit Name, Roll Number, Email, and Section. Responses automatically match the CSV format required to publish assessments.
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#E5E0D8] dark:border-[#292524] flex justify-end">
              <button
                type="button"
                onClick={() => setShareModalDir(null)}
                className="px-4 py-2 text-xs font-medium text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {isAddStudentModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsAddStudentModalOpen(false)}
        >
          <div 
            className="w-full max-w-md mx-3 sm:mx-auto bg-[#FFFFFF] dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#141312] shrink-0">
              <h3 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">Add Student to Directory</h3>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="p-1.5 text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              {studentActionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{studentActionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E] mb-1.5">
                  Full Name <span className="text-[#C84B18]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3.5 py-2 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E] mb-1.5">
                  Email Address <span className="text-[#C84B18]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="e.g. maya.lin@university.edu"
                  className="w-full px-3.5 py-2 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E] mb-1.5">
                    Roll / ID
                  </label>
                  <input
                    type="text"
                    value={newStudentRoll}
                    onChange={(e) => setNewStudentRoll(e.target.value)}
                    placeholder="e.g. CS-2026-08"
                    className="w-full px-3.5 py-2 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full px-3.5 py-2 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E] mb-1.5">
                    Division / Section <span className="text-[#716D67] dark:text-[#A8A29E] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newStudentDivision}
                    onChange={(e) => setNewStudentDivision(e.target.value)}
                    placeholder="e.g. Section A"
                    className="w-full px-3.5 py-2 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#A8A29E] mb-1.5">
                    Department <span className="text-[#716D67] dark:text-[#A8A29E] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newStudentDepartment}
                    onChange={(e) => setNewStudentDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3.5 py-2 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] placeholder-[#716D67] dark:placeholder-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D8] dark:border-[#292524]">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={studentActionLoading}
                  className="px-4 py-2 text-xs font-semibold bg-[#C84B18] hover:bg-[#B33F12] text-white rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {studentActionLoading ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV & EXCEL IMPORT MODAL */}
      {isCsvModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsCsvModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg mx-3 sm:mx-auto bg-[#FFFFFF] dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#141312] shrink-0">
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-5 h-5 text-[#C84B18]" />
                <div>
                  <h3 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">Upload Student Roster (Excel / CSV)</h3>
                  <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">Universal spreadsheet support with auto header mapping</p>
                </div>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Platform Required CSV Schema Specification (Strict Rule) */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Platform Required CSV Schema (Mandatory Rule)</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded">
                    Strict Verification
                  </span>
                </div>
                <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                  Only CSV files following TestoraQuiz&apos;s required schema are accepted for student directories. Files must include:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-0.5">
                  <div className="px-2 py-1 bg-white dark:bg-[#1E1C1A] border border-emerald-500/30 rounded text-[11px] flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">Roll Number</span>
                    <span className="text-red-500 font-bold">*</span>
                  </div>
                  <div className="px-2 py-1 bg-white dark:bg-[#1E1C1A] border border-emerald-500/30 rounded text-[11px] flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">Name</span>
                    <span className="text-red-500 font-bold">*</span>
                  </div>
                  <div className="px-2 py-1 bg-white dark:bg-[#1E1C1A] border border-emerald-500/30 rounded text-[11px] flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">Email</span>
                    <span className="text-red-500 font-bold">*</span>
                  </div>
                  <div className="px-2 py-1 bg-white dark:bg-[#1E1C1A] border border-emerald-500/30 rounded text-[11px]">
                    <span className="font-mono text-[#57534E] dark:text-[#A8A29E]">Phone</span>
                  </div>
                  <div className="px-2 py-1 bg-white dark:bg-[#1E1C1A] border border-emerald-500/30 rounded text-[11px]">
                    <span className="font-mono text-[#57534E] dark:text-[#A8A29E]">Division</span>
                  </div>
                  <div className="px-2 py-1 bg-white dark:bg-[#1E1C1A] border border-emerald-500/30 rounded text-[11px]">
                    <span className="font-mono text-[#57534E] dark:text-[#A8A29E]">Department</span>
                  </div>
                </div>
              </div>

              {/* Downloadable Reference File Box */}
              <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#C84B18]" />
                    <span>Download Reference Template</span>
                  </span>
                  <span className="text-[10px] text-[#716D67] uppercase font-semibold">Sample Files</span>
                </div>
                <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                  Use our sample template pre-configured with the required columns (Full Name, Email, Roll/Student ID, Phone, Division, Department).
                </p>
                <div className="flex flex-col xs:flex-row items-center gap-2 pt-1">
                  <a
                    href={`${API_V1}/student-directories/template/excel`}
                    download="student_roster_template.xlsx"
                    className="w-full xs:flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel Template (.xlsx)</span>
                  </a>
                  <a
                    href={`${API_V1}/student-directories/template/csv`}
                    download="student_roster_template.csv"
                    className="w-full xs:flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#C84B18]/10 hover:bg-[#C84B18]/20 text-[#C84B18] dark:text-[#EA580C] border border-[#C84B18]/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>CSV Template (.csv)</span>
                  </a>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".csv, .xlsx, .xls, .tsv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setCsvFile(file);
                    setCsvImportResult(null);
                    validateCsvFileHeaders(file);
                  }
                }}
                className="hidden"
              />

              {!csvFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E5E0D8] dark:border-[#292524] hover:border-[#C84B18]/50 bg-[#F7F4EF] dark:bg-[#141312] hover:bg-[#F0ECE4] dark:hover:bg-[#1C1A17] rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <UploadCloud className="w-8 h-8 text-[#C84B18]" />
                  <p className="text-xs text-[#242321] dark:text-[#F5F5F4] font-medium">Click to select an Excel (.xlsx, .xls) or CSV roster file</p>
                  <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                    Supports .xlsx, .xls, .csv, and .tsv with automatic comma, semicolon, and tab detection
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] bg-[#E5E0D8]/60 dark:bg-[#292524] text-[#716D67] dark:text-[#A8A29E] font-medium">
                    Headers: Roll Number, Full Name, Email, Phone, Division, Department
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3.5 bg-[#C84B18]/10 border border-[#C84B18]/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#C84B18]" />
                      <div>
                        <p className="text-xs font-medium text-[#242321] dark:text-[#F5F5F4]">{csvFile.name}</p>
                        <p className="text-[10px] text-[#716D67] dark:text-[#A8A29E]">{(csvFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCsvFile(null);
                        setCsvImportResult(null);
                        setCsvValidationError(null);
                      }}
                      className="p-1 text-[#716D67] hover:text-red-500 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Schema Validation Status */}
                  {csvValidationError ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{csvValidationError}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>✓ Platform CSV Verified: Required columns detected!</span>
                    </div>
                  )}
                </div>
              )}

              {csvImportResult && (
                <div className="space-y-2 p-4 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs">
                  <div className="flex items-center justify-between font-semibold text-[#242321] dark:text-[#F5F5F4]">
                    <span>Import Summary</span>
                    <span className="text-emerald-600 dark:text-emerald-400">+{csvImportResult.imported_count} Added</span>
                  </div>
                  <p className="text-[#716D67] dark:text-[#A8A29E] text-[11px]">
                    Processed {csvImportResult.total_rows} rows. Skipped {csvImportResult.skipped_count} invalid or duplicates.
                  </p>
                  {csvImportResult.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto space-y-1 pr-1">
                      {csvImportResult.errors.map((err, i) => (
                        <div key={i} className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-1.5 rounded">
                          Row {err.row}: {err.reason} ({err.email || 'no email'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D8] dark:border-[#292524]">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!csvFile || csvImportLoading || !!csvValidationError}
                  onClick={handleImportCsv}
                  className="px-4 py-2 text-xs font-semibold bg-[#C84B18] hover:bg-[#B33F12] disabled:opacity-50 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {csvImportLoading ? 'Uploading Roster...' : 'Upload Verified Roster'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
