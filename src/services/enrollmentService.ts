import api from './api';
import type { Enrollment } from '../types/index';

const enrollmentService = {
  // 🎓 Student
  enroll: async (courseId: number): Promise<Enrollment> => {
    const { data } = await api.post<Enrollment>('/enrollments/', {
      course_id: courseId,
    });
    return data;
  },

  getMyEnrollments: async (): Promise<Enrollment[]> => {
    const { data } = await api.get<Enrollment[]>('/enrollments/my');
    return data;
  },

  updateProgress: async (
    enrollmentId: number,
    progress: number
  ): Promise<Enrollment> => {
    const { data } = await api.put<Enrollment>(
      `/enrollments/${enrollmentId}/progress`,
      { progress }
    );
    return data;
  },

  drop: async (enrollmentId: number): Promise<void> => {
    await api.delete(`/enrollments/${enrollmentId}`);
  },

  // 👨‍🏫 Instructor
 getCourseStudents: async (courseId: number) => {
  const { data } = await api.get(`/instructor/enrollments/course/${courseId}`);
  return data;
},

 getAllMyStudents: async () => {
  const { data } = await api.get('/instructor/enrollments/all-students');   // ✅ Ye sahi
  return data;
},

  // 🛡️ Admin
  getAllEnrollments: async (): Promise<Enrollment[]> => {
    const { data } = await api.get<Enrollment[]>('/admin/enrollments/');
    return data;
  },
};

export default enrollmentService;