import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { Profile } from '@/types';

type AuthStoreState = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
};

type AuthStoreActions = {
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
};

export type AuthStore = AuthStoreState & AuthStoreActions;

const initialState: AuthStoreState = {
  user: null,
  profile: null,
  isLoading: true,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, profile: null, isLoading: false }),
}));
