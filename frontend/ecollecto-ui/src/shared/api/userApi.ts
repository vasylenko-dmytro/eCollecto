import { apiFetch } from './apiClient';
import type { components } from '../../features/product/types/api.generated';

type UserDto = components['schemas']['UserDto'];
type CollectionItemDto = components['schemas']['CollectionItemDto'];
type WishlistItemDto = components['schemas']['WishlistItemDto'];
type FavoriteItemDto = components['schemas']['FavoriteItemDto'];

/* ── User profile ── */
export const fetchUserProfile = (signal?: AbortSignal) =>
  apiFetch<UserDto>('/api/me', { signal });

/* ── Collection ── */
export const fetchCollection = (signal?: AbortSignal) =>
  apiFetch<CollectionItemDto[]>('/api/me/collection', { signal });

export const addToCollection = (stampId: string, signal?: AbortSignal) =>
  apiFetch<void>('/api/me/collection/items', {
    method: 'POST',
    body: JSON.stringify({ stampId }),
    signal,
  });

export const removeFromCollection = (stampId: string, signal?: AbortSignal) =>
  apiFetch<void>(`/api/me/collection/items/${stampId}`, {
    method: 'DELETE',
    signal,
  });

/* ── Wishlist ── */
export const fetchWishlist = (signal?: AbortSignal) =>
  apiFetch<WishlistItemDto[]>('/api/me/wishlist', { signal });

export const addToWishlist = (stampId: string, signal?: AbortSignal) =>
  apiFetch<void>('/api/me/wishlist/items', {
    method: 'POST',
    body: JSON.stringify({ stampId }),
    signal,
  });

export const removeFromWishlist = (stampId: string, signal?: AbortSignal) =>
  apiFetch<void>(`/api/me/wishlist/items/${stampId}`, {
    method: 'DELETE',
    signal,
  });

/* ── Favorites ── */
export const fetchFavorites = (signal?: AbortSignal) =>
  apiFetch<FavoriteItemDto[]>('/api/me/favorites', { signal });

export const addToFavorites = (stampId: string, signal?: AbortSignal) =>
  apiFetch<void>('/api/me/favorites/items', {
    method: 'POST',
    body: JSON.stringify({ stampId }),
    signal,
  });

export const removeFromFavorites = (stampId: string, signal?: AbortSignal) =>
  apiFetch<void>(`/api/me/favorites/items/${stampId}`, {
    method: 'DELETE',
    signal,
  });

