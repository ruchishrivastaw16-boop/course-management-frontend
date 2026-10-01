import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, FileText, UserCheck, Award,
  Eye, X, Download, CheckCircle, Clock, Save, Search,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { useMyCourses } from '../../hooks/useCourses';

const links = [
  { to: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/instructor/create', label: 'Create Course', icon: PlusCircle },
  { to: '/instructor/courses', label: 'Manage Courses', icon: FileText },
  { to: '/instructor/assignments', label: 'Assignments', icon: Award },
  { to: '/instructor/submissions', label: 'Submissions', icon: FileText },   // ← NAYA
  { to: '/instructor/students', label: 'Students', icon: UserCheck },
];

interface Assignment {
  id: number;
  title: string;
  course_id: number;
  course_title?: string;
  max_score: number;
}

interface Submission {
  id: number;
  assignment_id: number;
  assignment_title?: string;
  student_id: number;
  student_name?: string;
  student_email?: string;
  file_url?: string;
  text_answer?: string;
  grade?: number;
  feedback?: string;
  status: string;
  submitted_at: string;
  graded_at?: string;
  max_score?: number;
}

export default function InstructorSubmissions() {
  const [searchParams] = useSearchParams();
  const [selectedAssignment, setSelectedAssignment] = useState<number | 'all'>(
    searchParams.get('assignment')
      ? Number(searchParams.get('assignment'))
      : 'all'
  );
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Submission | null>(null);
  const qc = useQueryClient();

  const { data: courses } = useMyCourses();

  // Fetch all assignments from all courses
  const { data: allAssignments } = useQuery({
    queryKey: ['instructor-all-assignments', courses?.map((c) => c.id)],
    queryFn: async () => {
      if (!courses) return [];
      const results = await Promise.all(
        courses.map((c) =>
          api
            .get(`/instructor/assignments/course/${c.id}`)
            .then((r) => r.data)
            .catch(() => [])
        )
      );
      return results.flat() as Assignment[];
    },
    enabled: !!courses && courses.length > 0,
  });

  // Fetch submissions for selected assignment (or all)
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['instructor-submissions', selectedAssignment],
    queryFn: async () => {
      if (!allAssignments || allAssignments.length === 0) return [];

      if (selectedAssignment !== 'all') {
        const { data } = await api.get(
          `/instructor/submissions/assignment/${selectedAssignment}`
        );
        return data as Submission[];
      }

      // Fetch all — parallel
      const results = await Promise.all(
        allAssignments.map((a) =>
          api
            .get(`/instructor/submissions/assignment/${a.id}`)
            .then((r) => r.data)
            .catch(() => [])
        )
      );
      return results.flat() as Submission[];
    },
    enabled: !!allAssignments,
  });

  const gradeMutation = useMutation({
    mutationFn: async ({
      submissionId,
      grade,
      feedback,
    }: {
      submissionId: number;
      grade: number;
      feedback: string;
    }) => {
      const { data } = await api.put(
        `/instructor/submissions/${submissionId}/grade`,
        { grade, feedback }
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Grade saved!');
      qc.invalidateQueries({ queryKey: ['instructor-submissions'] });
      setViewing(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to save grade');
    },
  });

  const filtered = (submissions || []).filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        s.student_name?.toLowerCase().includes(q) ||
        s.student_email?.toLowerCase().includes(q) ||
        s.assignment_title?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const stats = {
    total: submissions?.length || 0,
    pending: submissions?.filter((s) => s.status === 'submitted').length || 0,
    graded: submissions?.filter((s) => s.status === 'graded').length || 0,
  };

  return (
    <DashboardLayout links={links} title="Student Submissions">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="rounded-xl p-4 bg-indigo-50 text-indigo-700">
          <p className="text-xs font-medium opacity-75">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl p-4 bg-yellow-50 text-yellow-700">
          <p className="text-xs font-medium opacity-75">Pending Grade</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="rounded-xl p-4 bg-green-50 text-green-700">
          <p className="text-xs font-medium opacity-75">Graded</p>
          <p className="text-2xl font-bold">{stats.graded}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or assignment..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <select
          value={selectedAssignment}
          onChange={(e) =>
            setSelectedAssignment(
              e.target.value === 'all' ? 'all' : Number(e.target.value)
            )
          }
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
        >
          <option value="all">All Assignments</option>
          {allAssignments?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No submissions to review</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Assignment</th>
                <th className="text-left px-5 py-3">Grade</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Submitted</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-xs">
                        {s.student_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-xs">
                          {s.student_name || `Student #${s.student_id}`}
                        </p>
                        <p className="text-xs text-gray-500">{s.student_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 text-xs">
                      {s.assignment_title || `Assignment #${s.assignment_id}`}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {s.grade !== null && s.grade !== undefined ? (
                      <span className="font-medium">
                        {s.grade}
                        {s.max_score ? `/${s.max_score}` : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        s.status === 'graded'
                          ? 'bg-green-100 text-green-700'
                          : s.status === 'submitted'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {s.submitted_at
                      ? new Date(s.submitted_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setViewing(s)}
                      className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600"
                      title="Review"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grade Modal */}
      {viewing && (
        <GradeModal
          submission={viewing}
          onClose={() => setViewing(null)}
          onSave={(grade, feedback) =>
            gradeMutation.mutate({
              submissionId: viewing.id,
              grade,
              feedback,
            })
          }
          isSaving={gradeMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// GRADE MODAL
// ═══════════════════════════════════════════════════════════
function GradeModal({
  submission,
  onClose,
  onSave,
  isSaving,
}: {
  submission: Submission;
  onClose: () => void;
  onSave: (grade: number, feedback: string) => void;
  isSaving: boolean;
}) {
  const [grade, setGrade] = useState<number | ''>(
    submission.grade !== null && submission.grade !== undefined
      ? submission.grade
      : ''
  );
  const [feedback, setFeedback] = useState(submission.feedback || '');

  const handleSave = () => {
    if (grade === '' || grade === null) {
      toast.error('Please enter a grade');
      return;
    }
    if (typeof grade === 'number' && grade < 0) {
      toast.error('Grade cannot be negative');
      return;
    }
    if (
      submission.max_score &&
      typeof grade === 'number' &&
      grade > submission.max_score
    ) {
      toast.error(`Grade cannot exceed ${submission.max_score}`);
      return;
    }
    onSave(grade, feedback);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Review Submission</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {submission.assignment_title} · {submission.student_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Student</p>
              <p className="font-medium text-gray-800">
                {submission.student_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-800 text-sm">
                {submission.student_email}
              </p>
            </div>
          </div>

          {/* Submitted File */}
          {submission.file_url && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                SUBMITTED FILE
              </p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <FileText className="text-indigo-600" size={24} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {submission.file_url.split('/').pop()}
                  </p>
                </div>
                <a
                  href={submission.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Download size={16} />
                </a>
              </div>
            </div>
          )}

          {/* Text Answer */}
          {submission.text_answer && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                STUDENT'S ANSWER
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {submission.text_answer}
                </p>
              </div>
            </div>
          )}

          {/* Grade Form */}
          <div className="border-t pt-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              Grade This Submission
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Grade {submission.max_score ? `(max ${submission.max_score})` : ''}
                </label>
                <input
                  type="number"
                  value={grade}
                  onChange={(e) =>
                    setGrade(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  min={0}
                  max={submission.max_score}
                  step={0.5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Feedback
                </label>
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                  placeholder="Great work! / Needs improvement on..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={handleSave} loading={isSaving}>
                <Save size={16} /> Save Grade
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}