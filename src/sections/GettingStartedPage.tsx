import { ArrowLeft, Star, Heart, PersonStanding, BookText, HandHeart, Sparkles, Check } from 'lucide-react';
import type { Page } from '@/types';
import { SpeakButton } from '@/components/SpeakButton';
import { useI18n } from '@/i18n';

interface Props { onBack: () => void; onNavigate: (p: Page) => void }

export default function GettingStartedPage({ onBack, onNavigate }: Props) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const pillars = [
    t('Shahādah — bearing witness that there is no god but Allah and Muhammad ﷺ is His Messenger.', 'الشهادة — أن تشهد أن لا إله إلا الله وأن محمدًا رسول الله ﷺ.'),
    t('Ṣalāh — the five daily prayers.', 'الصلاة — الصلوات الخمس كل يوم.'),
    t('Zakāh — giving a set share of your wealth to those in need.', 'الزكاة — إخراج قدرٍ من المال للمحتاجين.'),
    t('Ṣawm — fasting the month of Ramadan.', 'الصيام — صيام شهر رمضان.'),
    t('Ḥajj — pilgrimage to Makkah, once, for whoever is able.', 'الحج — إلى مكة مرةً لمن استطاع إليه سبيلاً.'),
  ];
  const beliefs = [
    t('Allah — the One God, with no partner.', 'الله — الإله الواحد لا شريك له.'),
    t('His angels.', 'وملائكته.'),
    t('His revealed books (the Qur’an, and those before it).', 'وكتبه المنزّلة (القرآن وما قبله).'),
    t('His messengers (from Adam to Muhammad ﷺ).', 'ورسله (من آدم إلى محمد ﷺ).'),
    t('The Last Day.', 'واليوم الآخر.'),
    t('Divine decree — the good and the bad are from Allah.', 'والقدر خيره وشره من الله.'),
  ];
  const steps = [
    t('Take a full bath (ghusl) with the intention of starting fresh.', 'اغتسل غُسلًا كاملًا بنيّة البداية الطاهرة.'),
    t('Learn wuḍūʾ and how to pray — start with the five daily prayers.', 'تعلّم الوضوء وكيفية الصلاة — وابدأ بالصلوات الخمس.'),
    t('Begin reading the Qur’an, a little each day.', 'ابدأ بقراءة القرآن قليلًا كل يوم.'),
    t('Learn the daily adhkār and duʿāʾ.', 'تعلّم الأذكار والأدعية اليومية.'),
    t('Keep good, sincere company and ask people of knowledge.', 'اصحب أهل الخير، واسأل أهل العلم.'),
    t('Be gentle with yourself — take it step by step.', 'ترفّق بنفسك — خطوة بخطوة.'),
  ];

  const Section = ({ icon: Icon, title, children }: { icon: typeof Star; title: string; children: React.ReactNode }) => (
    <div className="glass-card-sm p-4 space-y-2.5">
      <h3 className="text-sm font-semibold text-white arabic-text flex items-center gap-2">
        <Icon size={15} className="text-[#14879c]" /> {title}
      </h3>
      {children}
    </div>
  );

  const Item = ({ text }: { text: string }) => (
    <div className="flex items-start gap-2.5">
      <span className="w-5 h-5 mt-0.5 rounded-full bg-[#14879c]/15 flex items-center justify-center flex-shrink-0"><Check size={11} className="text-[#14879c]" /></span>
      <p className="text-[13px] leading-relaxed arabic-text flex-1" dir={dir} style={{ color: 'rgba(var(--text-strong-rgb),0.9)' }}>{text}</p>
    </div>
  );

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Welcome to Islam', 'مرحبًا بك في الإسلام')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={dir}>{t('A gentle first guide', 'دليلٌ أوّلٌ ميسّر')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-3">
        {/* Shahada */}
        <div className="glass-card p-5 text-center space-y-2.5" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#d4af37]">{t('The testimony of faith', 'شهادة الإيمان')}</p>
          <p className="arabic-text text-white leading-loose" dir="rtl" style={{ fontSize: 'clamp(20px, 6vw, 28px)' }}>أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ</p>
          <div className="flex justify-center"><SpeakButton text="أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ" lang="ar-SA" size={16} /></div>
          <p className="text-[12px] text-[#14879c] italic" dir="ltr">Ashhadu an lā ilāha illa-llāh, wa ashhadu anna Muḥammadan rasūlu-llāh</p>
          <p className="text-[13px] arabic-text leading-relaxed" dir={dir} style={{ color: 'rgba(var(--text-strong-rgb),0.9)' }}>
            {t('“I bear witness that there is no god but Allah, and I bear witness that Muhammad is the Messenger of Allah.” Say it with sincerity and belief — and you are a Muslim.',
               '«أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله». قُلها بصدقٍ ويقين — فتكون مسلمًا.')}
          </p>
          <p className="text-[11px] text-[#d4af37] arabic-text pt-1.5 border-t border-white/5" dir={dir}>
            {t('When a person accepts Islam sincerely, Allah forgives all that came before it.', 'من أسلم صادقًا غفر الله له ما سبق من ذنوبه.')}
          </p>
        </div>

        <Section icon={Sparkles} title={t('What you now believe', 'ما الذي تؤمن به الآن')}>
          {beliefs.map((b, i) => <Item key={i} text={b} />)}
        </Section>

        <Section icon={Star} title={t('The five pillars of Islam', 'أركان الإسلام الخمسة')}>
          {pillars.map((p, i) => <Item key={i} text={p} />)}
        </Section>

        <Section icon={Heart} title={t('Your first steps', 'خطواتك الأولى')}>
          {steps.map((s, i) => <Item key={i} text={s} />)}
        </Section>

        {/* Quick links to the tools that help */}
        <div className="grid grid-cols-1 gap-2">
          <LinkBtn icon={PersonStanding} label={t('Learn to Pray', 'تعلّم الصلاة')} onClick={() => onNavigate('prayer-learn')} />
          <LinkBtn icon={BookText} label={t('The Muslim’s Guide', 'دليل المسلم')} onClick={() => onNavigate('guide')} />
          <LinkBtn icon={HandHeart} label={t('Duʿāʾ for every situation', 'أدعية لكل موقف')} onClick={() => onNavigate('duas')} />
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
}

function LinkBtn({ icon: Icon, label, onClick }: { icon: typeof Star; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass-card-sm w-full p-3.5 flex items-center gap-3 text-left">
      <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-[#d4af37]" /></div>
      <p className="flex-1 text-sm font-medium text-white arabic-text">{label}</p>
    </button>
  );
}
