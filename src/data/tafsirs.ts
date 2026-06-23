// Curated tafsir sources (ids verified against api.quran.com /resources/tafsirs).

export interface TafsirSource {
  id: number;
  name: string;
  arabicName: string;
  language: 'arabic' | 'english' | 'urdu';
}

export const TAFSIRS: TafsirSource[] = [
  { id: 16, name: 'Tafsir Al-Muyassar', arabicName: 'التفسير الميسّر', language: 'arabic' },
  { id: 91, name: "Tafsir Al-Sa'di", arabicName: 'تفسير السعدي', language: 'arabic' },
  { id: 14, name: 'Tafsir Ibn Kathir', arabicName: 'تفسير ابن كثير', language: 'arabic' },
  { id: 15, name: 'Tafsir Al-Tabari', arabicName: 'تفسير الطبري', language: 'arabic' },
  { id: 90, name: 'Tafsir Al-Qurtubi', arabicName: 'تفسير القرطبي', language: 'arabic' },
  { id: 94, name: 'Tafsir Al-Baghawi', arabicName: 'تفسير البغوي', language: 'arabic' },
  { id: 169, name: 'Ibn Kathir (Abridged)', arabicName: 'ابن كثير — إنجليزي', language: 'english' },
];

export const DEFAULT_TAFSIR_ID = 16; // Al-Muyassar (concise Arabic)

export function getTafsir(id: number | undefined): TafsirSource {
  return TAFSIRS.find((t) => t.id === id) ?? TAFSIRS[0];
}
