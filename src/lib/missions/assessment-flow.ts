import type { JsonValue } from '@/types';

export type AssessmentType = 'pretest' | 'posttest';

export type AssessmentOption = {
  id: string;
  label: string;
};

export type AssessmentQuestion = {
  id: string;
  urutan: number;
  pertanyaan: string;
  pilihan: AssessmentOption[];
  jawabanBenar: string;
};

export type PublicAssessmentQuestion = Omit<AssessmentQuestion, 'jawabanBenar'>;

type SoalRow = {
  id: string;
  urutan: number;
  pertanyaan: string;
  pilihan_json: JsonValue | null;
  jawaban_benar: JsonValue;
};

const LETTERS = ['a', 'b', 'c', 'd'];

const GENERIC_QUESTIONS = [
  {
    pertanyaan: 'Apa tujuan utama algoritma dalam menyelesaikan masalah?',
    pilihan: [
      'Membuat urutan langkah yang jelas dan logis',
      'Menghapus semua data sebelum diproses',
      'Membuat komputer menebak jawaban acak',
      'Mengganti semua instruksi dengan gambar',
    ],
    jawabanBenar: 'a',
  },
  {
    pertanyaan: 'Bagian prompt mana yang paling membantu AI memahami tugas?',
    pilihan: [
      'Konteks, tujuan, batasan, dan format jawaban',
      'Huruf kapital sebanyak mungkin',
      'Instruksi yang sengaja dibuat ambigu',
      'Pesan tanpa topik yang jelas',
    ],
    jawabanBenar: 'a',
  },
  {
    pertanyaan: 'Mengapa debugging penting saat belajar coding?',
    pilihan: [
      'Untuk menemukan dan memperbaiki sumber kesalahan',
      'Untuk menghindari membaca kode sendiri',
      'Untuk membuat program selalu lebih lambat',
      'Untuk menghapus semua komentar',
    ],
    jawabanBenar: 'a',
  },
  {
    pertanyaan: 'Apa ciri instruksi yang baik untuk komputer atau AI?',
    pilihan: [
      'Spesifik, terurut, dan bisa diuji hasilnya',
      'Panjang tetapi tidak punya tujuan',
      'Mengandung banyak istilah tanpa makna',
      'Selalu memakai bahasa campur acak',
    ],
    jawabanBenar: 'a',
  },
  {
    pertanyaan:
      'Jika output belum sesuai, langkah terbaik berikutnya adalah...',
    pilihan: [
      'Menganalisis penyebabnya lalu memperbaiki instruksi',
      'Mengirim prompt yang sama terus-menerus',
      'Menghapus konteks penting',
      'Langsung menyalahkan alatnya',
    ],
    jawabanBenar: 'a',
  },
  {
    pertanyaan: 'Apa manfaat memecah masalah besar menjadi bagian kecil?',
    pilihan: [
      'Setiap bagian lebih mudah dipahami, diuji, dan diperbaiki',
      'Masalah menjadi tidak perlu diselesaikan',
      'Semua jawaban otomatis benar',
      'Program tidak lagi perlu instruksi',
    ],
    jawabanBenar: 'a',
  },
  {
    pertanyaan: 'Apa yang dimaksud evaluasi output AI?',
    pilihan: [
      'Memeriksa apakah jawaban AI sesuai tujuan dan kriteria',
      'Membaca jawaban tanpa menilai kualitasnya',
      'Menerima semua jawaban AI apa adanya',
      'Menghapus bagian yang paling jelas',
    ],
    jawabanBenar: 'a',
  },
  {
    pertanyaan: 'Mengapa contoh output sering ditambahkan dalam prompt?',
    pilihan: [
      'Agar AI memahami gaya, struktur, dan tingkat detail yang diharapkan',
      'Agar prompt terlihat lebih panjang saja',
      'Agar AI tidak perlu membaca instruksi utama',
      'Agar jawaban selalu menjadi kode',
    ],
    jawabanBenar: 'a',
  },
  {
    pertanyaan: 'Apa arti sebuah misi dianggap selesai dengan baik?',
    pilihan: [
      'Jawaban memenuhi tujuan, aturan, dan kriteria penilaian',
      'Jawaban dikirim tanpa membaca instruksi',
      'Jawaban paling pendek selalu benar',
      'Jawaban tidak perlu diuji',
    ],
    jawabanBenar: 'a',
  },
  {
    pertanyaan:
      'Sikap belajar yang paling tepat saat skor belum maksimal adalah...',
    pilihan: [
      'Melihat umpan balik dan mencoba strategi yang lebih baik',
      'Berhenti karena kesalahan tidak boleh terjadi',
      'Mengabaikan rubrik penilaian',
      'Menebak semua jawaban berikutnya',
    ],
    jawabanBenar: 'a',
  },
] as const;

function getRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, JsonValue>;
}

function parseOptions(value: JsonValue | null | undefined): AssessmentOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): AssessmentOption | null => {
      if (typeof item === 'string') {
        return {
          id: LETTERS[index] ?? String(index + 1),
          label: item,
        };
      }

      const option = getRecord(item);
      if (!option) return null;

      const id =
        typeof option.id === 'string'
          ? option.id
          : (LETTERS[index] ?? String(index + 1));
      const label =
        typeof option.label === 'string'
          ? option.label
          : typeof option.teks === 'string'
            ? option.teks
            : typeof option.text === 'string'
              ? option.text
              : null;

      return label ? { id, label } : null;
    })
    .filter((option): option is AssessmentOption => option !== null);
}

function parseCorrectAnswer(value: JsonValue): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return null;
}

export function getAssessmentType(
  kontenJson: JsonValue
): AssessmentType | null {
  const data = getRecord(kontenJson);
  if (!data) return null;

  if (data.is_pretest === true) return 'pretest';
  if (data.is_posttest === true) return 'posttest';

  return null;
}

export function buildAssessmentQuestions(
  rows: SoalRow[],
  levelNomor: number,
  levelNama: string,
  type: AssessmentType
): AssessmentQuestion[] {
  const parsedRows = rows
    .map((row): AssessmentQuestion | null => {
      const pilihan = parseOptions(row.pilihan_json);
      const jawabanBenar = parseCorrectAnswer(row.jawaban_benar);

      if (pilihan.length < 2 || !jawabanBenar) {
        return null;
      }

      return {
        id: row.id,
        urutan: row.urutan,
        pertanyaan: row.pertanyaan,
        pilihan,
        jawabanBenar,
      };
    })
    .filter((question): question is AssessmentQuestion => question !== null)
    .sort((a, b) => a.urutan - b.urutan);

  if (parsedRows.length >= 10) {
    return parsedRows.slice(0, 10);
  }

  const prefix =
    type === 'pretest'
      ? `Tes awal Level ${levelNomor}: ${levelNama}.`
      : `Tes akhir Level ${levelNomor}: ${levelNama}.`;

  return GENERIC_QUESTIONS.map((question, index) => ({
    id: `fallback-${levelNomor}-${type}-${index + 1}`,
    urutan: index + 1,
    pertanyaan: `${prefix} ${question.pertanyaan}`,
    pilihan: question.pilihan.map((label, optionIndex) => ({
      id: LETTERS[optionIndex] ?? String(optionIndex + 1),
      label,
    })),
    jawabanBenar: question.jawabanBenar,
  }));
}

export function toPublicQuestions(
  questions: AssessmentQuestion[]
): PublicAssessmentQuestion[] {
  return questions.map(
    ({ jawabanBenar: _jawabanBenar, ...question }) => question
  );
}

export function scoreAssessment(
  questions: AssessmentQuestion[],
  answers: Record<string, string>
): { score: number; correctCount: number; totalQuestions: number } {
  const totalQuestions = questions.length;
  const correctCount = questions.filter(
    (question) => answers[question.id] === question.jawabanBenar
  ).length;

  return {
    score:
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 10000) / 100
        : 0,
    correctCount,
    totalQuestions,
  };
}
