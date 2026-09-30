import type { Assignment } from '../../types';

export const dummyAssignments: Assignment[] = [
  { id: 'a1', courseId: '1', title: 'Build a Todo App', dueDate: '2025-02-15', maxScore: 100, status: 'pending' },
  { id: 'a2', courseId: '1', title: 'Custom Hooks Challenge', dueDate: '2025-02-22', maxScore: 100, status: 'submitted' },
  { id: 'a3', courseId: '2', title: 'Python Basics Quiz', dueDate: '2025-02-10', maxScore: 50, status: 'graded', grade: 45 },
  { id: 'a4', courseId: '3', title: 'Design a Landing Page', dueDate: '2025-03-01', maxScore: 100, status: 'pending' },
];