import { apiFetch } from './apiClient';
import type { components } from '../../features/product/types/api.generated';

type DesignerDto      = components['schemas']['DesignerDto'];
type FirstDayCoverDto = components['schemas']['FirstDayCoverDto'];
type TariffsDto       = components['schemas']['TariffsDto'];

/* ── Designers ── */
export const fetchDesigners = (signal?: AbortSignal) =>
  apiFetch<DesignerDto[]>('/api/designers', { signal });

export const fetchDesignerById = (id: string, signal?: AbortSignal) =>
  apiFetch<DesignerDto>(`/api/designer/${id}`, { signal });

/* ── First Day Covers ── */
export const fetchFirstDayCovers = (signal?: AbortSignal) =>
  apiFetch<FirstDayCoverDto[]>('/api/first-day-covers', { signal });

export const fetchFirstDayCoverById = (id: string, signal?: AbortSignal) =>
  apiFetch<FirstDayCoverDto>(`/api/first-day-covers/${id}`, { signal });

/* ── Tariffs ── */
export const fetchTariffs = (signal?: AbortSignal) =>
  apiFetch<TariffsDto[]>('/api/tariffs', { signal });

