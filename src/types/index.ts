export type Role = 'admin' | 'instructor' | 'student';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  status: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  category?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'archived';
  price: number;
  is_free: boolean;
  duration_hours: number;
  lessons_count: number;
  students_count: number;
  rating: number;
  thumbnail?: string;
  instructor_id: number;
  instructor_name?: string;
  created_at: string;
}

export interface CourseDetail extends Course {
  modules: Module[];
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  type: 'video' | 'pdf' | 'text' | 'quiz';
  content?: string;
  resource_url?: string;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
}

export interface Enrollment {
  id: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  course_id: number;
  course_title?: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  enrolled_at: string;
  completed_at?: string;
}

export interface Assignment {
  id: number;
  course_id: number;
  course_title?: string;
  title: string;
  description?: string;
  due_date: string;
  max_score: number;
  created_at: string;
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name?: string;
  file_url?: string;
  score?: number;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  submitted_at: string;
  graded_at?: string;
}