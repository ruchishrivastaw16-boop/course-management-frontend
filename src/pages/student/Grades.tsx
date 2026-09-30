import { useState } from 'react';
import {
  LayoutDashboard, GraduationCap, FileText, BarChart3,
  Award, TrendingUp, Target, Percent,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import type { Submission } from '../../types/index';

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: GraduationCap },
  { to: '/student/assignments', label: 'Assignments', icon: FileText },
  { to: '/student/grades', label: 'Grades', icon: BarChart3 },
];

const gradeService = {
  getMySubmissions: async (): Promise<Submission[]> => {
    const { data } = await api.get('/submissions/my');
    return data;
  },
};

type Filter = 'all' | 'graded' | 'pending';

export default function Grades() {
  const [filter, setFilter] = useState<Filter>('all');

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: gradeService.getMySubmissions,
  });

  // Only graded submissions count for average
  const graded = submissions?.filter((s) => s.status === 'graded' && s.grade !== null && s.grade !== undefined) || [];
  const pending = submissions?.filter((s) => s.status === 'submitted') || [];

  // Calculate stats
  const totalGraded = graded.length;
  const avgPercent =
    totalGraded > 0
      ? Math.round(
          (graded.reduce((sum, s) => sum + (s.grade || 0) / (s as any).max_score || 100, 0) /
            totalGraded) *
            100
        )
      : 0;

  const highestGrade = graded.length > 0 ? Math.max(...graded.map((s) => s.grade || 0)) : 0;
  const lowestGrade = graded.length > 0 ? Math.min(...graded.map((s) => s.grade || 0)) : 0;

  const getLetterGrade = (pct: number) => {
    if (pct >= 90) return { letter: 'A', color: 'bg-green-100 text-green-700', desc: 'Excellent' };
    if (pct >= 80) return { letter: 'B', color: 'bg-blue-100 text-blue-700', desc: 'Good' };
    if (pct >= 70) return { letter: 'C', color: 'bg-yellow-100 text-yellow-700', desc: 'Average' };
    if (pct >= 60) return { letter: 'D', color: 'bg-orange-100 text-orange-700', desc: 'Pass' };
    return { letter: 'F', color: 'bg-red-100 text-red-700', desc: 'Fail' };
  };

  const overall = getLetterGrade(avgPercent);

  // Filter
  const filtered = (submissions || []).filter((s) => {
    if (filter === 'graded') return s.status === 'graded';
    if (filter === 'pending') return s.status === 'submitted';
    return true;
  });

  return (
    <DashboardLayout links={links} title="My Grades">
      {/* Overall Performance Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-100 mb-1">Overall Performance</p>
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold">{avgPercent}%</p>
            <span className="text-2xl font-bold">{overall.letter}</span>
          </div>
          <p className="text-sm text-indigo-100 mt-1">
            {overall.desc} · Based on {totalGraded} graded assignment{totalGraded !== 1 ? 's' : ''}
          </p>
        </div>
        <Award size={72} className="opacity-20" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox
          icon={Target}
          label="Average Score"
          value={`${avgPercent}%`}
          color="bg-indigo-50 text-indigo-700"
        />
        <StatBox
          icon={TrendingUp}
          label="Graded"
          value={totalGraded}
          color="bg-green-50 text-green-700"
        />
        <StatBox
          icon={Award}
          label="Highest"
          value={highestGrade || '—'}
          color="bg-yellow-50 text-yellow-700"
        />
        <StatBox
          icon={Percent}
          label="Lowest"
          value={lowestGrade || '—'}
          color="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {(['all', 'graded', 'pending'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f === 'all' ? 'All' : f === 'graded' ? 'Graded' : 'Pending Grading'}
            <span className="ml-2 text-xs opacity-75">
              ({f === 'all' ? submissions?.length || 0 : f === 'graded' ? totalGraded : pending.length})
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && <Spinner />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
          Failed to load grades
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <BarChart3 className="mx-auto text-gray-300 mb-3" size={56} />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            No grades yet
          </h3>
          <p className="text-sm text-gray-500">
            Submit assignments to see your grades here.
          </p>
        </div>
      )}

      {/* Gradebook Table */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Assignment</th>
                <th className="text-left px-5 py-3">Submitted</th>
                <th className="text-left px-5 py-3">Score</th>
                <th className="text-left px-5 py-3">Percentage</th>
                <th className="text-left px-5 py-3">Grade</th>
                <th className="text-left px-5 py-3">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const grade = s.grade;
                const maxScore = (s as any).max_score || 100;
                const pct =
                  grade !== null && grade !== undefined
                    ? Math.round((grade / maxScore) * 100)
                    : null;
                const letter = pct !== null ? getLetterGrade(pct) : null;

                return (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">
                        {(s as any).assignment_title || `Assignment #${s.assignment_id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(s as any).course_title || 'Course'}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(s.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {grade !== null && grade !== undefined
                        ? `${grade} / ${maxScore}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {pct !== null ? `${pct}%` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {letter ? (
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${letter.color}`}
                        >
                          {letter.letter}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not graded</span>
                      )}
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      {s.feedback ? (
                        <p className="text-xs text-gray-600 italic line-clamp-2" title={s.feedback}>
                          "{s.feedback}"
                        </p>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── Sub Component ──────────────────────────
function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <Icon size={16} className="opacity-60" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}