import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  user: (() => {
    const stored = localStorage.getItem('cms_user');
    return stored ? JSON.parse(stored) : null;
  })(),
  token: localStorage.getItem('cms_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('cms_token', action.payload.token);
      localStorage.setItem('cms_user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('cms_token');
      localStorage.removeItem('cms_user');
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;