import { useAuth } from '../auth/AuthContext';

export function useUser() {
  const { user, checking } = useAuth();
  return { user, loading: checking };
}
