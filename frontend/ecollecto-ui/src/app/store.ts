import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../features/auth/authSlice';
import { collectionReducer } from '../features/collection/collectionSlice';
import { wishlistReducer } from '../features/wishlist/wishlistSlice';
import { favoritesReducer } from '../features/favorites/favoritesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    collection: collectionReducer,
    wishlist: wishlistReducer,
    favorites: favoritesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

