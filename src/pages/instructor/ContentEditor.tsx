import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  UserCheck,
  ArrowLeft,
  Plus,
  Trash2,
  Video,
  File,
  HelpCircle,
  Type,
  Save,
  ChevronDown,
  ChevronRight,
  Award,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const links = [
  { to: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/instructor/create', label: 'Create Course', icon: PlusCircle },
  { to: '/instructor/courses', label: 'Manage Courses', icon: FileText },
  { to: '/instructor/assignments', label: 'Assignments', icon: Award },
  { to: '/instructor/submissions', label: 'Submissions', icon: FileText },   // ← NAYA
  { to: '/instructor/students', label: 'Students', icon: UserCheck },
];
interface Lesson {
  id: number;
  title: string;
  type: 'video' | 'pdf' | 'text' | 'quiz';
  content?: string;
  resource_url?: string;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
}

interface Module {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: number;
  title: string;
  slug: string;
  modules: Module[];
}

export default function ContentEditor() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [newModule, setNewModule] = useState({ title: '', description: '', order_index: 1 });
  const [addingLessonTo, setAddingLessonTo] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({
    title: '',
    type: 'video' as Lesson['type'],
    content: '',
    resource_url: '',
    duration_minutes: 5,
    is_preview: false,
  });

  // ─── Fetch course with modules ───
  const { data: course, isLoading } = useQuery({
    queryKey: ['course-content', courseId],
    queryFn: async () => {
      const { data: all } = await api.get('/instructor/courses/my-courses');
      const found = all.find((c: any) => c.id === courseId);
      if (!found) throw new Error('Course not found');
      const { data } = await api.get(`/courses/${found.slug}`);
      return data as CourseDetail;
    },
    enabled: !!courseId,
  });

  // ─── Mutations ───
  const addModuleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post(`/instructor/courses/${courseId}/modules`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Module added!');
      qc.invalidateQueries({ queryKey: ['course-content', courseId] });
      setNewModule({ title: '', description: '', order_index: 1 });
      setShowModuleForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const addLessonMutation = useMutation({
    mutationFn: async ({ moduleId, payload }: { moduleId: number; payload: any }) => {
      const { data } = await api.post(
        `/instructor/courses/modules/${moduleId}/lessons`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Lesson added!');
      qc.invalidateQueries({ queryKey: ['course-content', courseId] });
      setNewLesson({
        title: '',
        type: 'video',
        content: '',
        resource_url: '',
        duration_minutes: 5,
        is_preview: false,
      });
      setAddingLessonTo(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const handleAddModule = () => {
    if (!newModule.title.trim()) {
      toast.error('Module title required');
      return;
    }
    addModuleMutation.mutate({
      title: newModule.title,
      description: newModule.description,
      order_index: (course?.modules?.length || 0) + 1,
    });
  };

  const handleAddLesson = (moduleId: number) => {
    if (!newLesson.title.trim()) {
      toast.error('Lesson title required');
      return;
    }
    addLessonMutation.mutate({
      moduleId,
      payload: {
        ...newLesson,
        order_index: 1, // auto-increment backend side
      },
    });
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={14} className="text-indigo-600" />;
      case 'pdf': return <File size={14} className="text-orange-500" />;
      case 'quiz': return <HelpCircle size={14} className="text-purple-600" />;
      default: return <Type size={14} className="text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout links={links} title="Content Editor">
        <Spinner />
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout links={links} title="Content Editor">
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-4">Course not found</p>
          <Button onClick={() => navigate('/instructor/courses')}>
            <ArrowLeft size={16} /> Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalLessons = course.modules?.reduce((s, m) => s + m.lessons.length, 0) || 0;

  return (
    <DashboardLayout links={links} title="Content Editor">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/instructor/courses')}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">{course.title}</h2>
            <p className="text-sm text-gray-500">
              {course.modules?.length || 0} modules · {totalLessons} lessons
            </p>
          </div>
          <Button onClick={() => setShowModuleForm(true)}>
            <Plus size={16} /> Add Module
          </Button>
        </div>
      </div>

      {/* Add Module Form */}
      {showModuleForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">New Module</h3>
          <div className="space-y-3">
            <Input
              label="Module Title"
              placeholder="e.g. Getting Started"
              value={newModule.title}
              onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
            />
            <Input
              label="Description (optional)"
              placeholder="Brief overview"
              value={newModule.description}
              onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddModule} loading={addModuleMutation.isPending}>
                <Save size={14} /> Save Module
              </Button>
              <Button variant="outline" onClick={() => setShowModuleForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modules List */}
      {(!course.modules || course.modules.length === 0) && !showModuleForm ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            No modules yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Start by creating your first module.
          </p>
          <Button onClick={() => setShowModuleForm(true)}>
            <Plus size={16} /> Add First Module
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {course.modules?.map((m, idx) => {
            const isExpanded = expandedModules.has(m.id);
            return (
              <div key={m.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Module Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleModule(m.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400" />
                    )}
                    <span className="text-xs font-bold text-gray-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{m.title}</h3>
                      <p className="text-xs text-gray-500">
                        {m.lessons.length} lessons · {m.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() => {
                        setAddingLessonTo(m.id);
                        setExpandedModules((prev) => new Set([...prev, m.id]));
                      }}
                    >
                      <Plus size={14} /> Add Lesson
                    </Button>
                  </div>
                </div>

                {/* Lessons List */}
                {isExpanded && (
                  <div className="border-t">
                    {/* Existing Lessons */}
                    {m.lessons.length > 0 ? (
                      <div className="divide-y">
                        {m.lessons.map((l, lIdx) => (
                          <div
                            key={l.id}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
                          >
                            <span className="text-xs font-medium text-gray-400 w-6">
                              {lIdx + 1}
                            </span>
                            {getLessonIcon(l.type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">
                                {l.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {l.type} · {l.duration_minutes}m
                                {l.is_preview && (
                                  <span className="ml-2 text-indigo-600 font-medium">
                                    Preview
                                  </span>
                                )}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-gray-500">
                        No lessons yet. Click "Add Lesson" to start.
                      </div>
                    )}

                    {/* Add Lesson Inline Form */}
                    {addingLessonTo === m.id && (
                      <div className="bg-indigo-50 p-5 border-t">
                        <h4 className="font-semibold text-sm text-gray-800 mb-3">
                          Add Lesson
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <Input
                            label="Title"
                            placeholder="Lesson title"
                            value={newLesson.title}
                            onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type
                            </label>
                            <select
                              value={newLesson.type}
                              onChange={(e) =>
                                setNewLesson({ ...newLesson, type: e.target.value as any })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                            >
                              <option value="video">Video</option>
                              <option value="pdf">PDF</option>
                              <option value="text">Text</option>
                              <option value="quiz">Quiz</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <Input
                            label="Resource URL"
                            placeholder="https://youtube.com/..."
                            value={newLesson.resource_url}
                            onChange={(e) =>
                              setNewLesson({ ...newLesson, resource_url: e.target.value })
                            }
                          />
                          <Input
                            label="Duration (minutes)"
                            type="number"
                            value={newLesson.duration_minutes}
                            onChange={(e) =>
                              setNewLesson({
                                ...newLesson,
                                duration_minutes: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content / Description (optional)
                          </label>
                          <textarea
                            rows={2}
                            value={newLesson.content}
                            onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                            placeholder="What's this lesson about?"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-sm mb-3">
                          <input
                            type="checkbox"
                            checked={newLesson.is_preview}
                            onChange={(e) =>
                              setNewLesson({ ...newLesson, is_preview: e.target.checked })
                            }
                            className="text-indigo-600"
                          />
                          <span>Free preview (visible to non-enrolled students)</span>
                        </label>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddLesson(m.id)}
                            loading={addLessonMutation.isPending}
                          >
                            <Save size={14} /> Save Lesson
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAddingLessonTo(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}