-- AIjarin Phase 2.7: Level 5 (Insinyur AI) — fungsi (def, parameter, return)

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
    '00000000-0000-0000-0006-000000000001',
    '00000000-0000-0000-0001-000000000005',
    0,
    'Tes Awal: Laboratorium AI',
    'multiple_choice',
    '{"is_pretest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Prototype AI SIGMA belum aktif. Tes ini mengukur pemahamanmu tentang fungsi sebelum menyentuh kode nyata.'
  ),
  (
    '00000000-0000-0000-0006-000000000002',
    '00000000-0000-0000-0001-000000000005',
    1,
    'Misi 1: Subrutin Sapaan Agen',
    'code_typing',
    $$
    {
      "instruksi": "Ketik definisi fungsi sapaan untuk modul AI SIGMA!",
      "skenario": "Setiap agen yang login harus disapa dengan nama mereka. Buat fungsi yang menerima nama dan mencetak sapaan.",
      "kode_awal": "# Subrutin AI: modul_sapaan.py\n",
      "baris_target": "def sapa_agen(nama):\n    print(\"Selamat datang, Agen\", nama)",
      "petunjuk": "Gunakan def, nama fungsi sapa_agen, parameter nama, lalu print di dalam fungsi (indent 4 spasi).",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "FUNGSI adalah blok kode bernama yang bisa dipanggil berulang. Parameter menerima data dari luar."
    }
    $$::jsonb,
    22,
    false,
    false,
    'Modul AI pertama kamu: sapaan personal. ERROR-X mencoba menyamar — fungsi yang benar membedakan agen asli.'
  ),
  (
    '00000000-0000-0000-0006-000000000003',
    '00000000-0000-0000-0001-000000000005',
    2,
    'Misi 2: Fungsi dengan Nilai Balik',
    'code_typing',
    $$
    {
      "instruksi": "Ketik fungsi yang mengembalikan (return) hasil perhitungan!",
      "skenario": "AI perlu menghitung bonus XP dari skor misi. Fungsi menerima skor, mengembalikan bonus.",
      "kode_awal": "def hitung_bonus_xp(skor):\n",
      "baris_target": "    return skor // 10",
      "petunjuk": "Di dalam def, gunakan return. Bonus = skor dibagi 10 (bilangan bulat).",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "RETURN mengirim nilai kembali ke pemanggil. Tanpa return, fungsi hanya melakukan efek samping (print)."
    }
    $$::jsonb,
    24,
    false,
    false,
    'Markas menghitung ribuan skor per hari. Satu fungsi hitung_bonus_xp menggantikan puluhan baris kode ulang!'
  ),
  (
    '00000000-0000-0000-0006-000000000004',
    '00000000-0000-0000-0001-000000000005',
    3,
    'Misi 3: Panggil Subrutin AI',
    'code_typing',
    $$
    {
      "instruksi": "Ketik baris untuk memanggil fungsi dan menyimpan hasilnya!",
      "skenario": "Fungsi cek_ancaman(level) sudah ada. Kembalikan True jika level >= 3.",
      "kode_awal": "def cek_ancaman(level):\n    return level >= 3\n\n# Panggil untuk misi saat ini\nlevel_misi = 4\n",
      "baris_target": "bahaya = cek_ancaman(level_misi)",
      "petunjuk": "Simpan nilai return ke variabel bahaya. Panggil fungsi dengan argumen level_misi.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "Memanggil fungsi = menjalankan subrutin. Hasil return bisa disimpan, dicetak, atau dipakai di IF."
    }
    $$::jsonb,
    22,
    false,
    false,
    'Sensor ancaman ERROR-X aktif. Kamu tidak perlu menulis ulang logika — cukup panggil cek_ancaman().'
  ),
  (
    '00000000-0000-0000-0006-000000000005',
    '00000000-0000-0000-0001-000000000005',
    4,
    'Misi 4: Dua Parameter — Analisis Pesan',
    'code_typing',
    $$
    {
      "instruksi": "Ketik fungsi AI dengan dua parameter: pesan dan kata_kunci!",
      "skenario": "Modul deteksi memeriksa apakah kata kunci muncul di pesan (untuk mendeteksi ERROR-X).",
      "kode_awal": "# Modul: deteksi_kata.py\n",
      "baris_target": "def mengandung_kata(pesan, kata_kunci):\n    return kata_kunci in pesan",
      "petunjuk": "Dua parameter dipisah koma. Return True/False dengan operator in.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "Fungsi bisa punya banyak parameter. Urutan argumen saat memanggil harus sama dengan definisi."
    }
    $$::jsonb,
    24,
    false,
    false,
    'Chat rahasia masuk ke server. Fungsi mengandung_kata adalah radar pertama melawan pesan ERROR-X.'
  ),
  (
    '00000000-0000-0000-0006-000000000006',
    '00000000-0000-0000-0001-000000000005',
    5,
    'Misi 5: Lengkapi Badan Fungsi Normalisasi',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi isi fungsi normalisasi_skor untuk modul AI penilaian!",
      "skenario": "Skor mentah 0–100 dipetakan ke skala 0–1 agar model AI stabil.",
      "template": "def normalisasi_skor(skor):\n    hasil = ___ / 100\n    return ___",
      "tipe_input": ["text", "text"],
      "label_input": [
        "Rumus normalisasi (gunakan variabel skor)",
        "Nilai yang dikembalikan (nama variabel hasil)"
      ],
      "jawaban_benar": ["skor", "hasil"],
      "contoh_benar": "def normalisasi_skor(skor):\n    hasil = skor / 100\n    return hasil",
      "penjelasan": "Badan fungsi bisa berisi beberapa baris. RETURN di akhir mengirim nilai final ke pemanggil.",
      "validasi_tipe": false
    }
    $$::jsonb,
    20,
    false,
    false,
    'Model AI SIGMA sensitif terhadap angka besar. Normalisasi_skor adalah filter agar input selalu rapi.'
  ),
  (
    '00000000-0000-0000-0006-000000000007',
    '00000000-0000-0000-0001-000000000005',
    6,
    'Misi 6: Subrutin Rekomendasi Misi',
    'code_typing',
    $$
    {
      "instruksi": "Ketik fungsi rekomendasi yang menggabungkan skor dan streak!",
      "skenario": "AI menyarankan misi berikutnya: jika skor tinggi DAN streak >= 3, return \"lanjut_boss\", else \"latihan\".",
      "kode_awal": "def rekomendasi_misi(skor, streak):\n",
      "baris_target": "    if skor >= 80 and streak >= 3:\n        return \"lanjut_boss\"\n    return \"latihan\"",
      "petunjuk": "Tiga baris di dalam fungsi: if dengan return, lalu return default. Indent 4 spasi.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "Fungsi bisa berisi IF dan beberapa return. Ini subrutin keputusan yang dipanggil dari mana saja."
    }
    $$::jsonb,
    26,
    false,
    false,
    'Asisten AI SIGMA butuh otak kecil untuk setiap siswa. Fungsi rekomendasi_misi adalah intinya.'
  ),
  (
    '00000000-0000-0000-0006-000000000008',
    '00000000-0000-0000-0001-000000000005',
    7,
    'Tantangan Bos: Modul AI Mini SIGMA',
    'code_typing',
    $$
    {
      "instruksi": "Ketik dua fungsi untuk modul AI mini: analisis + laporan gabungan!",
      "skenario": "analisis_token menghitung panjang teks. buat_laporan gabungkan nama agen dan hasil analisis.",
      "kode_awal": "# Modul bos: ai_sigma_mini.py\n# Fungsi 1 — ketik di bawah ini\n",
      "baris_target": "def analisis_token(teks):\n    return len(teks)\n\ndef buat_laporan(nama, teks):\n    panjang = analisis_token(teks)\n    return f\"Agen {nama}: {panjang} token\"",
      "petunjuk": "Fungsi kedua memanggil fungsi pertama. Pakai f-string di return laporan.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "Fungsi bisa saling memanggil — modularitas! Ini fondasi arsitektur AI yang rapi dan bisa diuji.",
      "mode_bos": true
    }
    $$::jsonb,
    40,
    true,
    false,
    'Prototype AI hampir hidup. ERROR-X menyerang kabel data. Selesaikan modul mini ini atau seluruh lab gelap!'
  ),
  (
    '00000000-0000-0000-0006-000000000009',
    '00000000-0000-0000-0001-000000000005',
    8,
    'Tes Akhir: Insinyur AI Resmi',
    'multiple_choice',
    '{"is_posttest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Modul AI lulus uji. Selanjutnya Level 6: Agen Senior — mengelola array data massal di lapangan!'
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
