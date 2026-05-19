# AIjarin — Master Blueprint (ringkasan)

Versi referensi untuk sesi coding AI. Detail penuh ada di prompt master proyek.

## Prinsip wajib

1. UI ringan — cepat di 2G/3G dan perangkat low-spec
2. Semua teks pengguna dalam **Bahasa Indonesia**, sapaan **kamu**
3. Nada: empatik, ramah, memotivasi (seperti kakak)
4. Arsitektur: Vercel + Supabase free tier, biaya &lt; $5/bulan
5. TypeScript production-quality; commit per micro-block saja

## Level & kurikulum (Agen SIGMA)

| Lv | Nama | Konsep | Mekanik |
|----|------|--------|---------|
| 1 | Rekrut SIGMA | Algoritma & sekuensi | Drag-and-drop |
| 2 | Analis Data | Variabel & tipe data | DnD + fill-in-blank |
| 3 | Detektif Logika | IF/ELSE | Fill-in-blank |
| 4 | Komandan Sistem | Loops | Fill-in-blank + typing terbatas |
| 5 | Insinyur AI | Fungsi & modularitas | Code guided |
| 6 | Agen Senior | Array & struktur data | Full typing |
| 7 | Direktur SIGMA | AI & prompting | Project challenge |

Setiap level: pre-test → 5–7 misi → boss → post-test (N-Gain).

## Peran (RBAC)

- **siswa** — dashboard, misi, leaderboard
- **guru** — monitoring siswa, analitik
- **admin** — sekolah, kurikulum

## Fase pengembangan (urutan disarankan)

- **Phase 0** — Scaffold, schema DB, auth (commit ini)
- **Phase 1** — Auth + profil siswa
- **Phase 2** — Level 1 misi (drag-and-drop)
- **Phase 3** — Gamifikasi (XP, badge, streak)
- **Phase 4** — Chatbot Claude
- **Phase 5** — Dashboard guru & N-Gain

## Environment

Salin `.env.example` → `.env.local`. Jangan commit secret.
