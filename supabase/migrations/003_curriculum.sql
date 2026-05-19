-- AIjarin Phase 1.3: curriculum hierarchy (levels → misi → soal)

CREATE TABLE levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor INTEGER UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  tema TEXT NOT NULL,
  deskripsi TEXT,
  cerita_intro TEXT,
  prerequisite_level_id UUID REFERENCES levels(id),
  xp_threshold INTEGER DEFAULT 0,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE misi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  urutan INTEGER NOT NULL,
  nama TEXT NOT NULL,
  tipe misi_type NOT NULL,
  konten_json JSONB NOT NULL DEFAULT '{}',
  xp_reward INTEGER DEFAULT 10,
  time_limit_seconds INTEGER,
  is_boss_challenge BOOLEAN DEFAULT false,
  is_assessment BOOLEAN DEFAULT false,
  cerita_cutscene TEXT,
  UNIQUE(level_id, urutan)
);

CREATE TABLE soal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  misi_id UUID NOT NULL REFERENCES misi(id) ON DELETE CASCADE,
  urutan INTEGER NOT NULL,
  tipe TEXT NOT NULL,
  pertanyaan TEXT NOT NULL,
  pilihan_json JSONB,
  jawaban_benar JSONB NOT NULL,
  penjelasan TEXT,
  xp_per_soal INTEGER DEFAULT 5,
  UNIQUE(misi_id, urutan)
);

CREATE INDEX idx_misi_level_id ON misi(level_id);
CREATE INDEX idx_soal_misi_id ON soal(misi_id);
