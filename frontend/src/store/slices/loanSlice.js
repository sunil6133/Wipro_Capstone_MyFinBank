import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

export const fetchMyLoans = createAsyncThunk('loans/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get('/loans/my');
    return data.loans;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

const loanSlice = createSlice({
  name: 'loans',
  initialState: { loans: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLoans.pending, s => { s.loading = true; })
      .addCase(fetchMyLoans.fulfilled, (s, a) => { s.loading = false; s.loans = a.payload; })
      .addCase(fetchMyLoans.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export default loanSlice.reducer;
