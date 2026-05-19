import { UserRole } from '@/types';

/** Rute dashboard utama berdasarkan peran pengguna. */
export function getDashboardPath(role: string): string {
  switch (role) {
    case UserRole.Guru:
      return '/guru/dashboard';
    case UserRole.SuperAdmin:
      return '/admin/dashboard';
    case UserRole.Siswa:
    case UserRole.TutorSebaya:
    default:
      return '/dashboard';
  }
}
