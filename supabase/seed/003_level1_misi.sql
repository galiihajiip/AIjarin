-- AIjarin Phase 2.3: Level 1 (Rekrut SIGMA) — pretest, 6 drag-drop misi, boss, posttest

INSERT INTO misi (
  id,
  level_id,
  urutan,
  nama,
  tipe,
  konten_json,
  xp_reward,
  is_boss_challenge,
  is_assessment,
  cerita_cutscene
)
VALUES
  (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    0,
    'Tes Awal: Seberapa Jauh Kamu Tahu?',
    'multiple_choice',
    '{"is_pretest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Sebelum memulai pelatihan, kami perlu tahu kemampuanmu saat ini. Jawab jujur ya!'
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0001-000000000001',
    1,
    'Misi 1: Urutan Perintah',
    'drag_drop',
    $$
    {
      "instruksi": "Seret dan susun blok perintah berikut agar robot bisa mencapai tujuan!",
      "konteks": "Robot SIGMA-Bot harus berjalan, belok kanan, lalu berhenti.",
      "blok_tersedia": [
        {"id": "b1", "label": "Berhenti", "icon": "🛑"},
        {"id": "b2", "label": "Berjalan ke depan", "icon": "⬆️"},
        {"id": "b3", "label": "Belok kanan", "icon": "↪️"},
        {"id": "b4", "label": "Belok kiri", "icon": "↩️"}
      ],
      "urutan_benar": ["b2", "b3", "b1"],
      "penjelasan_salah": "Hmm, urutannya belum tepat. Robot butuh perintah yang tepat sasaran!",
      "penjelasan_benar": "Mantap! Kamu baru saja menulis algoritma pertamamu!"
    }
    $$::jsonb,
    15,
    false,
    false,
    'SIGMA-Bot menunggumu. Dia tidak bisa bergerak tanpa instruksi yang benar!'
  ),
  (
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0001-000000000001',
    2,
    'Misi 2: Memasak Mie Instan',
    'drag_drop',
    $$
    {
      "instruksi": "Susun langkah memasak mie instan yang benar!",
      "konteks": "Seorang agen yang lapar butuh makan. Bantu dia!",
      "blok_tersedia": [
        {"id": "s1", "label": "Tuang bumbu ke mangkok"},
        {"id": "s2", "label": "Rebus air hingga mendidih"},
        {"id": "s3", "label": "Masukkan mie ke air mendidih"},
        {"id": "s4", "label": "Tiriskan mie, masukkan ke mangkok"},
        {"id": "s5", "label": "Aduk rata dan sajikan"},
        {"id": "s6", "label": "Makan!"}
      ],
      "urutan_benar": ["s2", "s3", "s1", "s4", "s5", "s6"],
      "penjelasan_salah": "Urutan langkahnya masih berantakan. Coba pikirkan apa yang harus dilakukan lebih dulu.",
      "penjelasan_benar": "Agen sudah kenyang! Begitulah algoritma — langkah demi langkah yang berurutan."
    }
    $$::jsonb,
    15,
    false,
    false,
    'Agen SIGMA juga perlu makan. Algoritma tidak hanya untuk komputer, lho!'
  ),
  (
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0001-000000000001',
    3,
    'Misi 3: Rutinitas Pagi Agen',
    'drag_drop',
    $$
    {
      "instruksi": "Susun rutinitas pagi agar agen tidak terlambat ke pelatihan!",
      "konteks": "Agen SIGMA harus siap berangkat sebelum jam 07.00.",
      "blok_tersedia": [
        {"id": "p1", "label": "Bangun dari tidur"},
        {"id": "p2", "label": "Mandi dan berpakaian"},
        {"id": "p3", "label": "Sarapan"},
        {"id": "p4", "label": "Cek peralatan misi"},
        {"id": "p5", "label": "Berangkat ke markas"},
        {"id": "p6", "label": "Main game sampai larut"}
      ],
      "urutan_benar": ["p1", "p2", "p3", "p4", "p5"],
      "penjelasan_salah": "Kalau main game dulu, pasti telat! Urutan yang logis itu penting dalam algoritma.",
      "penjelasan_benar": "Rutinitasmu rapi! Algoritma sehari-hari juga harus berurutan dan masuk akal."
    }
    $$::jsonb,
    15,
    false,
    false,
    'Agen yang disiplin selalu menang. ERROR-X suka menyerang yang telat!'
  ),
  (
    '00000000-0000-0000-0002-000000000005',
    '00000000-0000-0000-0001-000000000001',
    4,
    'Misi 4: Siapkan Tas Sekolah',
    'drag_drop',
    $$
    {
      "instruksi": "Urutkan langkah menyiapkan tas agar tidak ada yang ketinggalan!",
      "konteks": "Besok ada ujian informatika di lab komputer.",
      "blok_tersedia": [
        {"id": "t1", "label": "Cek jadwal pelajaran besok"},
        {"id": "t2", "label": "Masukkan buku dan alat tulis"},
        {"id": "t3", "label": "Isi botol minum"},
        {"id": "t4", "label": "Masukkan laptop atau tablet (jika perlu)"},
        {"id": "t5", "label": "Tutup resleting tas"},
        {"id": "t6", "label": "Tidur tanpa alarm"}
      ],
      "urutan_benar": ["t1", "t2", "t3", "t4", "t5"],
      "penjelasan_salah": "Ada langkah yang loncat atau urutannya aneh. Coba ulangi dari awal.",
      "penjelasan_benar": "Tas siap, otak siap! Menyusun langkah = menyusun algoritma yang rapi."
    }
    $$::jsonb,
    15,
    false,
    false,
    'Tas berantakan = misi berantakan. ERROR-X senang kalau agen lupa perlengkapan!'
  ),
  (
    '00000000-0000-0000-0002-000000000006',
    '00000000-0000-0000-0001-000000000001',
    5,
    'Misi 5: Antrian Kantin Sekolah',
    'drag_drop',
    $$
    {
      "instruksi": "Susun langkah antrian kantin yang benar dan adil!",
      "konteks": "Kantin ramai saat jam istirahat. Ikuti aturan antrian SIGMA.",
      "blok_tersedia": [
        {"id": "k1", "label": "Ambil nomor antrian"},
        {"id": "k2", "label": "Menyelip ke depan antrian"},
        {"id": "k3", "label": "Tunggu giliran dipanggil"},
        {"id": "k4", "label": "Pesan makanan"},
        {"id": "k5", "label": "Bayar dan ambil pesanan"},
        {"id": "k6", "label": "Makan di meja"}
      ],
      "urutan_benar": ["k1", "k3", "k4", "k5", "k6"],
      "penjelasan_salah": "Menyelip antrian itu tidak fair — dan bukan algoritma yang benar!",
      "penjelasan_benar": "Antrian rapi = proses berjalan lancar. Komputer juga menjalankan instruksi berurutan."
    }
    $$::jsonb,
    15,
    false,
    false,
    'Di markas SIGMA, disiplin antrian = disiplin kode. Jangan sampai ERROR-X mengacaukan urutan!'
  ),
  (
    '00000000-0000-0000-0002-000000000007',
    '00000000-0000-0000-0001-000000000001',
    6,
    'Misi 6: Program Sederhana SIGMA',
    'drag_drop',
    $$
    {
      "instruksi": "Susun blok program sederhana dari awal sampai selesai!",
      "konteks": "Setiap program komputer punya awal, proses, dan akhir.",
      "blok_tersedia": [
        {"id": "pr1", "label": "Mulai program"},
        {"id": "pr2", "label": "Terima input dari pengguna"},
        {"id": "pr3", "label": "Proses data"},
        {"id": "pr4", "label": "Tampilkan hasil"},
        {"id": "pr5", "label": "Selesai program"},
        {"id": "pr6", "label": "Hapus semua data tanpa backup"}
      ],
      "urutan_benar": ["pr1", "pr2", "pr3", "pr4", "pr5"],
      "penjelasan_salah": "Program butuh urutan yang jelas. Blok merusak data tidak boleh masuk!",
      "penjelasan_benar": "Kamu sudah paham struktur program dasar. Ini fondasi semua coding!"
    }
    $$::jsonb,
    15,
    false,
    false,
    'Direktur SIGMA mengintip layarmu. Tunjukkan bahwa kamu siap jadi agen sejati!'
  ),
  (
    '00000000-0000-0000-0002-000000000008',
    '00000000-0000-0000-0001-000000000001',
    7,
    'Tantangan Bos: Labirin SIGMA-Bot',
    'drag_drop',
    $$
    {
      "instruksi": "Susun perintah lengkap agar SIGMA-Bot menyelesaikan labirin tanpa menabrak dinding!",
      "konteks": "Labirin punya 2 belokan dan satu titik berhenti di akhir. ERROR-X mengacaukan peta!",
      "blok_tersedia": [
        {"id": "x1", "label": "Berjalan ke depan (3 langkah)", "icon": "⬆️"},
        {"id": "x2", "label": "Belok kanan", "icon": "↪️"},
        {"id": "x3", "label": "Berjalan ke depan (2 langkah)", "icon": "⬆️"},
        {"id": "x4", "label": "Belok kiri", "icon": "↩️"},
        {"id": "x5", "label": "Berjalan ke depan (1 langkah)", "icon": "⬆️"},
        {"id": "x6", "label": "Berhenti di pintu keluar", "icon": "🛑"},
        {"id": "x7", "label": "Lompat tembok", "icon": "🚫"}
      ],
      "urutan_benar": ["x1", "x2", "x3", "x4", "x5", "x6"],
      "penjelasan_salah": "SIGMA-Bot menabrak dinding! ERROR-X tertawa. Periksa lagi urutan perintahmu.",
      "penjelasan_benar": "SIGMA-Bot selamat! Kamu lulus tantangan bos Level 1. ERROR-X mundur selangkah."
    }
    $$::jsonb,
    30,
    true,
    false,
    'Ini misi terakhir sebelum tes akhir. Kalau berhasil, kamu naik pangkat dari Rekrut!'
  ),
  (
    '00000000-0000-0000-0002-000000000009',
    '00000000-0000-0000-0001-000000000001',
    8,
    'Tes Akhir: Bukti Kamu Sudah Siap',
    'multiple_choice',
    '{"is_posttest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Satu langkah lagi menuju Level 2. Tunjukkan semua yang sudah kamu pelajari!'
  )
ON CONFLICT (id) DO UPDATE
SET
  level_id = EXCLUDED.level_id,
  urutan = EXCLUDED.urutan,
  nama = EXCLUDED.nama,
  tipe = EXCLUDED.tipe,
  konten_json = EXCLUDED.konten_json,
  xp_reward = EXCLUDED.xp_reward,
  is_boss_challenge = EXCLUDED.is_boss_challenge,
  is_assessment = EXCLUDED.is_assessment,
  cerita_cutscene = EXCLUDED.cerita_cutscene;
