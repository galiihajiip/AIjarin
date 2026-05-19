-- AIjarin Phase 1.4: gamification — stats, progress, badges, leaderboard

CREATE TABLE siswa_stats (
  siswa_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  total_misi_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE siswa_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  misi_id UUID NOT NULL REFERENCES misi(id) ON DELETE CASCADE,
  status misi_status DEFAULT 'locked',
  xp_earned INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  best_score NUMERIC(5,2),
  time_spent_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(siswa_id, misi_id)
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  icon_url TEXT,
  trigger_type TEXT NOT NULL,
  trigger_value JSONB,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE siswa_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siswa_id, badge_id)
);

CREATE TABLE leaderboard_cache (
  siswa_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  sekolah_id UUID REFERENCES sekolah(id),
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_siswa_progress_siswa ON siswa_progress(siswa_id);
CREATE INDEX idx_siswa_progress_misi ON siswa_progress(misi_id);
CREATE INDEX idx_leaderboard_sekolah ON leaderboard_cache(sekolah_id, total_xp DESC);
