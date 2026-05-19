-- AIjarin Phase 2.2: 7 SIGMA storyline levels (Bahasa Indonesia)

INSERT INTO levels (id, nomor, nama, tema, deskripsi, cerita_intro, prerequisite_level_id)
VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    1,
    'Rekrut SIGMA',
    'Pelatihan Dasar',
    'Kamu baru saja bergabung dengan Agen SIGMA! Sekarang saatnya belajar dasar-dasar algoritma.',
    'Selamat datang, Agen baru! Nama kamu ada di daftar kami. Dunia digital membutuhkan kamu. Tapi pertama-tama, kamu harus menyelesaikan pelatihan dasar. Direktur SIGMA menunggumu di Pusat Pelatihan.',
    NULL
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    2,
    'Analis Data',
    'Gudang Informasi Rahasia',
    'Misi kamu: masuk ke Gudang Data dan pahami cara kerja variabel.',
    'ERROR-X berhasil menyembunyikan data penting di dalam gudang terenkripsi. Untuk membukanya, kamu harus menguasai seni penyimpanan informasi — variabel!',
    '00000000-0000-0000-0001-000000000001'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    3,
    'Detektif Logika',
    'Markas Rahasia di Bawah Tanah',
    'Logika kondisional adalah senjata utama seorang detektif. Pelajari IF dan ELSE!',
    'Seseorang membocorkan rahasia SIGMA. Kamu harus menyelidiki. Gunakan logika kondisional untuk memilah fakta dari kebohongan.',
    '00000000-0000-0000-0001-000000000002'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    4,
    'Komandan Sistem',
    'Server Pusat Operasi',
    'Otomatisasi tugas berulang dengan perulangan (loops). Efisiensi adalah kunci!',
    'Server pusat membutuhkan pemeliharaan — jutaan baris data harus diperiksa satu per satu. Atau... kamu bisa menggunakan loops untuk melakukannya secara otomatis!',
    '00000000-0000-0000-0001-000000000003'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    5,
    'Insinyur AI',
    'Laboratorium Kecerdasan Buatan',
    'Buat fungsi yang bisa dipanggil berulang kali. Ini fondasi dari semua program besar!',
    'Lab rahasia SIGMA menyimpan prototype AI. Untuk mengaktifkannya, kamu harus memahami fungsi — blok kode yang bisa dipanggil kapan saja.',
    '00000000-0000-0000-0001-000000000004'
  ),
  (
    '00000000-0000-0000-0001-000000000006',
    6,
    'Agen Senior',
    'Operasi Lapangan: Data Massal',
    'Kelola banyak data sekaligus dengan array dan struktur data.',
    'Operasi besar sedang berlangsung. Kamu harus melacak 50 agen sekaligus. Array adalah jawabannya!',
    '00000000-0000-0000-0001-000000000005'
  ),
  (
    '00000000-0000-0000-0001-000000000007',
    7,
    'Direktur SIGMA',
    'Markas Komando Pusat',
    'Kuasai cara berkomunikasi dengan AI. Prompting yang baik adalah kekuatan super!',
    'Saatnya menghadapi ERROR-X secara langsung! Senjata terakhirmu adalah kemampuan berkomunikasi dengan AI. Tulis prompt yang tepat dan selamatkan dunia digital!',
    '00000000-0000-0000-0001-000000000006'
  )
ON CONFLICT (id) DO UPDATE
SET
  nomor = EXCLUDED.nomor,
  nama = EXCLUDED.nama,
  tema = EXCLUDED.tema,
  deskripsi = EXCLUDED.deskripsi,
  cerita_intro = EXCLUDED.cerita_intro,
  prerequisite_level_id = EXCLUDED.prerequisite_level_id,
  is_active = true;
