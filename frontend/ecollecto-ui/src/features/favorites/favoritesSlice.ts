import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  fetchFavorites as apiFetchFavorites,
  addToFavorites as apiAddToFavorites,
  removeFromFavorites as apiRemoveFromFavorites,
} from '../../shared/api/userApi';
export const fetchFavorites = createAsyncThunk(
  'favorites/fetch',
  async () => {
    const items = await apiFetchFavorites();
    return items.map((i) => i.stampId as string);
  }
);
export const addToFavorites = createAsyncThunk(
  'favorites/add',
  async (stampId: string) => {
    await apiAddToFavorites(stampId);
    return stampId;
  }
);
export const removeFromFavorites = createAsyncThunk(
  'favorites/remove',
  async (stampId: string) => {
    await apiRemoveFromFavorites(stampId);
    return stampId;
  }
);
interface FavoritesState {
  stampIds: string[];
  status: 'idle' | 'loading' | 'error';
}
const initialState: FavoritesState = { stampIds: [], status: 'idle' };
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    resetFavorites: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.stampIds = action.payload;
        state.status = 'idle';
      })
      .addCase(fetchFavorites.rejected, (state) => { state.status = 'error'; })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        if (!state.stampIds.includes(action.payload)) state.stampIds.push(action.payload);
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        state.stampIds = state.stampIds.filter((id) => id !== action.payload);
      });
  },
});
export const { resetFavorites } = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
