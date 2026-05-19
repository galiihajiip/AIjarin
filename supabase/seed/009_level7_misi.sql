-- AIjarin Phase 2.9: Level 7 (Direktur SIGMA) — project: AI prompting & auto-grader rubric

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
    '00000000-0000-0000-0008-000000000001',
    '00000000-0000-0000-0001-000000000007',
    0,
    'Tes Awal: Senjata Terakhir — Prompt',
    'multiple_choice',
    '{"is_pretest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Sebelum menghadapi ERROR-X, kami perlu tahu apakah kamu sudah paham dasar-dasar prompt engineering.'
  ),
  (
    '00000000-0000-0000-0008-000000000002',
    '00000000-0000-0000-0001-000000000007',
    1,
    'Misi 1: Definisikan Peran SIGMA',
    'project',
    $$
    {
      "instruksi": "Tulis prompt sistem (system prompt) untuk asisten AI bernama SIGMA yang membantu siswa belajar informatika.",
      "skenario": "SIGMA adalah mentor ramah untuk siswa SMA jalur afirmasi. ERROR-X mencoba membuat AI menjadi kasar dan membingungkan. Prompt-mu harus mengunci kepribadian SIGMA.",
      "tugas": "Buat prompt berbahasa Indonesia yang mendefinisikan: (1) siapa SIGMA, (2) nada bicara (empatik, pakai sapaan kamu), (3) larangan (tidak memberi jawaban langsung ujian, tidak kasar).",
      "konteks_wajib": ["SIGMA", "siswa SMA", "Bahasa Indonesia", "empatik"],
      "min_panjang_kata": 40,
      "auto_grader": true,
      "rubrik": [
        {"kriteria": "peran_jelas", "bobot": 30, "deskripsi": "Peran AI sebagai mentor SIGMA didefinisikan dengan jelas"},
        {"kriteria": "nada_bahasa", "bobot": 25, "deskripsi": "Nada empatik, ramah, sopan, sesuai siswa SMA"},
        {"kriteria": "batasan_etis", "bobot": 25, "deskripsi": "Ada larangan jawaban langsung / kecurangan / bahasa kasar"},
        {"kriteria": "bahasa_indonesia", "bobot": 20, "deskripsi": "Instruksi konsisten berbahasa Indonesia"}
      ],
      "contoh_prompt_lemah": "Kamu adalah AI. Jawab pertanyaan.",
      "contoh_prompt_kuat": "Kamu adalah SIGMA, mentor informatika untuk siswa SMA. Gunakan Bahasa Indonesia, sapaan kamu, nada empatik. Bimbing dengan petunjuk, jangan beri jawaban final ujian.",
      "penjelasan": "Prompt sistem adalah fondasi. Tanpa peran yang jelas, AI mudah disabotase oleh ERROR-X."
    }
    $$::jsonb,
    25,
    false,
    false,
    'Prototype SIGMA butuh jiwa. ERROR-X menulis prompt jahat — kamu tulis prompt yang benar.'
  ),
  (
    '00000000-0000-0000-0008-000000000003',
    '00000000-0000-0000-0001-000000000007',
    2,
    'Misi 2: Prompt dengan Konteks Misi',
    'project',
    $$
    {
      "instruksi": "Tulis prompt pengguna yang memberi KONTEKS lengkap sebelum bertanya ke AI.",
      "skenario": "Siswa bingung tentang variabel Python. Mereka harus menyertakan level, topik, dan apa yang sudah dicoba — bukan hanya mengetik 'gimana variabel?'.",
      "tugas": "Tulis prompt yang meminta SIGMA menjelaskan variabel Python untuk Level 2 (Analis Data), dengan konteks siswa pemula dan contoh analogi kotak penyimpanan.",
      "konteks_wajib": ["variabel", "Python", "pemula", "analogi"],
      "min_panjang_kata": 35,
      "auto_grader": true,
      "rubrik": [
        {"kriteria": "konteks_lengkap", "bobot": 35, "deskripsi": "Menyebut topik, level, atau latar belakang siswa"},
        {"kriteria": "pertanyaan_spesifik", "bobot": 30, "deskripsi": "Permintaan jelas (jelaskan, bandingkan, beri contoh)"},
        {"kriteria": "gaya_belajar", "bobot": 20, "deskripsi": "Meminta penjelasan sesuai level (analogi, langkah)"},
        {"kriteria": "bahasa_indonesia", "bobot": 15, "deskripsi": "Prompt ditulis dalam Bahasa Indonesia yang baik"}
      ],
      "contoh_prompt_lemah": "Apa itu variabel?",
      "contoh_prompt_kuat": "Saya siswa Level 2 Analis Data, baru belajar variabel Python. Tolong jelaskan dengan analogi kotak berlabel dan satu contoh kode singkat. Jangan terlalu panjang.",
      "penjelasan": "Konteks membantu AI menyesuaikan kedalaman jawaban. Ini keterampilan paling penting di dunia nyata."
    }
    $$::jsonb,
    25,
    false,
    false,
    'ERROR-X mengirim prompt kosong ke server. Tanpa konteks, SIGMA menjawab kacau — dan siswa putus asa.'
  ),
  (
    '00000000-0000-0000-0008-000000000004',
    '00000000-0000-0000-0001-000000000007',
    3,
    'Misi 3: Minta Format Output Terstruktur',
    'project',
    $$
    {
      "instruksi": "Tulis prompt yang meminta AI menjawab dalam format terstruktur (bullet / langkah bernomor).",
      "skenario": "Komandan butuh ringkasan ancaman ERROR-X untuk briefing. Jawaban paragraf panjang sulit dibaca di layar HP.",
      "tugas": "Tulis prompt yang meminta daftar 3 ancaman ERROR-X di dunia digital, masing-masing 1 kalimat, format bullet, plus 1 kalimat kesimpulan di akhir.",
      "konteks_wajib": ["bullet", "3", "ERROR-X"],
      "min_panjang_kata": 30,
      "auto_grader": true,
      "rubrik": [
        {"kriteria": "format_jelas", "bobot": 35, "deskripsi": "Meminta format terstruktur (bullet/nomor/tabel)"},
        {"kriteria": "jumlah_item", "bobot": 25, "deskripsi": "Menyebut jumlah item yang diinginkan (mis. 3)"},
        {"kriteria": "topik_fokus", "bobot": 25, "deskripsi": "Topik spesifik (ancaman ERROR-X / digital)"},
        {"kriteria": "ringkas", "bobot": 15, "deskripsi": "Meminta jawaban ringkas, tidak bertele-tele"}
      ],
      "contoh_prompt_lemah": "Ceritakan tentang ERROR-X.",
      "contoh_prompt_kuat": "Buat 3 poin bullet tentang ancaman ERROR-X di dunia digital. Setiap poin maksimal 1 kalimat. Akhiri dengan 1 kalimat kesimpulan untuk siswa SMA.",
      "penjelasan": "Format output adalah cara mengendalikan AI. Kamu yang memimpin struktur, bukan sebaliknya."
    }
    $$::jsonb,
    25,
    false,
    false,
    'Briefing markas dimulai. Direktur SIGMA tidak punya waktu baca esai — prompt kamu harus menghasilkan ringkasan rapi.'
  ),
  (
    '00000000-0000-0000-0008-000000000005',
    '00000000-0000-0000-0001-000000000007',
    4,
    'Misi 4: Prompt Penjelasan untuk Teman',
    'project',
    $$
    {
      "instruksi": "Tulis prompt agar AI mengajar dengan metode 'jelaskan ke teman sebaya'.",
      "skenario": "Siswa kesulitan memahami loop FOR. SIGMA harus menjelaskan seolah siswa akan mengajarkan ulang ke teman di bangku sebelah.",
      "tugas": "Tulis prompt yang meminta penjelasan loop FOR dengan: analogi sehari-hari, contoh kode 4 baris, dan 1 pertanyaan cek pemahaman di akhir.",
      "konteks_wajib": ["for loop", "analogi", "contoh kode"],
      "min_panjang_kata": 35,
      "auto_grader": true,
      "rubrik": [
        {"kriteria": "metode_pengajaran", "bobot": 30, "deskripsi": "Meminta metode jelaskan-ke-teman / Feynman"},
        {"kriteria": "analogi", "bobot": 25, "deskripsi": "Meminta analogi konkret"},
        {"kriteria": "contoh_kode", "bobot": 25, "deskripsi": "Meminta contoh kode singkat"},
        {"kriteria": "cek_pemahaman", "bobot": 20, "deskripsi": "Meminta pertanyaan refleksi di akhir"}
      ],
      "contoh_prompt_lemah": "Jelaskan loop.",
      "contoh_prompt_kuat": "Jelaskan loop FOR Python seolah saya akan mengajarkannya ke teman. Pakai analogi antrian kantin, berikan contoh kode 4 baris, lalu tanya 1 pertanyaan untuk cek pemahaman saya.",
      "penjelasan": "Prompt pedagogis mengarahkan AI menjadi tutor, bukan mesin jawaban. Ini kunci pembelajaran afirmasi yang efektif."
    }
    $$::jsonb,
    28,
    false,
    false,
    'Di lab sekolah, siswa belajar dari siswa. Prompt yang baik membuat AI ikut budaya belajar kalian.'
  ),
  (
    '00000000-0000-0000-0008-000000000006',
    '00000000-0000-0000-0001-000000000007',
    5,
    'Misi 5: Perbaiki Prompt Lemah',
    'project',
    $$
    {
      "instruksi": "Baca prompt lemah di bawah, lalu tulis VERSI PERBAIKAN yang memenuhi rubrik kualitas.",
      "skenario": "ERROR-X menyebarkan prompt berkualitas rendah. Agen senior harus memperbaikinya sebelum dikirim ke model AI.",
      "prompt_lemah": "buatkan kode",
      "tugas": "Tulis prompt perbaikan untuk meminta bantuan membuat fungsi Python cek_ancaman(level) yang return True jika level >= 3. Sertakan konteks, bahasa, dan format yang diinginkan.",
      "konteks_wajib": ["fungsi", "Python", "cek_ancaman"],
      "min_panjang_kata": 30,
      "auto_grader": true,
      "mode": "refinement",
      "rubrik": [
        {"kriteria": "perbaikan_spesifik", "bobot": 35, "deskripsi": "Lebih spesifik dari prompt lemah"},
        {"kriteria": "konteks_tambahan", "bobot": 30, "deskripsi": "Menambah konteks yang hilang"},
        {"kriteria": "output_didefinisikan", "bobot": 20, "deskripsi": "Menjelaskan output / format / bahasa kode"},
        {"kriteria": "bahasa_indonesia", "bobot": 15, "deskripsi": "Instruksi jelas berbahasa Indonesia"}
      ],
      "penjelasan": "Refinement prompt adalah keterampilan Direktur SIGMA: evaluasi → perbaiki → uji ulang."
    }
    $$::jsonb,
    28,
    false,
    false,
    'Prompt sampah beredar di jaringan. Satu kalimat malas bisa membuang waktu seluruh regu.'
  ),
  (
    '00000000-0000-0000-0008-000000000007',
    '00000000-0000-0000-0001-000000000007',
    6,
    'Misi 6: Rantai Prompt (Multi-step)',
    'project',
    $$
    {
      "instruksi": "Tulis DUA prompt berurutan: prompt #1 untuk rencana, prompt #2 untuk eksekusi langkah pertama.",
      "skenario": "Menyusun strategi melawan serangan phishing ERROR-X membutuhkan perencanaan, lalu aksi konkret.",
      "tugas": "Prompt 1: minta AI membuat rencana 3 langkah edukasi siswa tentang phishing. Prompt 2: minta AI menulis materi langkah 1 saja (maks 100 kata, Bahasa Indonesia, untuk siswa SMA).",
      "konteks_wajib": ["phishing", "3 langkah", "langkah 1"],
      "min_panjang_kata": 50,
      "auto_grader": true,
      "mode": "multi_prompt",
      "rubrik": [
        {"kriteria": "prompt_1_perencanaan", "bobot": 35, "deskripsi": "Prompt pertama meminta rencana/kerangka"},
        {"kriteria": "prompt_2_eksekusi", "bobot": 35, "deskripsi": "Prompt kedua fokus satu langkah spesifik"},
        {"kriteria": "koherensi", "bobot": 20, "deskripsi": "Kedua prompt saling berhubungan logis"},
        {"kriteria": "bahasa_indonesia", "bobot": 10, "deskripsi": "Bahasa Indonesia jelas di kedua prompt"}
      ],
      "format_pengumpulan": {
        "prompt_1_label": "Prompt Rencana",
        "prompt_2_label": "Prompt Eksekusi Langkah 1"
      },
      "penjelasan": "Prompt chaining memecah masalah besar. Direktur SIGMA tidak menulis satu prompt panjang yang membingungkan AI."
    }
    $$::jsonb,
    30,
    false,
    false,
    'Serangan phishing ERROR-X meningkat. Rencana tanpa eksekusi hanya omong kosong — dua prompt, dua langkah pasti.'
  ),
  (
    '00000000-0000-0000-0008-000000000008',
    '00000000-0000-0000-0001-000000000007',
    7,
    'Tantangan Bos: Prompt Akhir Melawan ERROR-X',
    'project',
    $$
    {
      "instruksi": "Tulis MASTER PROMPT untuk misi akhir: mengajak SIGMA membantu siswa menyusun strategi belajar 7 hari menjelang ujian informatika.",
      "skenario": "ERROR-X akan menyuntikkan instruksi berbahaya ke model jika prompt kamu lemah. Master prompt harus kuat, etis, terstruktur, dan spesifik untuk konteks SMA afirmasi.",
      "tugas": "Gabungkan: peran SIGMA, konteks siswa (SMA, jalur afirmasi, lab & HP), output jadwal 7 hari format tabel/bullet, larangan kecurangan, bahasa Indonesia, dan permintaan evaluasi diri di hari ke-7.",
      "konteks_wajib": ["SIGMA", "7 hari", "afirmasi", "jadwal", "etis"],
      "min_panjang_kata": 80,
      "auto_grader": true,
      "mode_bos": true,
      "rubrik": [
        {"kriteria": "peran_dan_konteks", "bobot": 25, "deskripsi": "Peran SIGMA + konteks siswa SMA afirmasi jelas"},
        {"kriteria": "struktur_output", "bobot": 25, "deskripsi": "Meminta jadwal 7 hari terstruktur"},
        {"kriteria": "etika_belajar", "bobot": 20, "deskripsi": "Larangan kecurangan / jawaban langsung ujian"},
        {"kriteria": "spesifisitas", "bobot": 20, "deskripsi": "Detail cukup untuk jawaban AI yang konsisten"},
        {"kriteria": "bahasa_indonesia", "bobot": 10, "deskripsi": "Instruksi utama berbahasa Indonesia"}
      ],
      "penjelasan_sukses": "Jika rubrik >= 70%, ERROR-X mundur dari server ujian. Kamu resmi menjadi Direktur SIGMA.",
      "penjelasan": "Ini bukan sekadar prompt — ini kontrak antara manusia dan AI. Kualitas prompt menentukan kualitas bantuan."
    }
    $$::jsonb,
    50,
    true,
    false,
    'Pertarungan terakhir di Markas Komando. ERROR-X dan SIGMA berhadapan lewat kata-kata yang KAMU tulis.'
  ),
  (
    '00000000-0000-0000-0008-000000000009',
    '00000000-0000-0000-0001-000000000007',
    8,
    'Tes Akhir: Direktur SIGMA Resmi',
    'multiple_choice',
    '{"is_posttest": true, "soal_count": 10}'::jsonb,
    0,
    false,
    true,
    'Kamu menyelesaikan 7 level SIGMA. Tes akhir mengunci gelar Direktur — dan membuka akses penuh ke chatbot SIGMA di aplikasi!'
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
