-- AIjarin Phase 2.5: Level 3 (Detektif Logika) — IF / ELIF / ELSE

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
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0001-000000000003',
    0,
    'Tes Awal: Ruang Interogasi',
    'multiple_choice',
    '{"is_pretest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Sebelum jadi detektif, kami perlu tahu seberapa paham kamu tentang logika IF dan ELSE.'
  ),
  (
    '00000000-0000-0000-0004-000000000002',
    '00000000-0000-0000-0001-000000000003',
    1,
    'Misi 1: Kasus CCTV Markas',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi logika detektif untuk kasus CCTV di markas SIGMA!",
      "skenario": "Jika tersangka terlihat di CCTV DAN waktunya sesuai, maka tangkap. Jika hanya salah satu benar, maka awasi. Jika tidak ada bukti, bebaskan.",
      "template": "if terlihat_cctv and waktu_sesuai:\n    tindakan = ___\nelif terlihat_cctv or waktu_sesuai:\n    tindakan = ___\nelse:\n    tindakan = ___",
      "tipe_input": ["text", "text", "text"],
      "label_input": [
        "Tindakan jika KEDUA syarat benar (teks, pakai tanda petik)",
        "Tindakan jika hanya SATU syarat benar",
        "Tindakan jika tidak ada bukti sama sekali"
      ],
      "jawaban_benar": ["tangkap", "awasi", "bebaskan"],
      "contoh_benar": "if terlihat_cctv and waktu_sesuai:\n    tindakan = \"tangkap\"\nelif terlihat_cctv or waktu_sesuai:\n    tindakan = \"awasi\"\nelse:\n    tindakan = \"bebaskan\"",
      "penjelasan": "IF mengecek kondisi pertama. ELIF mengecek kondisi alternatif. ELSE menangani sisanya. Operator and/or menggabungkan beberapa syarat.",
      "validasi_tipe": false
    }
    $$::jsonb,
    20,
    false,
    false,
    'ERROR-X menyusup ke markas. Rekaman CCTV samar — logika kondisional akan memilah tersangka dari orang tak bersalah.'
  ),
  (
    '00000000-0000-0000-0004-000000000003',
    '00000000-0000-0000-0001-000000000003',
    2,
    'Misi 2: Laporan Nilai Ujian',
    'fill_blank',
    $$
    {
      "instruksi": "Tentukan status siswa berdasarkan skor ujian!",
      "skenario": "Skor >= 85: Beasiswa. Skor >= 75: Lulus. Skor >= 60: Remedial. Di bawah 60: Ulangi level.",
      "template": "skor = ___\nif skor >= 85:\n    status = ___\nelif skor >= 75:\n    status = ___\nelif skor >= 60:\n    status = ___\nelse:\n    status = ___",
      "tipe_input": ["number", "text", "text", "text", "text"],
      "label_input": [
        "Skor ujian contoh (angka, misalnya 78)",
        "Status jika skor >= 85",
        "Status jika skor >= 75",
        "Status jika skor >= 60",
        "Status jika skor < 60"
      ],
      "jawaban_benar": null,
      "contoh_benar": "skor = 78\nif skor >= 85:\n    status = \"beasiswa\"\nelif skor >= 75:\n    status = \"lulus\"\nelif skor >= 60:\n    status = \"remedial\"\nelse:\n    status = \"ulang\"",
      "penjelasan": "ELIF memeriksa kondisi berikutnya hanya jika kondisi sebelumnya salah. Urutan dari syarat tertinggi ke terendah sangat penting!",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'Data nilai bocor ke ERROR-X. Susun aturan IF/ELIF yang adil agar tidak ada siswa salah klasifikasi.'
  ),
  (
    '00000000-0000-0000-0004-000000000004',
    '00000000-0000-0000-0001-000000000003',
    3,
    'Misi 3: Pilih Cabang Logika yang Benar',
    'multiple_choice',
    $$
    {
      "instruksi": "Baca skenario cuaca, lalu pilih struktur IF yang paling tepat!",
      "skenario": "Agen keluar misi: jika hujan, bawa payung; jika panas terik, pakai topi; selain itu, cukup seragam biasa.",
      "pertanyaan": "Manakah kode yang paling sesuai dengan skenario di atas?",
      "pilihan": [
        {
          "id": "a",
          "label": "if hujan: payung | elif panas: topi | else: seragam"
        },
        {
          "id": "b",
          "label": "if hujan: payung | if panas: topi (tanpa else)"
        },
        {
          "id": "c",
          "label": "if hujan and panas: payung dan topi | else: seragam"
        },
        {
          "id": "d",
          "label": "else: seragam | if hujan: payung"
        }
      ],
      "jawaban_benar": "a",
      "penjelasan": "ELIF memastikan hanya satu cabang yang dijalankan. Dua IF terpisah bisa mengeksekusi keduanya. ELSE di akhir menangani kondisi sisanya."
    }
    $$::jsonb,
    20,
    false,
    false,
    'Cuaca Surabaya berubah-ubah. Tanpa logika bercabang, agen bisa datang dengan payung DAN topi sekaligus tanpa perlu!'
  ),
  (
    '00000000-0000-0000-0004-000000000005',
    '00000000-0000-0000-0001-000000000003',
    4,
    'Misi 4: Kode Akses Pintu Rahasia',
    'fill_blank',
    $$
    {
      "instruksi": "Lengkapi logika pintu markas bawah tanah!",
      "skenario": "Jika kode benar DAN sidik jari cocok, pintu terbuka. Jika hanya kode benar, alarm berbunyi. Jika salah semua, pintu terkunci.",
      "template": "kode_benar = ___\nsidik_cocok = ___\nif kode_benar and sidik_cocok:\n    pintu = ___\nelif kode_benar:\n    pintu = ___\nelse:\n    pintu = ___",
      "tipe_input": ["boolean", "boolean", "text", "text", "text"],
      "label_input": [
        "kode_benar (true atau false)",
        "sidik_cocok (true atau false)",
        "Status pintu jika keduanya benar",
        "Status pintu jika hanya kode benar",
        "Status pintu jika gagal"
      ],
      "jawaban_benar": [null, null, "terbuka", "alarm", "terkunci"],
      "contoh_benar": "kode_benar = true\nsidik_cocok = true\nif kode_benar and sidik_cocok:\n    pintu = \"terbuka\"\nelif kode_benar:\n    pintu = \"alarm\"\nelse:\n    pintu = \"terkunci\"",
      "penjelasan": "Boolean di dalam IF membuat keputusan ya/tidak. Kombinasi and artinya semua syarat harus benar.",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'Pintu gudang bukti tertutup rapat. Hanya detektif yang paham IF/ELIF yang bisa masuk tanpa memicu alarm ERROR-X.'
  ),
  (
    '00000000-0000-0000-0004-000000000006',
    '00000000-0000-0000-0001-000000000003',
    5,
    'Misi 5: Temukan Kesalahan Logika',
    'multiple_choice',
    $$
    {
      "instruksi": "Kode penilaian di bawah menghasilkan keputusan salah untuk siswa berprestasi. Apa kesalahannya?",
      "skenario": "Aturan: skor >= 85 beasiswa, >= 75 lulus, >= 60 remedial, di bawah 60 ulang.",
      "kode_tampil": "skor = 80\nif skor >= 60:\n    status = \"remedial\"\nelif skor >= 75:\n    status = \"lulus\"\nelif skor >= 85:\n    status = \"beasiswa\"\nelse:\n    status = \"ulang\"",
      "pertanyaan": "Siswa dengan skor 80 seharusnya lulus, tapi kode memberi remedial. Mengapa?",
      "pilihan": [
        {
          "id": "a",
          "label": "Variabel skor tidak boleh angka"
        },
        {
          "id": "b",
          "label": "Urutan ELIF salah: syarat terendah (>= 60) dicek lebih dulu, jadi skor 80 terjebak di cabang remedial"
        },
        {
          "id": "c",
          "label": "Seharusnya tidak pakai ELSE"
        },
        {
          "id": "d",
          "label": "Operator >= tidak valid di Python"
        }
      ],
      "jawaban_benar": "b",
      "penjelasan": "ELIF dieksekusi berurutan. Cek syarat tertinggi dulu (>= 85), lalu >= 75, baru >= 60. Kalau terbalik, kondisi lemah menangkap nilai yang seharusnya masuk cabang lebih tinggi."
    }
    $$::jsonb,
    20,
    false,
    false,
    'ERROR-X sengaja menulis kode membingungkan di papan lab. Baca setiap cabang dengan hati-hati seperti memeriksa alibi!'
  ),
  (
    '00000000-0000-0000-0004-000000000007',
    '00000000-0000-0000-0001-000000000003',
    6,
    'Misi 6: Status Misi Lapangan',
    'fill_blank',
    $$
    {
      "instruksi": "Tentukan status laporan misi agen di lapangan!",
      "skenario": "Jika misi_selesai dan tidak ada korban: sukses. Jika misi_selesai tapi ada korban: sukses dengan catatan. Jika belum selesai: lanjutkan. Jika gagal: evakuasi.",
      "template": "misi_selesai = ___\nada_korban = ___\nif misi_selesai and not ada_korban:\n    status = ___\nelif misi_selesai:\n    status = ___\nelif not misi_selesai:\n    status = ___\nelse:\n    status = ___",
      "tipe_input": ["boolean", "boolean", "text", "text", "text", "text"],
      "label_input": [
        "misi_selesai (true/false)",
        "ada_korban (true/false)",
        "Status jika selesai tanpa korban",
        "Status jika selesai dengan korban",
        "Status jika belum selesai",
        "Status jika gagal"
      ],
      "jawaban_benar": [null, null, "sukses", "sukses_catatan", "lanjutkan", "evakuasi"],
      "contoh_benar": "misi_selesai = true\nada_korban = false\nif misi_selesai and not ada_korban:\n    status = \"sukses\"\nelif misi_selesai:\n    status = \"sukses_catatan\"\nelif not misi_selesai:\n    status = \"lanjutkan\"\nelse:\n    status = \"evakuasi\"",
      "penjelasan": "Operator not membalik boolean. Urutan IF/ELIF menentukan prioritas keputusan di lapangan.",
      "validasi_tipe": true
    }
    $$::jsonb,
    20,
    false,
    false,
    'Laporan dari lapangan masuk setiap menit. Markas butuh keputusan cepat: lanjut, sukses, atau evakuasi.'
  ),
  (
    '00000000-0000-0000-0004-000000000008',
    '00000000-0000-0000-0001-000000000003',
    7,
    'Tantangan Bos: Kasus Pembocor Data',
    'fill_blank',
    $$
    {
      "instruksi": "Selesaikan logika investigasi pembocoran data — kasus terbesar Level 3!",
      "skenario": "Jika ada log akses DAN IP asing: tahan_saksi. Elif ada log akses saja: awasi. Elif IP asing saja: blokir_jaringan. Elif waktu_kejadian_malam: periksa_cctv. Else: arsipkan_kasus. Jika tahan_saksi, lanjutkan interogasi (interogasi = ya).",
      "template": "ada_log = ___\nip_asing = ___\nwaktu_malam = ___\nif ada_log and ip_asing:\n    keputusan = ___\nelif ada_log:\n    keputusan = ___\nelif ip_asing:\n    keputusan = ___\nelif waktu_malam:\n    keputusan = ___\nelse:\n    keputusan = ___\nif keputusan == \"tahan_saksi\":\n    interogasi = ___",
      "tipe_input": ["boolean", "boolean", "boolean", "text", "text", "text", "text", "text", "text"],
      "label_input": [
        "ada_log (true/false)",
        "ip_asing (true/false)",
        "waktu_malam (true/false)",
        "Keputusan jika log + IP asing",
        "Keputusan jika hanya ada log",
        "Keputusan jika hanya IP asing",
        "Keputusan jika hanya malam",
        "Keputusan jika tidak ada petunjuk",
        "Nilai interogasi jika tahan_saksi (ya/tidak)"
      ],
      "jawaban_benar": [null, null, null, "tahan_saksi", "awasi", "blokir_jaringan", "periksa_cctv", "arsipkan_kasus", "ya"],
      "contoh_benar": "ada_log = true\nip_asing = true\nwaktu_malam = false\nif ada_log and ip_asing:\n    keputusan = \"tahan_saksi\"\n...(dst)...",
      "penjelasan": "Kasus bos menggabungkan banyak ELIF dan IF bersarang. Ini pola yang dipakai sistem keamanan nyata!",
      "validasi_tipe": true
    }
    $$::jsonb,
    35,
    true,
    false,
    'Pembocor data hampir lolos. ERROR-X tertawa di balik layar. Satu struktur IF yang salah, dan kasus ditutup terlalu dini!'
  ),
  (
    '00000000-0000-0000-0004-000000000009',
    '00000000-0000-0000-0001-000000000003',
    8,
    'Tes Akhir: Detektif Resmi SIGMA',
    'multiple_choice',
    '{"is_posttest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Kasus terakhir di markas bawah tanah. Lulus tes ini dan kamu naik ke Level 4: Komandan Sistem (loops)!'
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
