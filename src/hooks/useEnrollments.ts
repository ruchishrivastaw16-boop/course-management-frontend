import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import enrollmentService from '../services/enrollmentService';
import type { Enrollment } from '../types/index';

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentService.getMyEnrollments(),
  });
}

// 👨‍🏫 Instructor: get students for a course
export function useCourseStudents(courseId: number | null) {
  return useQuery({
    queryKey: ['course-students', courseId],
    queryFn: () => enrollmentService.getCourseStudents(courseId!),
    enabled: !!courseId,
  });
}
export function useAllMyStudents() {
  return useQuery({
    queryKey: ['all-my-students'],
    queryFn: () => enrollmentService.getAllMyStudents(),
  });
}

export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => enrollmentService.enroll(courseId),
    onSuccess: () => {
      toast.success('Enrolled successfully!');
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Enrollment failed');
    },
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, progress }: { enrollmentId: number; progress: number }) =>
      enrollmentService.updateProgress(enrollmentId, progress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });
}

export function useDropEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: number) => enrollmentService.drop(enrollmentId),
    onSuccess: () => {
      toast.success('Course dropped');
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });
}

export function useAllEnrollments() {
  return useQuery({
    queryKey: ['all-enrollments'],
    queryFn: () => enrollmentService.getAllEnrollments(),
  });
}