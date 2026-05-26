import { useSelector } from 'react-redux';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import type { RootState } from '../../../app/store';

export function useAuth() {
  const oidcAuth = useOidcAuth();
  const { user, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || oidcAuth.isLoading,
    signIn: () => oidcAuth.signinRedirect(),
    signOut: () => oidcAuth.signoutRedirect(),
    getAccessToken: () => oidcAuth.user?.access_token ?? null,
  };
}

