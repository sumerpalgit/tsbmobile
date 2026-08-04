import { useQuery } from '@tanstack/react-query';
import { getProfileCompletion } from '../api/profile';
import { PROFILE_COMPLETION_QUERY_KEY } from '../api/queryKeys';
import { useAuth } from '../store/AuthContext';

export function useProfileCompletion() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: PROFILE_COMPLETION_QUERY_KEY,
    queryFn: getProfileCompletion,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
