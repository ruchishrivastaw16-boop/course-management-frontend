import { useState } from 'react';
import {
  LayoutDashboard, GraduationCap, FileText, BarChart3,
  Clock, CheckCircle, Upload, AlertCircle, Eye, Calendar,
  X, Send, Link as LinkIcon, FileUp,
  User as UserIcon,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: GraduationCap },
  { to: '/student/assignments', label: 'Assignments', icon: FileText },
  { to: '/student/grades', label: 'Grades', icon: BarChart3 },
  { to: '/student/profile', label: 'Profile', icon: UserIcon },   // ← NAYA
]
interface Assignment {
  id: number;
  course_id: number;
  course_title?: string;
  title: string;
  description?: string;
  max_score: number;
  due_date?: string;
  attachment_url?: string;
  created_at: string;
  submission_id?: number;
  submission_status?: string;
  grade?: number;
  feedback?: string;
  submitted_at?: string;
  file_url?: string;
  text_answer?: string;
}

type Filter = 'all' | 'pending' | 'submitted' | 'graded';

const assignmentService = {
  getMyAssignments: async (): Promise<Assignment[]> => {
    const { data } = await api.get('/assignments/my');
    return data;
  },
  submit: async (payload: {
    assignment_id: number;
    file_url?: string;
    text_answer?: string;
  }): Promise<any> => {
    const { data } = await api.post('/submissions/', payload);
    return data;
  },
};

