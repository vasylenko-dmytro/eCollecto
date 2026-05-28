import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  fetchWishlist as apiFetchWishlist,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
} from '../../shared/api/userApi';
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async () => {
    const items = await apiFetchWishlist();
    return items.map((i) => i.stampId as string);
  }
);
export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (stampId: string) => {
    await apiAddToWishlist(stampId);
    return stampId;
  }
);
export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (stampId: string) => {
    await apiRemoveFromWishlist(stampId);
    return stampId;
  }
);
interface WishlistState {
  stampIds: string[];
  status: 'idle' | 'loading' | 'error';
}
const initialState: WishlistState = { stampIds: [], status: 'idle' };
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    resetWishlist: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.stampIds = action.payload;
        state.status = 'idle';
      })
      .addCase(fetchWishlist.rejected, (state) => { state.status = 'error'; })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        if (!state.stampIds.includes(action.payload)) state.stampIds.push(action.payload);
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.stampIds = state.stampIds.filter((id) => id !== action.payload);
      });
  },
});
export const { resetWishlist } = wishlistSlice.actions;
export const wishlistReducer = wishlistSlice.reducer;
