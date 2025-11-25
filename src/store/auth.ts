import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role, UserProfile } from '../types';

interface AuthState {
  profile?: UserProfile;
  token?: string;
  setAuth: (payload: { profile: UserProfile; token: string }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: undefined,
      token: undefined,
      setAuth: ({ profile, token }) => set({ profile, token }),
      clear: () => set({ profile: undefined, token: undefined }),
    }),
    {
      name: 'lubripass-auth',
    },
  ),
);

export const hasRole = (role: Role) => (useAuthStore.getState().profile?.role === role);
