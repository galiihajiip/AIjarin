-- AIjarin Phase 2.8: Level 6 (Agen Senior) — array, list, dict, operasi data

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
    '00000000-0000-0000-0007-000000000001',
    '00000000-0000-0000-0001-000000000006',
    0,
    'Tes Awal: Basis Data Agen',
    'multiple_choice',
    '{"is_pretest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Operasi lapangan butuh pengelolaan data ribuan agen. Tes ini mengukur fondasimu tentang list dan dictionary.'
  ),
  (
    '00000000-0000-0000-0007-000000000002',
    '00000000-0000-0000-0001-000000000006',
    1,
    'Misi 1: Daftar Nama Agen',
    'code_typing',
    $$
    {
      "instruksi": "Ketik list berisi tiga nama agen lapangan!",
      "skenario": "Markas menyimpan nama agen aktif dalam satu list Python untuk diproses bersama.",
      "kode_awal": "# database_agen.py — inisialisasi\n",
      "baris_target": "nama_agen = [\"Rina\", \"Budi\", \"Ani\"]",
      "petunjuk": "Gunakan tanda kurung siku, string dengan petik, pisahkan dengan koma.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "LIST menyimpan banyak nilai berurutan. Indeks dimulai dari 0: nama_agen[0] adalah item pertama."
    }
    $$::jsonb,
    22,
    false,
    false,
    'ERROR-X menghapus satu nama dari server. List yang rapi memudahkan backup dan restore data agen.'
  ),
  (
    '00000000-0000-0000-0007-000000000003',
    '00000000-0000-0000-0001-000000000006',
    2,
    'Misi 2: Akses Agen per Indeks',
    'code_typing',
    $$
    {
      "instruksi": "Ketik baris untuk mengambil agen pertama dan terakhir dari list!",
      "skenario": "Komandan perlu cepat melihat agen di posisi awal dan akhir antrian.",
      "kode_awal": "nama_agen = [\"Rina\", \"Budi\", \"Ani\", \"Doni\"]\n",
      "baris_target": "pertama = nama_agen[0]\nterakhir = nama_agen[-1]",
      "petunjuk": "Indeks 0 = pertama. Indeks -1 = terakhir (Python).",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "Indeks negatif menghitung dari belakang. Sangat berguna untuk antrian dan stack data."
    }
    $$::jsonb,
    22,
    false,
    false,
    'Antrian lapangan panjang. Tanpa indeks, kamu harus scroll manual — di dunia nyata itu ribuan baris!'
  ),
  (
    '00000000-0000-0000-0007-000000000004',
    '00000000-0000-0000-0001-000000000006',
    3,
    'Misi 3: Tambah Agen Baru ke Database',
    'code_typing',
    $$
    {
      "instruksi": "Ketik perintah menambah agen baru ke list yang sudah ada!",
      "skenario": "Agen baru \"Galih\" baru lulus rekrutmen dan harus masuk ke database aktif.",
      "kode_awal": "nama_agen = [\"Rina\", \"Budi\"]\n",
      "baris_target": "nama_agen.append(\"Galih\")",
      "petunjuk": "Metode .append() menambah satu item di akhir list.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "List bersifat mutable (bisa diubah). append() lebih aman daripada mengutak-atik indeks manual."
    }
    $$::jsonb,
    22,
    false,
    false,
    'Rekrutan baru datang setiap minggu. Append adalah ritual wajib setiap agen senior di markas.'
  ),
  (
    '00000000-0000-0000-0007-000000000005',
    '00000000-0000-0000-0001-000000000006',
    4,
    'Misi 4: Profil Agen dengan Dictionary',
    'code_typing',
    $$
    {
      "instruksi": "Ketik dictionary profil agen dengan kunci nama, xp, dan status!",
      "skenario": "Setiap agen punya record terstruktur — seperti baris di database, tapi dalam bentuk dict Python.",
      "kode_awal": "# Record agen tunggal\n",
      "baris_target": "profil = {\"nama\": \"Budi\", \"xp\": 1200, \"status\": \"aktif\"}",
      "petunjuk": "Kurung kurawal {}, pasangan kunci: nilai, string pakai petik.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "DICTIONARY menyimpan data berlabel (key-value). profil[\"xp\"] mengambil XP tanpa mengingat posisi indeks."
    }
    $$::jsonb,
    24,
    false,
    false,
    'List nama saja tidak cukup. Dict menyimpan seluruh identitas agen — senjata data melawan ERROR-X.'
  ),
  (
    '00000000-0000-0000-0007-000000000006',
    '00000000-0000-0000-0001-000000000006',
    5,
    'Misi 5: Loop Database Agen',
    'code_typing',
    $$
    {
      "instruksi": "Ketik loop yang mencetak nama dan XP setiap agen dalam database!",
      "skenario": "database adalah list of dict. Setiap dict punya kunci nama dan xp.",
      "kode_awal": "database = [\n    {\"nama\": \"Rina\", \"xp\": 900},\n    {\"nama\": \"Budi\", \"xp\": 1200}\n]\n\n",
      "baris_target": "for agen in database:\n    print(agen[\"nama\"], agen[\"xp\"])",
      "petunjuk": "for agen in database, lalu print dua kunci dengan indeks string.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "List of dictionaries = tabel data sederhana. Loop mengunjungi setiap baris (record) satu per satu."
    }
    $$::jsonb,
    26,
    false,
    false,
    'Laporan harian komandan: 50 agen, 50 baris. Loop + dict = laporan otomatis dalam hitungan detik.'
  ),
  (
    '00000000-0000-0000-0007-000000000007',
    '00000000-0000-0000-0001-000000000006',
    6,
    'Misi 6: Hitung Total XP Tim',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi kode agregasi XP dari list database agen!",
      "skenario": "Komandan butuh total XP seluruh tim dan jumlah agen aktif untuk laporan markas.",
      "template": "database = [{\"nama\": \"A\", \"xp\": 100}, {\"nama\": \"B\", \"xp\": 250}]\ntotal_xp = 0\nfor agen in database:\n    total_xp = total_xp + agen[___]\njumlah_agen = ___(database)",
      "tipe_input": ["text", "text"],
      "label_input": [
        "Kunci dict untuk nilai XP (teks, tanpa petik)",
        "Fungsi built-in untuk menghitung jumlah item list"
      ],
      "jawaban_benar": ["xp", "len"],
      "contoh_benar": "total_xp = total_xp + agen[\"xp\"]\njumlah_agen = len(database)",
      "penjelasan": "Loop menjumlahkan kolom numerik. len() menghitung banyak record — pola dasar analitik data.",
      "validasi_tipe": false
    }
    $$::jsonb,
    22,
    false,
    false,
    'Markas membandingkan total XP antar sekolah. Agregasi sederhana ini adalah inti dashboard guru.'
  ),
  (
    '00000000-0000-0000-0007-000000000008',
    '00000000-0000-0000-0001-000000000006',
    7,
    'Misi 7: Filter Agen Offline',
    'code_typing',
    $$
    {
      "instruksi": "Ketik loop yang mengumpulkan agen berstatus offline ke list baru!",
      "skenario": "Dari database lengkap, buat daftar_nama hanya untuk agen yang harus dihubungi ulang.",
      "kode_awal": "database = [\n    {\"nama\": \"Rina\", \"status\": \"aktif\"},\n    {\"nama\": \"Budi\", \"status\": \"offline\"},\n    {\"nama\": \"Ani\", \"status\": \"offline\"}\n]\ndaftar_offline = []\n",
      "baris_target": "for agen in database:\n    if agen[\"status\"] == \"offline\":\n        daftar_offline.append(agen[\"nama\"])",
      "petunjuk": "Loop, if status offline, append nama ke list kosong.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "Filter = loop + if + list baru. Pola ini dipakai di semua sistem monitoring nyata."
    }
    $$::jsonb,
    26,
    false,
    false,
    '50 agen tidak merespons pagi ini. ERROR-X mungkin memutus koneksi — filter offline menemukan mereka.'
  ),
  (
    '00000000-0000-0000-0007-000000000009',
    '00000000-0000-0000-0001-000000000006',
    8,
    'Tantangan Bos: Database 50 Agen Lapangan',
    'code_typing',
    $$
    {
      "instruksi": "Ketik fungsi yang membangun database contoh dan mengembalikan agen XP tertinggi!",
      "skenario": "Simulasi 50 agen dengan XP acak (stub). Fungsi cari_top_agen mengembalikan dict agen terbaik.",
      "kode_awal": "def buat_database_stub():\n    db = []\n    for i in range(50):\n        db.append({\"id\": i, \"nama\": f\"Agen-{i}\", \"xp\": i * 10})\n    return db\n\n",
      "baris_target": "def cari_top_agen(database):\n    top = database[0]\n    for agen in database:\n        if agen[\"xp\"] > top[\"xp\"]:\n            top = agen\n    return top",
      "petunjuk": "Simpan kandidat top, loop bandingkan xp, update jika lebih besar, return dict.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "List + dict + loop + fungsi = operasi database skala kecil. Pola yang sama dipakai untuk jutaan baris dengan optimasi.",
      "mode_bos": true
    }
    $$::jsonb,
    40,
    true,
    false,
    'Operasi besar: 50 agen, satu komando. ERROR-X menyerang node data. Hanya agen senior yang bisa menyelamatkan database!'
  ),
  (
    '00000000-0000-0000-0007-000000000010',
    '00000000-0000-0000-0001-000000000006',
    9,
    'Tes Akhir: Agen Senior Resmi',
    'multiple_choice',
    '{"is_posttest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Database aman. Naik ke Level 7: Direktur SIGMA — kuasai seni berkomunikasi dengan AI lewat prompt!'
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
