-- AIjarin Phase 1.5: assessments, N-Gain analytics, AI logs, surveys, time-on-task

CREATE TABLE pretest_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES profiles(id),
  level_id UUID NOT NULL REFERENCES levels(id),
  skor NUMERIC(5,2) NOT NULL,
  jawaban_json JSONB,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siswa_id, level_id)
);

CREATE TABLE posttest_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES profiles(id),
  level_id UUID NOT NULL REFERENCES levels(id),
  skor NUMERIC(5,2) NOT NULL,
  jawaban_json JSONB,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ngain_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES profiles(id),
  level_id UUID NOT NULL REFERENCES levels(id),
  skor_pretest NUMERIC(5,2),
  skor_posttest NUMERIC(5,2),
  ngain NUMERIC(5,4),
  kategori ngain_category,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siswa_id, level_id)
);

CREATE TABLE chatbot_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES profiles(id),
  misi_id UUID REFERENCES misi(id),
  pesan_siswa TEXT NOT NULL,
  respons_ai TEXT NOT NULL,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE adaptive_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES profiles(id),
  weak_concept TEXT NOT NULL,
  recommended_misi_id UUID REFERENCES misi(id),
  reason TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES profiles(id),
  survey_type TEXT NOT NULL,
  level_id UUID REFERENCES levels(id),
  responses_json JSONB NOT NULL,
  anxiety_index NUMERIC(3,2),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE time_on_task (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES profiles(id),
  misi_id UUID NOT NULL REFERENCES misi(id),
  durasi_detik INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chatbot_siswa ON chatbot_logs(siswa_id, created_at DESC);
CREATE INDEX idx_ngain_level ON ngain_scores(level_id);
CREATE INDEX idx_adaptive_siswa ON adaptive_recommendations(siswa_id, is_completed);
