import type { JsonValue } from '@/types';

export type ProjectRubricItem = {
  kriteria: string;
  bobot: number;
  deskripsi: string;
};

export type ProjectContent = {
  instruksi: string;
  skenario?: string;
  tugas: string;
  konteksWajib: string[];
  minPanjangKata: number;
  penjelasan: string;
  penjelasanSukses?: string;
  contohPromptLemah?: string;
  contohPromptKuat?: string;
  promptLemah?: string;
  mode?: string;
  rubrik: ProjectRubricItem[];
};

function getRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, JsonValue>;
}

function parseRubrik(value: JsonValue | undefined): ProjectRubricItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ProjectRubricItem | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const row = item as Record<string, JsonValue>;
      if (
        typeof row.kriteria !== 'string' ||
        typeof row.deskripsi !== 'string'
      ) {
        return null;
      }

      const bobot = typeof row.bobot === 'number' ? row.bobot : 0;
      return {
        kriteria: row.kriteria,
        bobot,
        deskripsi: row.deskripsi,
      };
    })
    .filter((item): item is ProjectRubricItem => item !== null);
}

export function parseProjectContent(
  kontenJson: JsonValue
): ProjectContent | null {
  const data = getRecord(kontenJson);

  if (!data || typeof data.instruksi !== 'string') {
    return null;
  }

  const tugas =
    typeof data.tugas === 'string'
      ? data.tugas
      : typeof data.instruksi === 'string'
        ? data.instruksi
        : null;

  if (!tugas) return null;

  const konteksWajib = Array.isArray(data.konteks_wajib)
    ? data.konteks_wajib.filter(
        (item): item is string => typeof item === 'string'
      )
    : [];

  return {
    instruksi: data.instruksi,
    skenario: typeof data.skenario === 'string' ? data.skenario : undefined,
    tugas,
    konteksWajib,
    minPanjangKata:
      typeof data.min_panjang_kata === 'number' ? data.min_panjang_kata : 30,
    penjelasan:
      typeof data.penjelasan === 'string'
        ? data.penjelasan
        : 'Prompt yang baik memberi peran, konteks, dan format output yang jelas.',
    penjelasanSukses:
      typeof data.penjelasan_sukses === 'string'
        ? data.penjelasan_sukses
        : undefined,
    contohPromptLemah:
      typeof data.contoh_prompt_lemah === 'string'
        ? data.contoh_prompt_lemah
        : typeof data.prompt_lemah === 'string'
          ? data.prompt_lemah
          : undefined,
    contohPromptKuat:
      typeof data.contoh_prompt_kuat === 'string'
        ? data.contoh_prompt_kuat
        : undefined,
    promptLemah:
      typeof data.prompt_lemah === 'string' ? data.prompt_lemah : undefined,
    mode: typeof data.mode === 'string' ? data.mode : undefined,
    rubrik: parseRubrik(data.rubrik),
  };
}
