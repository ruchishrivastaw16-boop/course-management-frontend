import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import courseService from '../services/courseService';
import type { Course } from '../types/index';

export function useCourses(filters?: {
  category?: string;
  level?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => courseService.getAll(filters),
    staleTime: 5 * 60 * 1000,   // 5 minutes
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: ['course', slug],
    queryFn: () => courseService.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: ['my-courses'],
    queryFn: () => courseService.getMyCourses(),
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Course>) =>
      courseService.createCourse(payload),
    onSuccess: (data) => {
      toast.success(`Course "${data.title}" created!`);
      qc.invalidateQueries({ queryKey: ['my-courses'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create course');
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => courseService.deleteCourse(id),
    onSuccess: () => {
      toast.success('Course deleted');
      qc.invalidateQueries({ queryKey: ['my-courses'] });
    },
  });
}

export function usePendingCourses() {
  return useQuery({
    queryKey: ['pending-courses'],
    queryFn: () => courseService.getPendingCourses(),
  });
}

export function useApproveCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => courseService.approveCourse(id),
    onSuccess: () => {
      toast.success('Course approved');
      qc.invalidateQueries({ queryKey: ['pending-courses'] });
    },
  });
}