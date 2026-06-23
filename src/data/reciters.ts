// Reciters available via the Quran Foundation API (api.quran.com).
//
// `apiId` is the API's recitation id (used to fetch per-ayah audio + word-timing
// segments). `id` is a stable slug stored in settings so reordering this list
// never changes a user's saved choice.

export interface Reciter {
  id: string;
  apiId: number;
  name: string;
  arabicName: string;
  style?: 'Murattal' | 'Mujawwad' | 'Muallim';
  /** everyayah.com data folder for per-ayah audio (reciters not on the quran.com
   *  API). These play + download per ayah but have no word-by-word highlight. */
  everyayah?: string;
}

const pad3 = (n: number) => String(n).padStart(3, '0');
/** Per-ayah audio URL on everyayah.com (verified CORS-enabled). */
export function everyayahUrl(folder: string, surah: number, ayah: number): string {
  return `https://everyayah.com/data/${folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

export const RECITERS: Reciter[] = [
  { id: 'minshawi_murattal', apiId: 9, name: 'Al-Minshawi · Murattal', arabicName: 'محمد صدّيق المنشاوي · مُرتّل', style: 'Murattal' },
  { id: 'minshawi_mujawwad', apiId: 8, name: 'Al-Minshawi · Mujawwad', arabicName: 'محمد صدّيق المنشاوي · مُجوّد', style: 'Mujawwad' },
  { id: 'abdulbasit_murattal', apiId: 2, name: 'AbdulBasit · Murattal', arabicName: 'عبد الباسط عبد الصمد · مُرتّل', style: 'Murattal' },
  { id: 'abdulbasit_mujawwad', apiId: 1, name: 'AbdulBasit · Mujawwad', arabicName: 'عبد الباسط عبد الصمد · مُجوّد', style: 'Mujawwad' },
  { id: 'husary', apiId: 6, name: 'Mahmoud Al-Husary', arabicName: 'محمود خليل الحُصري', style: 'Murattal' },
  { id: 'husary_muallim', apiId: 12, name: 'Al-Husary · Muallim', arabicName: 'الحُصري · المُعلّم', style: 'Muallim' },
  { id: 'afasy', apiId: 7, name: 'Mishary Al-Afasy', arabicName: 'مشاري راشد العفاسي', style: 'Murattal' },
  { id: 'sudais', apiId: 3, name: 'Abdur-Rahman As-Sudais', arabicName: 'عبد الرحمن السديس', style: 'Murattal' },
  { id: 'shatri', apiId: 4, name: 'Abu Bakr Ash-Shatri', arabicName: 'أبو بكر الشاطري', style: 'Murattal' },
  { id: 'hani_rifai', apiId: 5, name: 'Hani Ar-Rifai', arabicName: 'هاني الرفاعي', style: 'Murattal' },
  { id: 'shuraim', apiId: 10, name: 'Saud Ash-Shuraim', arabicName: 'سعود الشريم', style: 'Murattal' },
  { id: 'tablawi', apiId: 11, name: 'Mohamed Al-Tablawi', arabicName: 'محمد الطبلاوي', style: 'Murattal' },
  // everyayah-sourced reciters (per-ayah audio; no word-by-word highlight):
  { id: 'maher', apiId: 101, name: 'Maher Al-Muaiqly', arabicName: 'ماهر المعيقلي', style: 'Murattal', everyayah: 'Maher_AlMuaiqly_64kbps' },
  { id: 'dossari', apiId: 102, name: 'Yasser Al-Dossari', arabicName: 'ياسر الدوسري', style: 'Murattal', everyayah: 'Yasser_Ad-Dussary_128kbps' },
];

export const DEFAULT_RECITER_ID = 'minshawi_murattal';

export function getReciter(id: string | undefined): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
}