export default function Assignments() {
  const [filter, setFilter] = useState<Filter>('all');
  const [submitModal, setSubmitModal] = useState<Assignment | null>(null);
  const [viewModal, setViewModal] = useState<Assignment | null>(null);
  const qc = useQueryClient();

  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: assignmentService.getMyAssignments,
  });

  const submitMutation = useMutation({
    mutationFn: assignmentService.submit,
    onSuccess: () => {
      toast.success('Assignment submitted successfully! 🎉');
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
      qc.invalidateQueries({ queryKey: ['my-submissions'] });
      setSubmitModal(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Submission failed');
    },
  });

  const withStatus = (assignments || []).map((a) => ({
    ...a,
    status: a.submission_status
      ? a.submission_status === 'graded'
        ? 'graded'
        : 'submitted'
      : 'pending',
  }));

  const filtered = withStatus.filter(
    (a) => filter === 'all' || a.status === filter
  );

  const counts = {
    all: withStatus.length,
    pending: withStatus.filter((a) => a.status === 'pending').length,
    submitted: withStatus.filter((a) => a.status === 'submitted').length,
    graded: withStatus.filter((a) => a.status === 'graded').length,
  };

  return (
    <DashboardLayout links={links} title="My Assignments">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'submitted', 'graded'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span
              className={`ml-2 text-xs ${
                filter === f ? 'opacity-90' : 'opacity-60'
              }`}
            >
              ({counts[f]})
            </span>
          </button>
        ))}
      </div>

      {isLoading && <Spinner />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
          <p className="font-medium mb-1">Failed to load assignments</p>
          <p className="text-sm">
            {(error as any)?.response?.data?.detail ||
              (error as any)?.message}
          </p>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-3" size={56} />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
          </h3>
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'Assignments from your enrolled courses will appear here.'
              : 'Try selecting a different filter.'}
          </p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((a) => {
            const dueDate = a.due_date ? new Date(a.due_date) : null;
            const isOverdue = dueDate && dueDate < new Date() && a.status === 'pending';
            const daysLeft = dueDate
              ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={a.id}
                className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 text-lg">{a.title}</h3>
                      <StatusBadge status={a.status} />
                      {isOverdue && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full inline-flex items-center gap-1">
                          <AlertCircle size={11} /> Overdue
                        </span>
                      )}
                    </div>

                    {a.course_title && (
                      <p className="text-xs text-indigo-600 font-medium mb-1">
                        {a.course_title}
                      </p>
                    )}

                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {a.description || 'No description'}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      {dueDate && (
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue ? 'text-red-600 font-medium' : ''
                          }`}
                        >
                          <Calendar size={12} />
                          Due: {dueDate.toLocaleDateString()}
                          {!isOverdue && daysLeft !== null && daysLeft >= 0 && (
                            <span className="text-gray-400">({daysLeft} days left)</span>
                          )}
                        </span>
                      )}
                      <span>🎯 Max Score: {a.max_score}</span>
                      {a.grade !== undefined && a.grade !== null && (
                        <span className="text-green-600 font-medium">
                          ✅ Grade: {a.grade}/{a.max_score}
                        </span>
                      )}
                    </div>

                    {a.feedback && (
                      <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-xs text-gray-700 border-l-2 border-indigo-500">
                        <p className="font-medium text-indigo-800 mb-1">
                          Instructor Feedback:
                        </p>
                        <p>{a.feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col gap-2 md:min-w-[160px]">
                    {a.status === 'pending' && (
                      <Button size="sm" onClick={() => setSubmitModal(a)}>
                        <Upload size={14} /> Submit Assignment
                      </Button>
                    )}
                    {a.status === 'submitted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewModal(a)}
                      >
                        <Eye size={14} /> View Submission
                      </Button>
                    )}
                    {a.status === 'graded' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewModal(a)}
                      >
                        <Eye size={14} /> View Feedback
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {submitModal && (
        <SubmitModal
          assignment={submitModal}
          onClose={() => setSubmitModal(null)}
          onSubmit={(payload) =>
            submitMutation.mutate({
              assignment_id: submitModal.id,
              ...payload,
            })
          }
          isSubmitting={submitMutation.isPending}
        />
      )}

      {/* View Submission Modal */}
      {viewModal && (
        <ViewSubmissionModal
          assignment={viewModal}
          onClose={() => setViewModal(null)}
        />
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// SUBMIT MODAL
// ═══════════════════════════════════════════════════════════
function SubmitModal({
  assignment,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  assignment: Assignment;
  onClose: () => void;
  onSubmit: (payload: { file_url?: string; text_answer?: string }) => void;
  isSubmitting: boolean;
}) {
  const [textAnswer, setTextAnswer] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate size client-side
  if (file.size > 20 * 1024 * 1024) {
    toast.error('File too large (max 20MB)');
    return;
  }

  setUploading(true);
  toast.loading('Uploading file...', { id: 'upload' });

  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('cms_token');
    const response = await fetch('http://localhost:8000/api/upload/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Upload failed');
    }

    const data = await response.json();
    console.log('✅ Upload success:', data);
    setFileUrl(data.file_url);
    toast.success('File uploaded!', { id: 'upload' });
  } catch (err: any) {
    console.error('❌ Upload error:', err);
    toast.error(err.message || 'Upload failed', { id: 'upload' });
  } finally {
    setUploading(false);
  }
};

  const handleSubmit = () => {
    if (!textAnswer.trim() && !fileUrl) {
      toast.error('Please provide a text answer or upload a file');
      return;
    }
    onSubmit({
      text_answer: textAnswer.trim() || undefined,
      file_url: fileUrl || undefined,
    });
  };

  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Submit Assignment</h3>
            <p className="text-xs text-gray-500 mt-0.5">{assignment.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Assignment Info Card */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Course</p>
                <p className="font-medium text-gray-800">
                  {assignment.course_title || 'Course'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Max Score</p>
                <p className="font-medium text-gray-800">{assignment.max_score}</p>
              </div>
              {dueDate && (
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p
                    className={`font-medium ${
                      isOverdue ? 'text-red-600' : 'text-gray-800'
                    }`}
                  >
                    {dueDate.toLocaleDateString()}
                    {isOverdue && ' (Overdue)'}
                  </p>
                </div>
              )}
            </div>
            {assignment.description && (
              <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-indigo-100">
                {assignment.description}
              </p>
            )}
          </div>

          {isOverdue && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 text-sm">
              <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={16} />
              <p className="text-yellow-800">
                This assignment is <strong>past due</strong>. Your submission will
                be marked as late.
              </p>
            </div>
          )}

          {/* Text Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer / Notes
            </label>
            <textarea
              rows={5}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Explain your approach, paste a GitHub link, or describe your work..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              {textAnswer.length} characters
            </p>
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200" />
            <span>OR UPLOAD A FILE</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* File Upload */}
          <div>
            {fileUrl ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm font-medium text-green-800">File ready</p>
                    <p className="text-xs text-green-600 truncate max-w-xs">
                      {fileUrl.split('/').pop()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFileUrl('')}
                  className="text-green-700 hover:text-green-900 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  uploading
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                  accept=".pdf,.zip,.txt,.doc,.docx,.jpg,.png"
                />
                <FileUp
                  className={`mx-auto mb-2 ${
                    uploading ? 'text-indigo-600 animate-bounce' : 'text-gray-400'
                  }`}
                  size={32}
                />
                <p className="text-sm font-medium text-gray-700">
                  {uploading ? 'Uploading...' : 'Click to upload a file'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, ZIP, DOC, images (max 10MB)
                </p>
              </label>
            )}
          </div>

          {/* Alternative — File URL */}
          <details className="text-sm">
            <summary className="cursor-pointer text-indigo-600 hover:text-indigo-700 text-xs">
              Or paste a file URL instead
            </summary>
            <div className="mt-3">
              <div className="relative">
                <LinkIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            className="flex-1"
          >
            <Send size={16} /> Submit Assignment
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VIEW SUBMISSION MODAL
// ═══════════════════════════════════════════════════════════
function ViewSubmissionModal({
  assignment,
  onClose,
}: {
  assignment: Assignment;
  onClose: () => void;
}) {
  const isGraded = assignment.submission_status === 'graded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {isGraded ? 'Submission & Feedback' : 'Your Submission'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{assignment.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div
            className={`rounded-lg p-4 ${
              isGraded
                ? 'bg-green-50 border border-green-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {isGraded ? (
                <CheckCircle className="text-green-600" size={24} />
              ) : (
                <Clock className="text-blue-600" size={24} />
              )}
              <div>
                <p
                  className={`font-semibold ${
                    isGraded ? 'text-green-800' : 'text-blue-800'
                  }`}
                >
                  {isGraded ? 'Graded' : 'Submitted — Pending Grade'}
                </p>
                <p
                  className={`text-xs ${
                    isGraded ? 'text-green-600' : 'text-blue-600'
                  }`}
                >
                  {assignment.submitted_at
                    ? `Submitted on ${new Date(
                        assignment.submitted_at
                      ).toLocaleString()}`
                    : 'Submitted'}
                </p>
              </div>
            </div>
          </div>

          {/* Grade (if graded) */}
          {isGraded && assignment.grade !== undefined && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
              <p className="text-sm text-indigo-100 mb-1">Your Grade</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold">{assignment.grade}</p>
                <span className="text-xl opacity-75">/ {assignment.max_score}</span>
              </div>
              <p className="text-sm text-indigo-100 mt-1">
                {Math.round((assignment.grade / assignment.max_score) * 100)}%
              </p>
            </div>
          )}

          {/* Your Answer */}
          {assignment.text_answer && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                YOUR ANSWER
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {assignment.text_answer}
                </p>
              </div>
            </div>
          )}

          {/* Submitted File */}
          {assignment.file_url && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                SUBMITTED FILE
              </p>
              <a
                href={assignment.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition"
              >
                <FileText className="text-indigo-600" size={24} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {assignment.file_url.split('/').pop() || 'Download'}
                  </p>
                  <p className="text-xs text-gray-500">Click to open</p>
                </div>
                <Eye className="text-gray-400" size={18} />
              </a>
            </div>
          )}

          {/* Instructor Feedback */}
          {isGraded && assignment.feedback && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                INSTRUCTOR FEEDBACK
              </p>
              <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-600">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {assignment.feedback}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════
function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
    submitted: { color: 'bg-blue-100 text-blue-700', icon: Upload, label: 'Submitted' },
    graded: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Graded' },
  };

  const c = config[status as keyof typeof config] || config.pending;
  const Icon = c.icon;

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 ${c.color}`}
    >
      <Icon size={12} /> {c.label}
    </span>
  );
}