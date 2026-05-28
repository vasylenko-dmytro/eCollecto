import { apiFetch } from './apiClient';
import type { components } from '../../features/product/types/api.generated';

type StampDto = components['schemas']['StampDto'];
type YearSummaryDto = components['schemas']['YearSummaryDto'];

export const fetchAllStamps = (signal?: AbortSignal) =>
  apiFetch<StampDto[]>('/api/stamps', { signal });

export const fetchStampsByYear = (year: number, signal?: AbortSignal) =>
  apiFetch<StampDto[]>(`/api/stamps?year=${year}`, { signal });

export const fetchStampById = (id: string, signal?: AbortSignal) =>
  apiFetch<StampDto>(`/api/stamp/${id}`, { signal });

export const fetchStampYears = (signal?: AbortSignal) =>
  apiFetch<YearSummaryDto[]>('/api/stamps/years', { signal });


