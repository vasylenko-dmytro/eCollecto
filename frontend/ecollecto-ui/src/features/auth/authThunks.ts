import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../shared/api/apiClient';

interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export const loadUserProfile = createAsyncThunk(
  'auth/loadProfile',
  async () => apiFetch<UserProfile>('/api/me')
);

