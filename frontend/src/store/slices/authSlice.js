import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

export const loginCustomer = createAsyncThunk('auth/loginCustomer', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post('/auth/login', { email, password });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const loginAdmin = createAsyncThunk('auth/loginAdmin', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post('/auth/admin/login', { email, password });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const stored = (() => {
  try {
    const token = localStorage.getItem('myfin_token');
    const user = JSON.parse(localStorage.getItem('myfin_user'));
    if (isTokenValid(token) && user) {
      return { token, user };
    }
    localStorage.removeItem('myfin_token');
    localStorage.removeItem('myfin_user');
    return { token: null, user: null };
  } catch {
    localStorage.removeItem('myfin_token');
    localStorage.removeItem('myfin_user');
    return { token: null, user: null };
  }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: stored.token, user: stored.user, loading: false, error: null },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('myfin_token');
      localStorage.removeItem('myfin_user');
    },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    const handleLogin = (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('myfin_token', action.payload.token);
      localStorage.setItem('myfin_user', JSON.stringify(action.payload.user));
    };
    builder
      .addCase(loginCustomer.pending, s => { s.loading = true; s.error = null; })
      .addCase(loginCustomer.fulfilled, handleLogin)
      .addCase(loginCustomer.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(loginAdmin.pending, s => { s.loading = true; s.error = null; })
      .addCase(loginAdmin.fulfilled, handleLogin)
      .addCase(loginAdmin.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;