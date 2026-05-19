export type UserRole = "siswa" | "guru" | "admin";

export interface Profile {
  id: string;
  auth_uid: string;
  nama_lengkap: string;
  role: UserRole;
  sekolah_id: string | null;
  kelas: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type MisiStatus = "locked" | "in_progress" | "completed";

export interface SiswaProgress {
  id: string;
  siswa_id: string;
  level_id: string;
  misi_id: string;
  status: MisiStatus;
  xp_earned: number;
  attempts: number;
  completed_at: string | null;
}
