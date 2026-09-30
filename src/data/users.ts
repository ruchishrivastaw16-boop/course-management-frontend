import type { User } from '../../types';

export const dummyUsers: (User & { password: string })[] = [
  { id: '1', name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'admin' },
  { id: '2', name: 'John Instructor', email: 'instructor@demo.com', password: 'inst123', role: 'instructor' },
  { id: '3', name: 'Jane Student', email: 'student@demo.com', password: 'stud123', role: 'student' },
];