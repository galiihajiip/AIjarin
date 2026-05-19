/** Email otomatis dari NISN untuk pendaftaran siswa pilot. */
export function generateSiswaEmailFromNisn(nisn: string): string {
  return `${nisn.trim()}@siswa.aijarin.id`;
}
