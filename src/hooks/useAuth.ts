'use client';

import type { User } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/types';
import { UserRole } from '@/types';

type ProfileRow = {
  id: string;
  nama_lengkap: string;
  role: Profile['role'];
  sekolah_id: string | null;
  kelas: string | null;
  avatar_url: string | null;
  created_at: string;
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, role, sekolah_id, kelas, avatar_url, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as ProfileRow;
  return {
    ...row,
    auth_uid: row.id,
  };
}

async function syncAuthUser(user: User | null) {
  const { setUser, setProfile, setLoading, reset } = useAuthStore.getState();

  if (!user) {
    reset();
    return;
  }

  setUser(user);
  const profile = await fetchProfile(user.id);
  setProfile(profile);
  setLoading(false);
}

/** Dipanggil sekali dari AuthProvider untuk listener Supabase Auth. */
export function useAuthListener() {
  useEffect(() => {
    const supabase = createClient();

    const bootstrap = async () => {
      useAuthStore.getState().setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await syncAuthUser(user);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAuthUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}

/** Akses state auth global (Zustand). */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isLoading = useAuthStore((state) => state.isLoading);

  return { user, profile, isLoading };
}

export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  return { user, profile };
}

export function useIsSiswa(): boolean {
  const role = useAuthStore((state) => state.profile?.role);
  return role === UserRole.Siswa;
}

export function useIsGuru(): boolean {
  const role = useAuthStore((state) => state.profile?.role);
  return role === UserRole.Guru || role === UserRole.TutorSebaya;
}

export function useIsAdmin(): boolean {
  const role = useAuthStore((state) => state.profile?.role);
  return role === UserRole.SuperAdmin;
}
