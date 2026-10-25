import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchProperties = createAsyncThunk('listings/fetchProperties', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/properties', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const listingsSlice = createSlice({
  name: 'listings',
  initialState: { items: [], pagination: null, loading: false, error: null },
  reducers: { clearListings(state) { state.items = []; state.pagination = null; state.error = null; } },
  extraReducers(builder) {
    builder.addCase(fetchProperties.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchProperties.fulfilled, (state, action) => { state.loading = false; state.items = action.payload.data || []; state.pagination = action.payload.pagination || null; });
    builder.addCase(fetchProperties.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Unable to load stays.'; });
  },
});

export const { clearListings } = listingsSlice.actions;
export default listingsSlice.reducer;
