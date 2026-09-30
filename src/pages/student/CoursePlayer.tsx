import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlayCircle, FileText, CheckCircle, ChevronLeft, BookOpen,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

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
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  instructor_name?: string;
  duration_hours: number;
  lessons_count: number;
  modules: Module[];
}

// ═══════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════
const courseService = {
  // ✅ Fetch all courses (published only) — but WITH debug
  getAll: async (): Promise<any[]> => {
    const { data } = await api.get('/courses/');
    return data;
  },

  // ✅ Fetch course details by slug (includes modules)
  getBySlug: async (slug: string): Promise<CourseDetail> => {
    const { data } = await api.get(`/courses/${slug}`);
    return data;
  },

  // ✅ Fallback: fetch my enrollments to find enrolled course
  getMyEnrollments: async (): Promise<any[]> => {
    const { data } = await api.get('/enrollments/my');
    return data;
  },
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════
export default function CoursePlayer() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    new Set()
  );

  // ✅ IMPROVED: Try multiple strategies to find the course
  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['player-course', courseId],
    queryFn: async (): Promise<CourseDetail> => {
      console.log('🎬 [Player] Loading course ID:', courseId);

      if (!courseId || isNaN(courseId)) {
        throw new Error('Invalid course ID in URL');
      }

      // ─── Strategy 1: Try direct from my enrollments ───
      try {
        const enrollments = await courseService.getMyEnrollments();
        console.log('🎬 [Player] My enrollments:', enrollments);

        const enrollment = enrollments.find(
          (e: any) => Number(e.course_id) === courseId
        );
        console.log('🎬 [Player] Matching enrollment:', enrollment);

        if (enrollment) {
          // Try to get full details via slug
          if (enrollment.course_slug) {
            try {
              const detail = await courseService.getBySlug(
                enrollment.course_slug
              );
              console.log('🎬 [Player] Course detail via slug:', detail);
              return detail;
            } catch (err) {
              console.warn(
                '🎬 [Player] Slug fetch failed, using enrollment data only:',
                err
              );
            }
          }

          // Fallback: build minimal course object from enrollment
          return {
            id: enrollment.course_id,
            title: enrollment.course_title || 'Course',
            slug: enrollment.course_slug || '',
            description: '',
            instructor_name: enrollment.instructor_name,
            duration_hours: 0,
            lessons_count: 0,
            modules: [],
          } as CourseDetail;
        }
      } catch (err) {
        console.warn('🎬 [Player] Enrollment lookup failed:', err);
      }

      // ─── Strategy 2: Try from published courses list ───
      try {
        const courses = await courseService.getAll();
        console.log('🎬 [Player] All published courses:', courses);

        const found = courses.find(
          (c: any) => Number(c.id) === courseId
        );
        console.log('🎬 [Player] Found in published:', found);

        if (found) {
          const detail = await courseService.getBySlug(found.slug);
          return detail;
        }
      } catch (err) {
        console.warn('🎬 [Player] Published lookup failed:', err);
      }

      // ─── Not found ───
      throw new Error(
        `Course ID ${courseId} not found in your enrollments or published courses`
      );
    },
    enabled: !!courseId && !isNaN(courseId),
    retry: 1,
  });

  // ✅ FIXED: useEffect instead of useState for side effects
  useEffect(() => {
    if (course && !activeLesson) {
      const firstLesson = course.modules?.[0]?.lessons?.[0];
      if (firstLesson) {
        setActiveLesson(firstLesson);
      }
    }
  }, [course, activeLesson]);

  const toggleComplete = (lessonId: number) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const totalLessons =
    course?.modules?.reduce((sum, m) => sum + m.lessons.length, 0) || 0;
  const completedCount = completedLessons.size;
  const progress =
    totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Course not found
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {(error as any)?.message ||
                `Unable to load course ID: ${courseId}`}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-xs text-left mb-4 space-y-1">
              <p>
                <strong>Debug Info:</strong>
              </p>
              <p>
                URL param (id): <code className="bg-white px-1">{id}</code>
              </p>
              <p>
                Parsed courseId:{' '}
                <code className="bg-white px-1">{courseId}</code>
              </p>
              <p>
                Open console (F12) for detailed logs.
              </p>
            </div>

            <Link to="/student/courses">
              <Button>
                <ChevronLeft size={16} /> Back to My Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* ═══ LEFT: Content Area ═══ */}
        <div className="flex-1 p-6">
          <Link
            to="/student/courses"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 mb-4"
          >
            <ChevronLeft size={16} /> Back to My Courses
          </Link>

          {/* Video / Content Area */}
          <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center text-white">
            {activeLesson ? (
              <div className="text-center p-6">
                {activeLesson.type === 'video' && (
                  <PlayCircle size={80} className="mx-auto mb-3 opacity-80" />
                )}
                {activeLesson.type === 'pdf' && (
                  <FileText size={80} className="mx-auto mb-3 opacity-80" />
                )}
                {activeLesson.type === 'quiz' && (
                  <CheckCircle size={80} className="mx-auto mb-3 opacity-80" />
                )}
                <p className="text-lg font-medium">{activeLesson.title}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {activeLesson.type.toUpperCase()} ·{' '}
                  {activeLesson.duration_minutes}m
                </p>
                {activeLesson.resource_url && (
                  <a
                    href={activeLesson.resource_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-4 bg-indigo-600 px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
                  >
                    Open Resource
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center p-6 text-gray-400">
                <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                <p>
                  {course.modules?.length === 0
                    ? 'No lessons available for this course yet'
                    : 'Select a lesson to begin'}
                </p>
              </div>
            )}
          </div>

          {/* Lesson Info */}
          {activeLesson && (
            <div className="bg-white rounded-xl p-6 mt-6">
              <h1 className="text-2xl font-bold mb-2">{activeLesson.title}</h1>
              <p className="text-gray-600 mb-4">
                {course.title} · {course.instructor_name}
              </p>

              {activeLesson.content && (
                <p className="text-sm text-gray-700 mb-4">
                  {activeLesson.content}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => toggleComplete(activeLesson.id)}
                  variant={
                    completedLessons.has(activeLesson.id)
                      ? 'secondary'
                      : 'primary'
                  }
                >
                  <CheckCircle size={16} />
                  {completedLessons.has(activeLesson.id)
                    ? 'Completed ✓'
                    : 'Mark as Complete'}
                </Button>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="bg-white rounded-xl p-5 mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Course Progress
              </span>
              <span className="text-sm text-gray-600">
                {completedCount} / {totalLessons} lessons ({progress}%)
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Lesson Sidebar ═══ */}
        <aside className="w-full lg:w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-5 border-b sticky top-0 bg-white z-10">
            <h3 className="font-bold text-gray-800">Course Content</h3>
            <p className="text-xs text-gray-500 mt-1">
              {course.modules?.length || 0} modules · {totalLessons} lessons ·{' '}
              {course.duration_hours}h
            </p>
          </div>

          {course.modules?.map((m) => (
            <div key={m.id} className="border-b">
              <div className="px-5 py-3 bg-gray-50 text-sm font-semibold text-gray-700">
                {m.title}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({m.lessons.length} lessons)
                </span>
              </div>
              <ul>
                {m.lessons.map((l) => {
                  const isActive = activeLesson?.id === l.id;
                  const isCompleted = completedLessons.has(l.id);
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => setActiveLesson(l)}
                        className={`w-full px-5 py-3 flex items-center gap-3 text-sm text-left hover:bg-indigo-50 transition ${
                          isActive
                            ? 'bg-indigo-50 border-l-4 border-indigo-600'
                            : 'border-l-4 border-transparent'
                        }`}
                      >
                        {l.type === 'video' && (
                          <PlayCircle
                            size={16}
                            className="text-indigo-600 shrink-0"
                          />
                        )}
                        {l.type === 'pdf' && (
                          <FileText
                            size={16}
                            className="text-orange-500 shrink-0"
                          />
                        )}
                        {l.type === 'quiz' && (
                          <CheckCircle
                            size={16}
                            className="text-purple-600 shrink-0"
                          />
                        )}
                        <span
                          className={`flex-1 ${
                            isActive
                              ? 'text-indigo-700 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {l.title}
                        </span>
                        <span className="text-xs text-gray-400">
                          {l.duration_minutes}m
                        </span>
                        {isCompleted ? (
                          <CheckCircle
                            size={14}
                            className="text-green-500 shrink-0"
                          />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {(!course.modules || course.modules.length === 0) && (
            <div className="p-8 text-center text-gray-500 text-sm">
              <BookOpen className="mx-auto mb-2 text-gray-300" size={32} />
              <p>No lessons added yet</p>
              <p className="text-xs mt-1 text-gray-400">
                Instructor will add content soon
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}