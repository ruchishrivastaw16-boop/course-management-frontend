import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, Clock, Users, BookOpen, PlayCircle, FileText,
  CheckCircle, Lock,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useCourse } from '../../hooks/useCourses';
import { useAuth } from '../../hooks/useAuth';
import enrollmentService from '../../services/enrollmentService';
import api from '../../services/api';

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [enrolling, setEnrolling] = useState(false);
  const [activeModule, setActiveModule] = useState(-1);

  const { data: course, isLoading } = useCourse(slug!);

  if (isLoading) return <Spinner />;
  if (!course)
    return (
      <div className="p-8 text-center text-gray-600">Course not found</div>
    );

  // ═══════════════════════════════════════════════════════════
  // 🎯 HANDLE ENROLL / BUY NOW — Complete Logic
  // ═══════════════════════════════════════════════════════════
  const handleEnroll = async () => {
    // 1. Auth check
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    // 2. Role check
    if (user?.role !== 'student') {
      toast.error('Only students can enroll');
      return;
    }

    // 3. ⭐ Check if already enrolled
    try {
      setEnrolling(true);
      const { data: enrollments } = await api.get('/enrollments/my');
      const alreadyEnrolled = enrollments.find(
        (e: any) => e.course_id === course.id
      );

      if (alreadyEnrolled) {
        toast.success('Already enrolled! Opening course...');
        navigate(`/student/courses/${course.id}/learn`);
        return;
      }
    } catch (err) {
      console.error('Enrollment check failed:', err);
      // Continue anyway
    } finally {
      setEnrolling(false);
    }

    // 4. Paid course → Checkout
    if (!course.is_free && Number(course.price) > 0) {
      navigate(`/checkout/${course.id}`);
      return;
    }

    // 5. Free course → Direct enroll
    setEnrolling(true);
    try {
      await enrollmentService.enroll(course.id);
      toast.success('Enrolled successfully! 🎉');
      setTimeout(() => navigate(`/student/courses/${course.id}/learn`), 800);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };
  // ═══════════════════════════════════════════════════════════
  // BUTTON LABEL
  // ═══════════════════════════════════════════════════════════
  const getButtonLabel = () => {
    if (course.is_free) return 'Enroll Now';
    return `Buy Now - $${Number(course.price).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ═══ Hero Section ═══ */}
      <section className="bg-gradient-to-br from-indigo-700 to-purple-700 text-white py-12">
        <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {course.category && (
              <span className="bg-purple-500 text-xs px-3 py-1 rounded-full">
                {course.category}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mt-3 mb-3">
              {course.title}
            </h1>
            <p className="text-indigo-100 mb-5">{course.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm">
              <span className="flex items-center gap-1">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                {course.rating || 0} rating
              </span>
              <span className="flex items-center gap-1">
                <Users size={16} /> {course.students_count || 0} students
              </span>
              <span className="flex items-center gap-1">
                <Clock size={16} /> {course.duration_hours || 0} hours
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={16} /> {course.lessons_count || 0} lessons
              </span>
            </div>

            <p className="mt-4 text-indigo-100 text-sm">
              Instructor:{' '}
              <span className="text-white font-medium">
                {course.instructor_name || 'Instructor'}
              </span>
            </p>
          </div>

          {/* ═══ Purchase Card ═══ */}
          <div className="lg:col-span-1">
            <div className="bg-white text-gray-800 rounded-xl shadow-2xl overflow-hidden">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-44 object-cover"
                />
              )}

              <div className="p-6">
                {/* Price */}
                <div className="text-3xl font-bold mb-4">
                  {course.is_free ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>${Number(course.price).toFixed(2)}</span>
                  )}
                </div>

                {/* ⭐ Buy Now / Enroll Button */}
                <Button onClick={handleEnroll} loading={enrolling} className="w-full mb-3" size="lg">
                  {course.is_free ? 'Enroll Now' : `Buy Now - $${Number(course.price).toFixed(2)}`}
                </Button>

                {/* Benefits */}        
                <ul className="text-sm space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    Full lifetime access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    Certificate of completion
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    Access on mobile & TV
                  </li>
                  {!course.is_free && (
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      30-day money-back guarantee
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Curriculum ═══ */}
      {course.modules && course.modules.length > 0 && (
        <section className="container mx-auto px-4 py-12 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
          <div className="space-y-3">
            {course.modules.map((m: any, idx: number) => (
              <div
                key={m.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() =>
                    setActiveModule(activeModule === idx ? -1 : idx)
                  }
                  className="w-full px-5 py-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div className="text-left">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-gray-500">
                      {m.lessons.length} lessons
                    </p>
                  </div>
                  <span className="text-2xl text-gray-400">
                    {activeModule === idx ? '−' : '+'}
                  </span>
                </button>

                {activeModule === idx && (
                  <ul className="border-t">
                    {m.lessons.map((l: any) => (
                      <li
                        key={l.id}
                        className="px-5 py-3 flex items-center gap-3 text-sm text-gray-700 border-b last:border-0"
                      >
                        {l.type === 'video' && (
                          <PlayCircle size={16} className="text-indigo-600" />
                        )}
                        {l.type === 'pdf' && (
                          <FileText size={16} className="text-orange-500" />
                        )}
                        {l.type === 'quiz' && (
                          <CheckCircle size={16} className="text-purple-600" />
                        )}
                        <span className="flex-1">{l.title}</span>
                        <span className="text-gray-400 text-xs">
                          {l.duration_minutes}m
                        </span>
                        {l.is_preview ? (
                          <span className="text-xs text-indigo-600 font-semibold">
                            Preview
                          </span>
                        ) : (
                          <Lock size={14} className="text-gray-300" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}