import api from './api';
import type { User } from '../types/index';

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  register: async (payload: {
    full_name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>('/users/me');
    return data;
  },
};

export default authService;