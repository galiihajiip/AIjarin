-- AIjarin Phase 2.4: Level 2 (Analis Data) — variabel & fill-in-the-blank

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
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0001-000000000002',
    0,
    'Tes Awal: Gudang Data Terkunci',
    'multiple_choice',
    '{"is_pretest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'ERROR-X mengunci gudang data. Jawab tes ini agar kami tahu apa yang sudah kamu paham tentang variabel!'
  ),
  (
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0001-000000000002',
    1,
    'Misi 1: Kotak Rahasia',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi kode berikut untuk menyimpan informasi agen!",
      "template": "nama_agen = ___\numur = ___\nkota = \"Surabaya\"",
      "tipe_input": ["text", "number"],
      "label_input": ["Nama kamu (teks, pakai tanda petik)", "Umurmu (angka)"],
      "contoh_benar": "nama_agen = \"Budi\"\numur = 17",
      "penjelasan": "Variabel adalah seperti kotak berlabel. Kamu bisa menyimpan informasi di dalamnya dan memanggilnya kapan saja!",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'Setiap agen punya identitas rahasia. Simpan datamu di kotak variabel yang aman!'
  ),
  (
    '00000000-0000-0000-0003-000000000003',
    '00000000-0000-0000-0001-000000000002',
    2,
    'Misi 2: Skor Permainan Latihan',
    'fill_blank',
    $$
    {
      "instruksi": "Isi variabel skor setelah misi latihan selesai!",
      "template": "skor_misi = ___\nskor_tertinggi = ___\nbonus = skor_misi + 5",
      "tipe_input": ["number", "number"],
      "label_input": ["Skor misi yang baru kamu dapat (angka)", "Skor tertinggi sebelumnya (angka)"],
      "contoh_benar": "skor_misi = 85\nskor_tertinggi = 90",
      "penjelasan": "Angka disimpan sebagai tipe number. Kamu bisa menghitung ulang pakai variabel lain, seperti bonus di baris ketiga.",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'Di Gudang Data, setiap poin latihan tercatat. Jangan biarkan ERROR-X menghapus skormu!'
  ),
  (
    '00000000-0000-0000-0003-000000000004',
    '00000000-0000-0000-0001-000000000002',
    3,
    'Misi 3: Status Online Agen',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi variabel boolean untuk status kesiapan agen!",
      "template": "nama = ___\nis_online = ___\nsiap_misi = is_online",
      "tipe_input": ["text", "boolean"],
      "label_input": ["Nama panggilan agen (teks, pakai tanda petik)", "Status online: true atau false"],
      "contoh_benar": "nama = \"SIGMA-7\"\nis_online = true",
      "penjelasan": "Boolean hanya punya dua nilai: true atau false. Cocok untuk status ya/tidak, hidup/mati, online/offline.",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'Pusat komando harus tahu agen mana yang siap dikerahkan. Boolean menjawab pertanyaan sederhana: siap atau tidak?'
  ),
  (
    '00000000-0000-0000-0003-000000000005',
    '00000000-0000-0000-0001-000000000002',
    4,
    'Misi 4: Pesan Terenkripsi',
    'fill_blank',
    $$
    {
      "instruksi": "Buat variabel teks untuk pesan rahasia ke markas!",
      "template": "kode_misi = ___\npesan = ___\nprint(pesan)",
      "tipe_input": ["text", "text"],
      "label_input": ["Kode misi (teks pendek, pakai tanda petik)", "Isi pesan rahasia (teks, pakai tanda petik)"],
      "contoh_benar": "kode_misi = \"GUDANG-A\"\npesan = \"Data variabel aman\"",
      "penjelasan": "String (teks) disimpan dengan tanda petik. Kamu bisa menggabungkan string dengan operator + nanti di level berikutnya.",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'ERROR-X mencoba membaca pesan tanpa izin. Variabel string menyimpan teks dengan aman di memori.'
  ),
  (
    '00000000-0000-0000-0003-000000000006',
    '00000000-0000-0000-0001-000000000002',
    5,
    'Misi 5: Data Fisik Agen',
    'fill_blank',
    $$
    {
      "instruksi": "Catat data fisik agen untuk simulasi labirin!",
      "template": "tinggi_cm = ___\nberat_kg = ___\nindeks = berat_kg / (tinggi_cm / 100) ** 2",
      "tipe_input": ["number", "number"],
      "label_input": ["Tinggi badan dalam cm (angka)", "Berat badan dalam kg (angka, boleh desimal)"],
      "contoh_benar": "tinggi_cm = 165\nberat_kg = 55.5",
      "penjelasan": "Angka desimal juga valid di variabel number. Komputer membedakan 17 dengan 17.0 saat perlu presisi.",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'Simulator SIGMA butuh data tubuh agen. Tanpa variabel angka, robot tidak bisa menyesuaikan gerakannya.'
  ),
  (
    '00000000-0000-0000-0003-000000000007',
    '00000000-0000-0000-0001-000000000002',
    6,
    'Misi 6: Inventaris Gudang',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi daftar inventaris di gudang data!",
      "template": "nama_barang = ___\njumlah = ___\ntotal_nilai = jumlah * 15000\nlokasi = \"Rak-B\"",
      "tipe_input": ["text", "number"],
      "label_input": ["Nama barang (teks, pakai tanda petik)", "Jumlah stok (angka bulat)"],
      "contoh_benar": "nama_barang = \"Tablet Latihan\"\njumlah = 12",
      "penjelasan": "Kamu bisa mencampur variabel teks dan angka dalam satu program. total_nilai dihitung otomatis dari jumlah.",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'Gudang penuh peralatan misi. Setiap barang punya nama (string) dan jumlah (number).'
  ),
  (
    '00000000-0000-0000-0003-000000000008',
    '00000000-0000-0000-0001-000000000002',
    7,
    'Tantangan Bos: Profil Agen Lengkap',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi seluruh profil agen untuk membuka brankas data utama!",
      "template": "id_agen = ___\nnama = ___\numur = ___\nkota = ___\nis_aktif = ___\nlevel_keamanan = 3",
      "tipe_input": ["text", "text", "number", "text", "boolean"],
      "label_input": [
        "ID agen (teks, contoh: AG-2024-01)",
        "Nama lengkap (teks, pakai tanda petik)",
        "Umur (angka)",
        "Kota asal (teks, pakai tanda petik)",
        "Status aktif: true atau false"
      ],
      "contoh_benar": "id_agen = \"AG-2024-01\"\nnama = \"Ana\"\numur = 16\nkota = \"Surabaya\"\nis_aktif = true",
      "penjelasan": "Brankas terbuka! Kamu menguasai variabel teks, angka, dan boolean sekaligus. Itu fondasi semua program data.",
      "validasi_tipe": true
    }
    $$::jsonb,
    35,
    true,
    false,
    'Ini brankas utama ERROR-X. Lengkapi profilmu dengan benar, atau data seluruh tim akan terhapus!'
  ),
  (
    '00000000-0000-0000-0003-000000000009',
    '00000000-0000-0000-0001-000000000002',
    8,
    'Tes Akhir: Analis Data Resmi',
    'multiple_choice',
    '{"is_posttest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Gudang data hampir sepenuhnya aman. Buktikan kamu siap naik ke Level 3: Detektif Logika!'
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
