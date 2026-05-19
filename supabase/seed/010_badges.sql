-- AIjarin Phase 2.10: badge & achievement definitions

INSERT INTO badges (kode, nama, deskripsi, trigger_type, trigger_value)
VALUES
  (
    'REKRUT_PERTAMA',
    'Rekrut Pertama',
    'Selesaikan misi pertamamu!',
    'misi_selesai',
    '{"count": 1}'::jsonb
  ),
  (
    'STREAK_3',
    'Pantang Menyerah',
    'Belajar 3 hari berturut-turut!',
    'streak',
    '{"days": 3}'::jsonb
  ),
  (
    'STREAK_7',
    'Dedikasi Tinggi',
    'Belajar 7 hari berturut-turut!',
    'streak',
    '{"days": 7}'::jsonb
  ),
  (
    'STREAK_30',
    'Legenda SIGMA',
    'Belajar 30 hari berturut-turut!',
    'streak',
    '{"days": 30}'::jsonb
  ),
  (
    'LEVEL_1_CLEAR',
    'Lulus Pelatihan',
    'Selesaikan semua misi Level 1!',
    'level_clear',
    '{"level": 1}'::jsonb
  ),
  (
    'LEVEL_7_CLEAR',
    'Direktur Sejati',
    'Kuasai semua 7 level SIGMA!',
    'level_clear',
    '{"level": 7}'::jsonb
  ),
  (
    'XP_100',
    'Pejuang Algoritma',
    'Kumpulkan 100 XP!',
    'xp_milestone',
    '{"xp": 100}'::jsonb
  ),
  (
    'XP_500',
    'Agen Handal',
    'Kumpulkan 500 XP!',
    'xp_milestone',
    '{"xp": 500}'::jsonb
  ),
  (
    'XP_1000',
    'Pakar SIGMA',
    'Kumpulkan 1000 XP!',
    'xp_milestone',
    '{"xp": 1000}'::jsonb
  ),
  (
    'NGAIN_TINGGI',
    'Lompatan Besar',
    'Raih N-Gain kategori Tinggi di satu level!',
    'ngain',
    '{"kategori": "tinggi"}'::jsonb
  ),
  (
    'TANPA_CHATBOT',
    'Mandiri Sejati',
    'Selesaikan seluruh level tanpa bantuan AI Tutor!',
    'chatbot_free',
    '{}'::jsonb
  ),
  (
    'BOSS_KILLER',
    'Penakluk Boss',
    'Kalahkan 3 Boss Challenge!',
    'boss',
    '{"count": 3}'::jsonb
  ),
  (
    'JAWABAN_SEMPURNA',
    'Tanpa Cela',
    'Jawab 10 soal berturut-turut dengan benar!',
    'perfect_streak',
    '{"count": 10}'::jsonb
  )
ON CONFLICT (kode) DO UPDATE
SET
  nama = EXCLUDED.nama,
  deskripsi = EXCLUDED.deskripsi,
  trigger_type = EXCLUDED.trigger_type,
  trigger_value = EXCLUDED.trigger_value,
  is_active = true;
