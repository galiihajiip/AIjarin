-- AIjarin Phase 2.11: anxiety & acceptance survey templates

CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode TEXT UNIQUE NOT NULL,
  judul TEXT NOT NULL,
  pertanyaan_json JSONB NOT NULL,
  trigger_point TEXT NOT NULL
);

INSERT INTO survey_templates (kode, judul, pertanyaan_json, trigger_point)
VALUES
  (
    'PRE_ANXIETY',
    'Bagaimana Perasaanmu tentang Komputer?',
    '[
      {"id": 1, "pernyataan": "Saya merasa takut ketika harus belajar komputer.", "skala": 5},
      {"id": 2, "pernyataan": "Saya yakin bisa memahami logika pemrograman.", "skala": 5},
      {"id": 3, "pernyataan": "Belajar komputasi terasa menyenangkan bagi saya.", "skala": 5},
      {"id": 4, "pernyataan": "Saya khawatir membuat kesalahan saat coding.", "skala": 5},
      {"id": 5, "pernyataan": "Saya merasa percaya diri menggunakan teknologi.", "skala": 5}
    ]'::jsonb,
    'before_level_1'
  ),
  (
    'POST_ANXIETY',
    'Bagaimana Perasaanmu Sekarang?',
    '[
      {"id": 1, "pernyataan": "Setelah belajar di AIjarin, saya lebih percaya diri dengan komputer.", "skala": 5},
      {"id": 2, "pernyataan": "Saya merasa AIjarin membuat belajar lebih menyenangkan.", "skala": 5},
      {"id": 3, "pernyataan": "Saya mau terus belajar logika komputasi.", "skala": 5},
      {"id": 4, "pernyataan": "Saya merasa bisa menyelesaikan masalah dengan logika.", "skala": 5},
      {"id": 5, "pernyataan": "Saya akan merekomendasikan AIjarin ke teman-teman.", "skala": 5}
    ]'::jsonb,
    'after_level_7'
  )
ON CONFLICT (kode) DO UPDATE
SET
  judul = EXCLUDED.judul,
  pertanyaan_json = EXCLUDED.pertanyaan_json,
  trigger_point = EXCLUDED.trigger_point;
