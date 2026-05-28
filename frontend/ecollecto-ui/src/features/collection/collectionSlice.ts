import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  fetchCollection as apiFetchCollection,
  addToCollection as apiAddToCollection,
  removeFromCollection as apiRemoveFromCollection,
} from '../../shared/api/userApi';

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchCollection = createAsyncThunk(
  'collection/fetch',
  async () => {
    const items = await apiFetchCollection();
    return items.map((i) => i.stampId as string);
  }
);

export const addToCollection = createAsyncThunk(
  'collection/add',
  async (stampId: string) => {
    await apiAddToCollection(stampId);
    return stampId;
  }
);

export const removeFromCollection = createAsyncThunk(
  'collection/remove',
  async (stampId: string) => {
    await apiRemoveFromCollection(stampId);
    return stampId;
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

interface CollectionState {
  stampIds: string[];
  status: 'idle' | 'loading' | 'error';
}

const initialState: CollectionState = {
  stampIds: [],
  status: 'idle',
};

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    resetCollection: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollection.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCollection.fulfilled, (state, action) => {
        state.stampIds = action.payload;
        state.status = 'idle';
      })
      .addCase(fetchCollection.rejected, (state) => {
        state.status = 'error';
      })
      .addCase(addToCollection.fulfilled, (state, action) => {
        if (!state.stampIds.includes(action.payload)) {
          state.stampIds.push(action.payload);
        }
      })
      .addCase(removeFromCollection.fulfilled, (state, action) => {
        state.stampIds = state.stampIds.filter((id) => id !== action.payload);
      });
  },
});

export const { resetCollection } = collectionSlice.actions;
export const collectionReducer = collectionSlice.reducer;

