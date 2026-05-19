-- AIjarin Phase 2.1: pilot sekolah (SMA Negeri 20 Surabaya)

INSERT INTO sekolah (id, nama, kota, npsn)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SMA Negeri 20 Surabaya',
  'Surabaya',
  '20532118'
)
ON CONFLICT (id) DO UPDATE
SET
  nama = EXCLUDED.nama,
  kota = EXCLUDED.kota,
  npsn = EXCLUDED.npsn,
  is_active = true;

-- Note: Admin user must be created via Supabase Auth dashboard or API
-- Then run:
-- UPDATE profiles
-- SET role = 'super_admin', sekolah_id = '00000000-0000-0000-0000-000000000001'
-- WHERE id = '<admin-auth-id>';
