import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n';

interface Props { onBack: () => void }

// The standard tajwīd colour rules (matching coloured muṣḥafs and the app's own
// tajweed palette). A learning reference — each rule with its colour, names,
// a short explanation and an example.
const RULES = [
  { color: '#FF7E1E', ar: 'الغُنّة', en: 'Ghunnah', descAr: 'صوتٌ يخرج من الأنف بمقدار حركتين، مع النون والميم المشدّدتين.', descEn: 'A nasal sound held about two counts, on a doubled nūn or mīm.', ex: 'إِنَّ · ثُمَّ' },
  { color: '#1697AE', ar: 'الإدغام', en: 'Idghām — merging', descAr: 'إدخال النون الساكنة أو التنوين فيما بعدها من حروف (ي ر م ل و ن) فتصير حرفًا مشدّدًا.', descEn: 'Merging nūn sākinah / tanwīn into a following ي ر م ل و ن.', ex: 'مِن رَّبِّهِم' },
  { color: '#9400A8', ar: 'الإخفاء', en: 'Ikhfāʾ — hiding', descAr: 'نطق النون الساكنة أو التنوين بصفةٍ بين الإظهار والإدغام مع غُنّة.', descEn: 'Pronouncing nūn sākinah / tanwīn between clear and merged, with ghunnah.', ex: 'مِن قَبْلُ · أَنفُسَكُم' },
  { color: '#26BFFD', ar: 'الإقلاب', en: 'Iqlāb — conversion', descAr: 'قلب النون الساكنة أو التنوين ميمًا مخفاةً بغُنّة إذا جاء بعدها حرف الباء.', descEn: 'Turning nūn sākinah / tanwīn into a hidden mīm (with ghunnah) before ب.', ex: 'مِنۢ بَعْدِ' },
  { color: '#DD0008', ar: 'القلقلة', en: 'Qalqalah — echo', descAr: 'اضطرابٌ خفيف في مخرج الحرف عند سكونه، في حروف: ق ط ب ج د.', descEn: 'A slight bounce/echo on the letters ق ط ب ج د when they carry sukūn.', ex: 'قُلْ · أَحَدْ · الْفَلَق' },
  { color: '#4050FF', ar: 'المدود', en: 'Madd — prolongation', descAr: 'إطالة الصوت بحرف المدّ (ا و ي) بمقدار حركتين أو أربع أو ستّ بحسب نوعه.', descEn: 'Prolonging a vowel (ا و ي) for 2, 4 or 6 counts depending on the rule.', ex: 'قَالَ · الرَّحِيم · الضَّالِّين' },
];

export default function TajweedPage({ onBack }: Props) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Tajwīd colour guide', 'دليل ألوان التجويد')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={dir}>{t('The rules of beautiful recitation', 'قواعد تجويد التلاوة')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-2.5">
        <p className="text-[12px] text-[color:var(--text-muted)] arabic-text leading-relaxed px-1" dir={dir}>
          {t('Tajwīd is reciting the Qur’an as it was revealed — giving each letter its right. These are the common rules and the colours used to mark them.',
             'التجويد هو تلاوة القرآن كما أُنزل، بإعطاء كل حرفٍ حقّه. وهذه أشهر الأحكام والألوان الدالّة عليها.')}
        </p>

        {RULES.map((r) => (
          <div key={r.en} className="glass-card-sm p-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl flex-shrink-0" style={{ background: r.color, boxShadow: `0 2px 10px ${r.color}55` }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold arabic-text" style={{ color: r.color }}>{isAr ? r.ar : r.en}</p>
                <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={dir}>{isAr ? r.en : r.ar}</p>
              </div>
              <p className="arabic-text text-[19px] flex-shrink-0" dir="rtl" style={{ color: r.color }}>{r.ex.split(' · ')[0]}</p>
            </div>
            <p className="text-[12.5px] leading-relaxed arabic-text mt-2.5" dir={dir} style={{ color: 'rgba(var(--text-strong-rgb),0.88)' }}>
              {isAr ? r.descAr : r.descEn}
            </p>
            <p className="arabic-text text-[15px] mt-2 px-3 py-1.5 rounded-lg" dir="rtl"
              style={{ background: `${r.color}14`, color: r.color, border: `1px solid ${r.color}30` }}>
              {r.ex}
            </p>
          </div>
        ))}
        <div className="h-6" />
      </div>
    </div>
  );
}
