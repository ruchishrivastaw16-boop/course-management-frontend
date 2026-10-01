import { useState } from 'react';
import {
  LayoutDashboard, PlusCircle, FileText, UserCheck,
  Calendar, Award, Trash2, Edit2, Users,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
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
  course_id: number;
  course_title?: string;
  title: string;
  description?: string;
  max_score: number;
  due_date?: string;
  created_at: string;
}

const assignmentService = {
  getAll: async (courseId?: number): Promise<Assignment[]> => {
    if (courseId) {
      const { data } = await api.get(`/instructor/assignments/course/${courseId}`);
      return data;
    }
    // Fetch all — aggregate per course
    const { data: courses } = await api.get('/instructor/courses/my-courses');
    const results = await Promise.all(
      courses.map((c: any) =>
        api
          .get(`/instructor/assignments/course/${c.id}`)
          .then((r) => r.data)
          .catch(() => [])
      )
    );
    return results.flat();
  },
  create: async (payload: any): Promise<Assignment> => {
    const { data } = await api.post('/instructor/assignments/', payload);
    return data;
  },
  update: async (id: number, payload: any): Promise<Assignment> => {
    const { data } = await api.put(`/instructor/assignments/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/instructor/assignments/${id}`);
  },
};

export default function InstructorAssignments() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [filterCourse, setFilterCourse] = useState<number | 'all'>('all');
  const [form, setForm] = useState({
    course_id: 0,
    title: '',
    description: '',
    max_score: 100,
    due_date: '',
  });

  const { data: courses } = useMyCourses();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['instructor-assignments'],
    queryFn: () => assignmentService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: assignmentService.create,
    onSuccess: () => {
      toast.success('Assignment created!');
      qc.invalidateQueries({ queryKey: ['instructor-assignments'] });
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      assignmentService.update(id, payload),
    onSuccess: () => {
      toast.success('Assignment updated!');
      qc.invalidateQueries({ queryKey: ['instructor-assignments'] });
      setShowModal(false);
      setEditing(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: assignmentService.delete,
    onSuccess: () => {
      toast.success('Assignment deleted');
      qc.invalidateQueries({ queryKey: ['instructor-assignments'] });
    },
  });

  const resetForm = () => {
    setForm({
      course_id: 0,
      title: '',
      description: '',
      max_score: 100,
      due_date: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (a: Assignment) => {
    setEditing(a);
    setForm({
      course_id: a.course_id,
      title: a.title,
      description: a.description || '',
      max_score: a.max_score,
      due_date: a.due_date ? a.due_date.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return toast.error('Title required');
    if (!form.course_id) return toast.error('Select a course');

    const payload = {
      ...form,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filtered =
    filterCourse === 'all'
      ? assignments || []
      : (assignments || []).filter((a) => a.course_id === filterCourse);

  return (
    <DashboardLayout links={links} title="Assignments">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-6">
        <div className="flex gap-2 flex-1">
          <select
            value={filterCourse}
            onChange={(e) =>
              setFilterCourse(
                e.target.value === 'all' ? 'all' : Number(e.target.value)
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
          >
            <option value="all">All Courses</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-500 self-center">
            {filtered.length} assignment{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle size={16} /> Create Assignment
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            No assignments yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Create assignments for your students to submit.
          </p>
          <Button onClick={openCreate}>
            <PlusCircle size={16} /> Create First Assignment
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const dueDate = a.due_date ? new Date(a.due_date) : null;
            const isOverdue = dueDate && dueDate < new Date();

            return (
              <div
                key={a.id}
                className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {a.title}
                      </h3>
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
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Award size={12} /> Max: {a.max_score}
                      </span>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 md:min-w-[140px]">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(a)}
                    >
                      <Edit2 size={14} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(a.id, a.title)}
                      loading={deleteMutation.isPending}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
          resetForm();
        }}
        title={editing ? 'Edit Assignment' : 'Create Assignment'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              value={form.course_id}
              onChange={(e) =>
                setForm({ ...form, course_id: Number(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
              disabled={!!editing}
            >
              <option value={0}>-- Select Course --</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Title"
            placeholder="e.g. Build a Todo App"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
              placeholder="What should students do?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Max Score"
              type="number"
              value={form.max_score}
              onChange={(e) =>
                setForm({ ...form, max_score: Number(e.target.value) })
              }
            />
            <Input
              label="Due Date"
              type="datetime-local"
              value={form.due_date}
              onChange={(e) =>
                setForm({ ...form, due_date: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {editing ? 'Update' : 'Create'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditing(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}