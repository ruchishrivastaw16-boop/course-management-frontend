import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, BookOpen, PlayCircle, FileText, CheckCircle, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useCourse } from '../../hooks/useCourses';
import { useAuth } from '../../hooks/useAuth';
import enrollmentService from '../../services/enrollmentService';

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [enrolling, setEnrolling] = useState(false);
  const [activeModule, setActiveModule] = useState(-1);

  const { data: course, isLoading } = useCourse(slug!);

  if (isLoading) return <Spinner />;
  if (!course) return <div className="p-8 text-center">Course not found</div>;

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll');
      navigate('/login');
      return;
    }
    if (user?.role !== 'student') {
      toast.error('Only students can enroll');
      return;
    }

    setEnrolling(true);
    try {
      await enrollmentService.enroll(course.id);
      toast.success('Enrolled successfully! 🎉');
      setTimeout(() => navigate('/student/dashboard'), 800);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-indigo-700 to-purple-700 text-white py-12">
        <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <span className="bg-purple-500 text-xs px-3 py-1 rounded-full">{course.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold mt-3 mb-3">{course.title}</h1>
            <p className="text-indigo-100 mb-5">{course.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm">
              <span className="flex items-center gap-1"><Star size={16} className="fill-yellow-400 text-yellow-400" /> {course.rating} rating</span>
              <span className="flex items-center gap-1"><Users size={16} /> {course.students_count} students</span>
              <span className="flex items-center gap-1"><Clock size={16} /> {course.duration_hours} hours</span>
              <span className="flex items-center gap-1"><BookOpen size={16} /> {course.lessons_count} lessons</span>
            </div>

            <p className="mt-4 text-indigo-100 text-sm">Instructor: <span className="text-white font-medium">{course.instructor_name}</span></p>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white text-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <img src={course.thumbnail} alt={course.title} className="w-full h-44 object-cover" />
              <div className="p-6">
                <div className="text-3xl font-bold mb-4">
                  {course.is_free ? <span className="text-green-600">Free</span> : <span>${course.price}</span>}
                </div>
                <Button onClick={handleEnroll} loading={enrolling} className="w-full mb-3" size="lg">
                  {course.is_free ? 'Enroll Now' : 'Buy Now'}
                </Button>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Full lifetime access</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Certificate of completion</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Access on mobile & TV</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {course.modules && course.modules.length > 0 && (
        <section className="container mx-auto px-4 py-12 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
          <div className="space-y-3">
            {course.modules.map((m, idx) => (
              <div key={m.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => setActiveModule(activeModule === idx ? -1 : idx)}
                  className="w-full px-5 py-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div className="text-left">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-gray-500">{m.lessons.length} lessons</p>
                  </div>
                  <span className="text-2xl text-gray-400">{activeModule === idx ? '−' : '+'}</span>
                </button>
                {activeModule === idx && (
                  <ul className="border-t">
                    {m.lessons.map((l) => (
                      <li key={l.id} className="px-5 py-3 flex items-center gap-3 text-sm text-gray-700 border-b last:border-0">
                        {l.type === 'video' && <PlayCircle size={16} className="text-indigo-600" />}
                        {l.type === 'pdf' && <FileText size={16} className="text-orange-500" />}
                        <span className="flex-1">{l.title}</span>
                        <span className="text-gray-400 text-xs">{l.duration_minutes}m</span>
                        {l.is_preview ? (
                          <span className="text-xs text-indigo-600 font-semibold">Preview</span>
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