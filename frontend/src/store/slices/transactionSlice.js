import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

export const fetchMyTransactions = createAsyncThunk('transactions/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get('/transactions/my');
    return data.transactions;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

const txnSlice = createSlice({
  name: 'transactions',
  initialState: { transactions: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTransactions.pending, s => { s.loading = true; })
      .addCase(fetchMyTransactions.fulfilled, (s, a) => { s.loading = false; s.transactions = a.payload; })
      .addCase(fetchMyTransactions.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export default txnSlice.reducer;
