import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/profile';
import { ME_QUERY_KEY } from '../api/queryKeys';
import { useAuth } from '../store/AuthContext';

export function useMe() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
