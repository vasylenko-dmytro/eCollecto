import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadUserProfile } from './authThunks';

interface AuthUser {
  sub: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadUserProfile.fulfilled, (state, action) => {
      if (state.user) {
        state.user.name  = action.payload.name;
        state.user.email = action.payload.email;
      }
    });
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export const authReducer = authSlice.reducer;
