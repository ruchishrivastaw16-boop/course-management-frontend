import { Link } from 'react-router-dom';
import { Star, Clock, Users, BookOpen } from 'lucide-react';
import type { Course } from '../../types';

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group"
    >
      <div className="relative overflow-hidden h-44">
        <img
          src={course.thumbnail || 'https://via.placeholder.com/400x300'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-3 right-3 bg-white text-xs font-bold px-2 py-1 rounded-full">
          {course.is_free ? 'FREE' : `$${course.price}`}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-indigo-600">{course.category}</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{course.level}</span>
        </div>

        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-indigo-600 transition">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 mb-3">By {course.instructor_name}</p>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Star size={13} className="text-yellow-500 fill-yellow-500" /> {course.rating}</span>
          <span className="flex items-center gap-1"><Clock size={13} /> {course.duration_hours}h</span>
          <span className="flex items-center gap-1"><Users size={13} /> {course.students_count}</span>
          <span className="flex items-center gap-1"><BookOpen size={13} /> {course.lessons_count}</span>
        </div>
      </div>
    </Link>
  );
}