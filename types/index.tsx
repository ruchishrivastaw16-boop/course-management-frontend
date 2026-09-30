export type Role = 'admin' | 'instructor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar?: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  isFree: boolean;
  rating: number;
  students: number;
  duration: number; // hours
  lessons: number;
  thumbnail: string;
  status: 'published' | 'pending' | 'draft';
  progress?: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  type: 'video' | 'pdf' | 'quiz';
  completed?: boolean;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;
  maxScore: number;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
}