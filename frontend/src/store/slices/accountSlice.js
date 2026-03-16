import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

export const fetchMyAccounts = createAsyncThunk('accounts/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get('/accounts/my');
    return data.accounts;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch accounts');
  }
});

const accountSlice = createSlice({
  name: 'accounts',
  initialState: { accounts: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAccounts.pending, s => { s.loading = true; })
      .addCase(fetchMyAccounts.fulfilled, (s, a) => { s.loading = false; s.accounts = a.payload; })
      .addCase(fetchMyAccounts.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export default accountSlice.reducer;
