import { useAuthStore } from '../store/auth';

export const useSession = () => {
  const { profile, token, setAuth, clear } = useAuthStore();
  return { profile, token, setAuth, clear };
};
