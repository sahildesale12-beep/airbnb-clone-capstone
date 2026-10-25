import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchMyBookings = createAsyncThunk('bookings/fetchMyBookings', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/bookings/my'); return data.data || []; }
  catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: { items: [], loading: false, error: null },
  reducers: { clearBookings(state) { state.items = []; state.error = null; } },
  extraReducers(builder) {
    builder.addCase(fetchMyBookings.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchMyBookings.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    builder.addCase(fetchMyBookings.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Unable to load bookings.'; });
  },
});
export const { clearBookings } = bookingsSlice.actions;
export default bookingsSlice.reducer;
