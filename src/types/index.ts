/** Nilai JSON generik untuk kolom JSONB Supabase */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export enum UserRole {
  Siswa = 'siswa',
  Guru = 'guru',
  TutorSebaya = 'tutor_sebaya',
  SuperAdmin = 'super_admin',
}

export enum MisiType {
  DragDrop = 'drag_drop',
  FillBlank = 'fill_blank',
  MultipleChoice = 'multiple_choice',
  CodeTyping = 'code_typing',
  Project = 'project',
}

export enum MisiStatus {
  Locked = 'locked',
  Available = 'available',
  InProgress = 'in_progress',
  Completed = 'completed',
}

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

export interface SiswaStats {
  siswa_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_active: string | null;
}

export interface Level {
  id: string;
  nomor: number;
  nama: string;
  tema: string;
  deskripsi: string | null;
  prerequisite_level_id: string | null;
  is_unlocked_default: boolean;
}

export interface Misi {
  id: string;
  level_id: string;
  urutan: number;
  nama: string;
  tipe: MisiType;
  konten_json: JsonValue;
  xp_reward: number;
  time_limit_seconds: number | null;
}

export interface Soal {
  id: string;
  misi_id: string;
  tipe: MisiType;
  pertanyaan: string;
  pilihan_json: JsonValue | null;
  jawaban_benar: JsonValue;
  penjelasan: string | null;
}

export interface Badge {
  id: string;
  nama: string;
  deskripsi: string;
  icon_url: string | null;
  trigger_condition: JsonValue;
}

export interface SiswaBadge {
  siswa_id: string;
  badge_id: string;
  earned_at: string;
}

export interface PretestResult {
  id: string;
  siswa_id: string;
  level_id: string;
  skor: number;
  taken_at: string;
}

export interface PosttestResult {
  id: string;
  siswa_id: string;
  level_id: string;
  skor: number;
  taken_at: string;
}

export interface NGainScore {
  siswa_id: string;
  level_id: string;
  skor_pretest: number;
  skor_posttest: number;
  ngain: number;
  kategori: string;
}

export interface ChatbotLog {
  id: string;
  siswa_id: string;
  misi_id: string | null;
  pesan_siswa: string;
  respons_ai: string;
  tokens_used: number;
  created_at: string;
}

export interface AdaptiveRecommendation {
  id: string;
  siswa_id: string;
  weak_concept: string;
  recommended_misi_id: string;
  created_at: string;
  is_completed: boolean;
}

export interface SurveyResponse {
  id: string;
  siswa_id: string;
  survey_type: string;
  responses_json: JsonValue;
  submitted_at: string;
}
