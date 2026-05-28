import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import { setUser, clearUser } from '../../features/auth/authSlice';
import { loadUserProfile } from '../../features/auth/authThunks';
import { fetchCollection, resetCollection } from '../../features/collection/collectionSlice';
import { fetchWishlist, resetWishlist } from '../../features/wishlist/wishlistSlice';
import { fetchFavorites, resetFavorites } from '../../features/favorites/favoritesSlice';
import type { AppDispatch } from '../store';

const oidcConfig = {
  authority: import.meta.env.VITE_KEYCLOAK_URL + '/realms/' + import.meta.env.VITE_KEYCLOAK_REALM,
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid profile email',
  automaticSilentRenew: true,
};

// Syncs OIDC user → Redux store
function AuthSync({ children }: { children: React.ReactNode }) {
  const oidcAuth = useOidcAuth();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (oidcAuth.isAuthenticated && oidcAuth.user) {
      const profile = oidcAuth.user.profile;
      const realmAccess = (profile as Record<string, unknown>)['realm_access'] as
        { roles?: string[] } | undefined;
      dispatch(setUser({
        sub:   profile.sub ?? '',
        email: profile.email ?? '',
        name:  profile.name ?? '',
        roles: realmAccess?.roles ?? [],
      }));
      dispatch(loadUserProfile());
      dispatch(fetchCollection());
      dispatch(fetchWishlist());
      dispatch(fetchFavorites());
    } else if (!oidcAuth.isLoading) {
      dispatch(clearUser());
      dispatch(resetCollection());
      dispatch(resetWishlist());
      dispatch(resetFavorites());
    }
  }, [oidcAuth.isAuthenticated, oidcAuth.isLoading, oidcAuth.user, dispatch]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <OidcAuthProvider {...oidcConfig}>
      <AuthSync>{children}</AuthSync>
    </OidcAuthProvider>
  );
}



