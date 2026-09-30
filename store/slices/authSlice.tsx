import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { storage } from '../../utils/storage';
import { dummyUsers } from '../../src/data/users';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: storage.getUser(),
  token: storage.getToken(),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoading = false;
      storage.setToken(action.payload.token);
      storage.setUser(action.payload.user);
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      storage.clearToken();
    },
    registerSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      storage.setToken(action.payload.token);
      storage.setUser(action.payload.user);
    },
  },
});

const { loginStart, loginSuccess, loginFailure, registerSuccess, logout } = authSlice.actions;

// Simulated login using dummy data
export const loginUser = (email: string, password: string) => (dispatch: any) => {
  dispatch(loginStart());
  setTimeout(() => {
    const found = dummyUsers.find((u) => u.email === email && u.password === password);
    if (found) {
      const { password: _pw, ...user } = found;
      dispatch(loginSuccess({ user, token: 'dummy-token-' + user.id }));
    } else {
      dispatch(loginFailure('Invalid email or password'));
    }
  }, 600);
};

// Simulated register
export const registerUser = (name: string, email: string, role: 'student' | 'instructor') => (dispatch: any) => {
  dispatch(loginStart());
  setTimeout(() => {
    const user: User = { id: Date.now().toString(), name, email, role };
    dispatch(registerSuccess({ user, token: 'dummy-token-' + user.id }));
  }, 600);
};

export { logout };
export default authSlice.reducer;