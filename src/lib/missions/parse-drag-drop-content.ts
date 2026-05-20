import type { JsonValue } from '@/types';

export type DragDropBlock = {
  id: string;
  label: string;
  icon: string;
};

export type DragDropContent = {
  instruksi: string;
  konteks?: string;
  blok_tersedia: DragDropBlock[];
  urutan_benar: string[];
  penjelasan_salah: string;
  penjelasan_benar: string;
};

function isBlock(value: unknown): value is DragDropBlock {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.label === 'string';
}

export function parseDragDropContent(
  kontenJson: JsonValue
): DragDropContent | null {
  if (
    !kontenJson ||
    typeof kontenJson !== 'object' ||
    Array.isArray(kontenJson)
  ) {
    return null;
  }

  const data = kontenJson as Record<string, unknown>;

  if (
    typeof data.instruksi !== 'string' ||
    !Array.isArray(data.blok_tersedia) ||
    !Array.isArray(data.urutan_benar)
  ) {
    return null;
  }

  const blok_tersedia = data.blok_tersedia.filter(isBlock).map((block) => ({
    id: block.id,
    label: block.label,
    icon: typeof block.icon === 'string' ? block.icon : '',
  }));
  const urutan_benar = data.urutan_benar.filter(
    (id): id is string => typeof id === 'string'
  );

  if (blok_tersedia.length === 0 || urutan_benar.length === 0) {
    return null;
  }

  return {
    instruksi: data.instruksi,
    konteks: typeof data.konteks === 'string' ? data.konteks : undefined,
    blok_tersedia,
    urutan_benar,
    penjelasan_salah:
      typeof data.penjelasan_salah === 'string'
        ? data.penjelasan_salah
        : 'Urutan belum tepat. Coba lagi ya!',
    penjelasan_benar:
      typeof data.penjelasan_benar === 'string'
        ? data.penjelasan_benar
        : 'Mantap! Urutanmu sudah benar.',
  };
}
