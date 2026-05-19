-- AIjarin Phase 2.6: Level 4 (Komandan Sistem) — loops (for / while)

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
    '00000000-0000-0000-0005-000000000001',
    '00000000-0000-0000-0001-000000000004',
    0,
    'Tes Awal: Ruang Kontrol Server',
    'multiple_choice',
    '{"is_pretest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Sebelum memimpin operasi, kami perlu tahu apakah kamu sudah paham konsep perulangan (loop).'
  ),
  (
    '00000000-0000-0000-0005-000000000002',
    '00000000-0000-0000-0001-000000000004',
    1,
    'Misi 1: Pindai Daftar Tersangka',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi loop untuk memeriksa setiap nama di daftar tersangka!",
      "skenario": "Server pusat menyimpan 4 nama. Agen harus memeriksa satu per satu sampai semua selesai.",
      "template": "daftar_tersangka = [\"Rina\", \"Budi\", \"Ani\", \"Doni\"]\nfor nama in daftar_tersangka:\n    print(\"Memeriksa:\", ___)\n    status = \"diperiksa\"",
      "tipe_input": ["text"],
      "label_input": ["Ekspresi yang dicetak (variabel nama di dalam print)"],
      "jawaban_benar": ["nama"],
      "contoh_benar": "for nama in daftar_tersangka:\n    print(\"Memeriksa:\", nama)",
      "penjelasan": "FOR ... IN mengulangi blok kode untuk setiap item dalam list. Variabel nama berubah otomatis setiap putaran.",
      "validasi_tipe": false
    }
    $$::jsonb,
    20,
    false,
    false,
    'Daftar tersangka ERROR-X panjang. Tanpa loop, kamu akan mengetik perintah yang sama berkali-kali!'
  ),
  (
    '00000000-0000-0000-0005-000000000003',
    '00000000-0000-0000-0001-000000000004',
    2,
    'Misi 2: Patroli Sampai Aman',
    'fill_blank',
    $$
    {
      "instruksi": "Gunakan WHILE untuk mengulang patroli sampai kondisi aman terpenuhi!",
      "skenario": "Selama ancaman masih ada, patroli terus berjalan. Berhenti ketika ancaman = 0.",
      "template": "ancaman = ___\nwhile ancaman > 0:\n    print(\"Patroli berjalan...\")\n    ancaman = ancaman - 1\nprint(\"Wilayah aman!\")",
      "tipe_input": ["number"],
      "label_input": ["Nilai awal ancaman (angka, misalnya 3)"],
      "jawaban_benar": null,
      "contoh_benar": "ancaman = 3\nwhile ancaman > 0:\n    print(\"Patroli berjalan...\")\n    ancaman = ancaman - 1",
      "penjelasan": "WHILE mengulang selama kondisi masih True. Pastikan ada langkah yang mengubah variabel, atau loop bisa infinite!",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'ERROR-X mengirim drone terus-menerus. WHILE adalah peluru yang tidak berhenti sampai target tumbang.'
  ),
  (
    '00000000-0000-0000-0005-000000000004',
    '00000000-0000-0000-0001-000000000004',
    3,
    'Misi 3: Ketik Loop Pengiriman Perintah',
    'code_typing',
    $$
    {
      "instruksi": "Ketik baris loop berikut persis (termasuk indentasi 4 spasi)!",
      "skenario": "Komandan mengirim perintah ke 5 regu. Gunakan range untuk mengulang tanpa menulis 5 baris sama.",
      "kode_awal": "# Kirim perintah ke regu 0 sampai 4\nfor i in range(5):\n",
      "baris_target": "    print(\"Perintah ke regu\", i)",
      "petunjuk": "Gunakan variabel i di dalam print. Jangan lupa indentasi di dalam loop.",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "range(5) menghasilkan 0,1,2,3,4. FOR + RANGE adalah cara cepat mengulang sejumlah kali pasti."
    }
    $$::jsonb,
    22,
    false,
    false,
    'Markas butuh ketepatan. Satu spasi salah, perintah bisa salah regu — ERROR-X akan memanfaatkannya!'
  ),
  (
    '00000000-0000-0000-0005-000000000005',
    '00000000-0000-0000-0001-000000000004',
    4,
    'Misi 4: Periksa Log Server Berulang',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi loop untuk membaca setiap baris log!",
      "skenario": "Ada daftar pesan log. Cari yang mengandung kata ERROR-X dan hitung jumlahnya.",
      "template": "log_server = [\"OK\", \"ERROR-X\", \"OK\", \"ERROR-X\", \"OK\"]\njumlah = 0\nfor baris in log_server:\n    if ___ in baris:\n        jumlah = jumlah + 1",
      "tipe_input": ["text"],
      "label_input": ["String yang dicari di dalam baris (teks, pakai tanda petik)"],
      "jawaban_benar": ["ERROR-X"],
      "contoh_benar": "if \"ERROR-X\" in baris:\n    jumlah = jumlah + 1",
      "penjelasan": "Loop + IF digabung: ulangi untuk setiap item, lalu putuskan di dalam tubuh loop. Ini pola scan/filter.",
      "validasi_tipe": false
    }
    $$::jsonb,
    20,
    false,
    false,
    'Jutaan baris log masuk setiap detik. Hanya loop yang bisa memindai semuanya tanpa lelah.'
  ),
  (
    '00000000-0000-0000-0005-000000000006',
    '00000000-0000-0000-0001-000000000004',
    5,
    'Misi 5: Loop Bersarang — Matriks Kursi Lab',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi loop bersarang untuk memeriksa setiap kursi di setiap baris lab!",
      "skenario": "Lab punya 3 baris, masing-masing 4 kursi. Total 12 titik pemeriksaan.",
      "template": "for baris in range(___):\n    for kursi in range(4):\n        print(\"Periksa baris\", baris, \"kursi\", kursi)",
      "tipe_input": ["number"],
      "label_input": ["Jumlah baris (angka)"],
      "jawaban_benar": ["3"],
      "contoh_benar": "for baris in range(3):\n    for kursi in range(4):",
      "penjelasan": "Loop di dalam loop: untuk setiap baris, ulangi pemeriksaan kursi. Total iterasi = 3 × 4 = 12.",
      "validasi_tipe": true
    }
    $$::jsonb,
    22,
    false,
    false,
    'ERROR-X menyisipkan USB di salah satu kursi. Loop bersarang memastikan tidak ada kursi terlewat.'
  ),
  (
    '00000000-0000-0000-0005-000000000007',
    '00000000-0000-0000-0001-000000000004',
    6,
    'Misi 6: Ketik BREAK dari Loop',
    'code_typing',
    $$
    {
      "instruksi": "Ketik perintah untuk berhenti dari loop saat tersangka ditemukan!",
      "skenario": "Memindai daftar sampai ketemu \"ERROR-X\", lalu hentikan scan — tidak perlu lanjut.",
      "kode_awal": "daftar = [\"aman\", \"aman\", \"ERROR-X\", \"aman\"]\nfor kode in daftar:\n    if kode == \"ERROR-X\":\n        print(\"Tersangka ditemukan!\")\n",
      "baris_target": "        break",
      "petunjuk": "BREAK keluar dari loop sepenuhnya. Indentasi 8 spasi (di dalam if di dalam for).",
      "abaikan_spasi_ekstra": true,
      "penjelasan": "BREAK menghemat waktu: berhenti saat tujuan tercapai. Tanpa break, komputer tetap memeriksa sisanya."
    }
    $$::jsonb,
    22,
    false,
    false,
    'Waktu adalah peluru. Scan yang tidak efisien membuat ERROR-X kabur dari lab komputer!'
  ),
  (
    '00000000-0000-0000-0005-000000000008',
    '00000000-0000-0000-0001-000000000004',
    7,
    'Tantangan Bos: Audit 50 Agen Sekaligus',
    'fill_blank',
    $$
    {
      "instruksi": "Selesaikan skrip audit massal untuk 50 agen di server pusat!",
      "skenario": "Ulangi dari 0 sampai 49. Setiap agen: cek status. Jika offline, tambah ke daftar masalah. Di akhir cetak total.",
      "template": "total_masalah = 0\nfor id_agen in range(___):\n    status = cek_status(id_agen)  # fungsi simulasi\n    if status == ___:\n        total_masalah = total_masalah + 1\nprint(\"Total agen bermasalah:\", total_masalah)",
      "tipe_input": ["number", "text"],
      "label_input": [
        "Batas atas range untuk 50 agen (angka, id 0..49)",
        "Nilai status yang dihitung bermasalah (teks, pakai tanda petik)"
      ],
      "jawaban_benar": ["50", "offline"],
      "contoh_benar": "for id_agen in range(50):\n    if status == \"offline\":",
      "penjelasan": "Operasi massal di dunia nyata selalu memakai loop. range(50) = 50 kali iterasi, dari 0 hingga 49.",
      "validasi_tipe": false
    }
    $$::jsonb,
    35,
    true,
    false,
    'Server pusat hampir crash. ERROR-X menyerang 50 node sekaligus. Hanya komandan yang kuasai loop yang bisa menyelamatkan jaringan!'
  ),
  (
    '00000000-0000-0000-0005-000000000009',
    '00000000-0000-0000-0001-000000000004',
    8,
    'Tes Akhir: Komandan Resmi SIGMA',
    'multiple_choice',
    '{"is_posttest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Lulus tes ini dan kamu naik ke Level 5: Insinyur AI — waktunya membangun fungsi!'
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
