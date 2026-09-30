import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import CourseCard from '../../components/course/CourseCard';
import Spinner from '../../components/common/Spinner';
import { useCourses } from '../../hooks/useCourses';

export default function CourseCatalog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');

  const { data: courses, isLoading, error, refetch } = useCourses({
    search: search || undefined,
    category: category || undefined,
    level: level || undefined,
  });

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setLevel('');
  };

  const hasFilters = search || category || level;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Explore Courses</h1>
          <p className="text-sm text-gray-500 mb-4">
            {courses?.length || 0} courses available
          </p>

          {/* Search Bar */}
          <div className="flex bg-gray-100 rounded-lg overflow-hidden max-w-2xl">
            <Search className="text-gray-400 ml-4 self-center" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses by title..."
              className="flex-1 px-4 py-3 bg-transparent outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-4 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex gap-6">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white p-5 rounded-xl shadow-sm sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter size={16} /> Filters
              </h3>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Level Filter */}
            <div className="mb-5">
              <p className="text-sm font-medium mb-2">Level</p>
              <div className="space-y-2">
                {['', 'beginner', 'intermediate', 'advanced'].map((l) => (
                  <label key={l || 'all'} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="level"
                      value={l}
                      checked={level === l}
                      onChange={(e) => setLevel(e.target.value)}
                      className="text-indigo-600"
                    />
                    {l ? l.charAt(0).toUpperCase() + l.slice(1) : 'All Levels'}
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <p className="text-sm font-medium mb-2">Category</p>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Web Development"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </aside>

        {/* Course Grid */}
        <div className="flex-1">
          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-xl p-12">
              <Spinner />
              <p className="text-center text-gray-500 mt-4">Loading courses...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <p className="text-red-600 font-medium mb-2">Failed to load courses</p>
              <p className="text-sm text-red-500 mb-4">
                {(error as any)?.response?.data?.detail || 'Backend se connect nahi ho pa raha'}
              </p>
              <button
                onClick={() => refetch()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && courses && courses.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center">
              <p className="text-gray-500 mb-2">No courses found</p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Course Grid */}
          {!isLoading && !error && courses && courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}