# AIjarin

**Gamified, AI-powered LMS** untuk siswa jalur afirmasi — pilot di **SMA Negeri 20 Surabaya**.

Siswa berperan sebagai **Agen SIGMA** (Satuan Intelijen Generasi Muda Algoritma) yang mempelajari logika komputasi sambil mengalahkan virus digital **ERROR-X**.

## Konteks proyek

| Aspek | Detail |
|--------|--------|
| Audiens | Siswa SMA jalur afirmasi, perangkat & jaringan terbatas (2G/3G) |
| Bahasa UI | Bahasa Indonesia, sapaan **kamu**, nada kakak yang mendukung |
| Narasi | 7 level dari Rekrut SIGMA → Direktur SIGMA |
| Biaya | Target &lt; $5/bulan (Vercel + Supabase free tier) |

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI:** Anthropic Claude (Haiku) — chatbot & auto-grader
- **Deploy:** Vercel + Supabase

## Memulai

```bash
cp .env.example .env.local
# isi variabel Supabase & Anthropic

npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Struktur repositori

Lihat [docs/BLUEPRINT.md](docs/BLUEPRINT.md) untuk panduan pengembangan lengkap (micro-blocks, schema DB, RBAC).

## Lisensi

Proyek pendidikan — hak cipta mengikuti kebijakan institusi pilot.
