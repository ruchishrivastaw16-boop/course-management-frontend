import { Link } from 'react-router-dom';
import { Search, BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import CourseCard from '../../components/course/CourseCard';
import Button from '../../components/common/Button';
import { useCourses } from '../../hooks/useCourses';
import Spinner from '../../components/common/Spinner';

export default function Home() {
  const { data: courses, isLoading } = useCourses();
  const featured = courses?.slice(0, 6) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Learn Anything, <span className="text-yellow-300">Anywhere</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 text-indigo-100">
            Thousands of courses from expert instructors. Learn at your own pace.
          </p>

          <div className="max-w-2xl mx-auto flex bg-white rounded-lg overflow-hidden shadow-2xl">
            <input
              placeholder="What do you want to learn?"
              className="flex-1 px-5 py-4 text-gray-800 outline-none"
            />
            <Button className="rounded-none px-8">
              <Search size={18} /> Search
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/courses"><Button variant="secondary">Browse Courses</Button></Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-10 border-b">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: BookOpen, label: 'Courses', value: `${courses?.length || 0}+` },
            { icon: Users, label: 'Students', value: '50K+' },
            { icon: Award, label: 'Instructors', value: '320+' },
            { icon: TrendingUp, label: 'Success Rate', value: '95%' },
          ].map((s) => (
            <div key={s.label}>
              <s.icon className="mx-auto text-indigo-600 mb-2" size={32} />
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Featured Courses</h2>
            <p className="text-gray-500">Hand-picked by our experts</p>
          </div>
          <Link to="/courses"><Button variant="outline">View All</Button></Link>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}