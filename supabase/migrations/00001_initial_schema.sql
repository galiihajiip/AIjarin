-- AIjarin Phase 0: core schema reference
-- Full RLS policies akan ditambahkan pada micro-block berikutnya

-- Extended user profile (links to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('siswa', 'guru', 'admin')),
  sekolah_id UUID,
  kelas TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Curriculum
CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor INT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  tema TEXT NOT NULL,
  deskripsi TEXT,
  prerequisite_level_id UUID REFERENCES levels(id),
  is_unlocked_default BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS misi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  urutan INT NOT NULL,
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL,
  konten_json JSONB NOT NULL DEFAULT '{}',
  xp_reward INT NOT NULL DEFAULT 10,
  time_limit_seconds INT
);

-- Gamification (siswa progress & stats)
CREATE TABLE IF NOT EXISTS siswa_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES levels(id),
  misi_id UUID NOT NULL REFERENCES misi(id),
  status TEXT NOT NULL CHECK (status IN ('locked', 'in_progress', 'completed')),
  xp_earned INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS siswa_stats (
  siswa_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INT NOT NULL DEFAULT 0,
  current_level INT NOT NULL DEFAULT 1,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active TIMESTAMPTZ
);
