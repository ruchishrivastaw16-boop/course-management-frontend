import api from './api';   // ✅ Fixed
import type { Course, Module, Lesson } from '../types/index';

const courseService = {
  // 🌐 Public
  getAll: async (params?: {
    category?: string;
    level?: string;
    search?: string;
  }): Promise<Course[]> => {
    const { data } = await api.get<Course[]>('/courses/', { params });
    return data;
  },

  getBySlug: async (slug: string): Promise<Course & { modules: Module[] }> => {
    const { data } = await api.get(`/courses/${slug}`);
    return data;
  },

  // 👨‍🏫 Instructor
  getMyCourses: async (): Promise<Course[]> => {
    const { data } = await api.get<Course[]>('/instructor/courses/my-courses');
    return data;
  },

  createCourse: async (payload: Partial<Course>): Promise<Course> => {
    const { data } = await api.post<Course>('/instructor/courses/', payload);
    return data;
  },

  updateCourse: async (
    courseId: number,
    payload: Partial<Course>
  ): Promise<Course> => {
    const { data } = await api.put<Course>(
      `/instructor/courses/${courseId}`,
      payload
    );
    return data;
  },

  deleteCourse: async (courseId: number): Promise<void> => {
    await api.delete(`/instructor/courses/${courseId}`);
  },

  addModule: async (
    courseId: number,
    payload: { title: string; description?: string; order_index?: number }
  ): Promise<Module> => {
    const { data } = await api.post<Module>(
      `/instructor/courses/${courseId}/modules`,
      payload
    );
    return data;
  },

  addLesson: async (
    moduleId: number,
    payload: Partial<Lesson>
  ): Promise<Lesson> => {
    const { data } = await api.post<Lesson>(
      `/instructor/courses/modules/${moduleId}/lessons`,
      payload
    );
    return data;
  },

  // 🛡️ Admin
  getPendingCourses: async (): Promise<Course[]> => {
    const { data } = await api.get<Course[]>('/admin/courses/pending');
    return data;
  },

  approveCourse: async (courseId: number): Promise<Course> => {
    const { data } = await api.post<Course>(
      `/admin/courses/${courseId}/approve`
    );
    return data;
  },

  rejectCourse: async (courseId: number): Promise<Course> => {
    const { data } = await api.post<Course>(
      `/admin/courses/${courseId}/reject`
    );
    return data;
  },
};

export default courseService;