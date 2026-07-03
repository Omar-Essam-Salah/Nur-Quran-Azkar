// Content for the "Learn" section: step-by-step Wudū and Ṣalāh (with the
// authentic adhkār said at each step), plus the "Muḥkamāt" reference (key
// verses, verses of rulings, and the muḥkam/mutashābih concept).
//
// Sources: the postures and wordings follow the well-known authentic Sunnah
// (Bukhārī/Muslim and the Sunan). Qur'anic text itself is rendered from the
// bundled offline mushaf by surah:ayah, so it is always the verified text.
// Language is kept simple on purpose — friendly to children and to non-Arabic
// speakers (every recitation has a transliteration + meaning).

export interface LearnStep {
  id: string;
  pose: string;            // → LearnFigure
  titleAr: string; titleEn: string;
  descAr: string; descEn: string;   // what to do, in simple words
  sayAr?: string;          // what to recite (Arabic)
  translit?: string;       // transliteration (for non-Arabic speakers)
  sayEn?: string;          // meaning
  repeat?: string;         // e.g. "×3"
  middle?: boolean;        // only applies to 3/4-rakʿah prayers
}

export const WUDU_STEPS: LearnStep[] = [
  {
    id: 'niyyah', pose: 'niyyah',
    titleAr: 'النيّة والتسمية', titleEn: 'Intention & Bismillah',
    descAr: 'انوِ في قلبك أنّك تتوضّأ لله، وقل: «بسم الله».',
    descEn: 'Make the intention in your heart to perform wudū for Allah, and say “Bismillah.”',
    sayAr: 'بِسْمِ اللَّهِ', translit: 'Bismillah', sayEn: 'In the name of Allah.',
  },
  {
    id: 'hands', pose: 'hands',
    titleAr: 'غسل الكفّين', titleEn: 'Wash the hands',
    descAr: 'اغسل كفّيك ثلاث مرّات، وخلّل بين أصابعك.',
    descEn: 'Wash both hands up to the wrists three times, passing water between the fingers.',
    repeat: '×3',
  },
  {
    id: 'mouth', pose: 'mouth',
    titleAr: 'المضمضة', titleEn: 'Rinse the mouth',
    descAr: 'خذ ماءً بيدك اليمنى وتمضمض ثلاث مرّات.',
    descEn: 'Take water with your right hand and rinse your mouth three times.',
    repeat: '×3',
  },
  {
    id: 'nose', pose: 'nose',
    titleAr: 'الاستنشاق', titleEn: 'Rinse the nose',
    descAr: 'استنشق الماء برفقٍ ثمّ أخرجه (انثره) ثلاث مرّات.',
    descEn: 'Gently draw water into your nose, then blow it out, three times.',
    repeat: '×3',
  },
  {
    id: 'face', pose: 'face',
    titleAr: 'غسل الوجه', titleEn: 'Wash the face',
    descAr: 'اغسل وجهك كاملًا، من منبت الشعر إلى الذقن، ثلاث مرّات.',
    descEn: 'Wash your whole face — from the hairline to the chin and ear to ear — three times.',
    repeat: '×3',
  },
  {
    id: 'arms', pose: 'arms',
    titleAr: 'غسل اليدين إلى المرفقين', titleEn: 'Wash the arms',
    descAr: 'اغسل يدك اليمنى إلى المرفق ثلاثًا، ثمّ اليسرى مثلها.',
    descEn: 'Wash your right arm up to and including the elbow three times, then the left the same.',
    repeat: '×3',
  },
  {
    id: 'head', pose: 'head',
    titleAr: 'مسح الرأس', titleEn: 'Wipe the head',
    descAr: 'بلّل يديك وامسح رأسك من الأمام إلى الخلف ثمّ أعِدْهما، مرّة واحدة.',
    descEn: 'With wet hands, wipe over your head from front to back and back again, once.',
    repeat: '×1',
  },
  {
    id: 'ears', pose: 'ears',
    titleAr: 'مسح الأذنين', titleEn: 'Wipe the ears',
    descAr: 'امسح داخل أذنيك بالسبّابتين وظاهرهما بالإبهامين، مرّة واحدة.',
    descEn: 'Wipe the inside of your ears with your index fingers and the outside with your thumbs, once.',
    repeat: '×1',
  },
  {
    id: 'feet', pose: 'feet',
    titleAr: 'غسل الرجلين إلى الكعبين', titleEn: 'Wash the feet',
    descAr: 'اغسل قدمك اليمنى إلى الكعبين ثلاثًا وخلّل أصابعها، ثمّ اليسرى مثلها.',
    descEn: 'Wash your right foot up to and including the ankles three times, passing water between the toes, then the left the same.',
    repeat: '×3',
  },
  {
    id: 'shahada', pose: 'shahada',
    titleAr: 'الدعاء بعد الوضوء', titleEn: 'Supplication after wudū',
    descAr: 'ارفع نظرك إلى السماء وقل الشهادة، تُفتح لك أبواب الجنّة الثمانية.',
    descEn: 'Look upward and say the testimony — the eight gates of Paradise are opened for you.',
    sayAr: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    translit: 'Ashhadu an lā ilāha illa-llāh, waḥdahu lā sharīka lah, wa ashhadu anna Muḥammadan ʿabduhu wa rasūluh',
    sayEn: 'I bear witness that there is no god but Allah alone, with no partner, and I bear witness that Muhammad is His servant and messenger.',
  },
];

export const PRAYER_STEPS: LearnStep[] = [
  {
    id: 'niyyah', pose: 'qiyam',
    titleAr: 'النيّة واستقبال القبلة', titleEn: 'Intention & facing the Qibla',
    descAr: 'قف مستقبلًا القبلة، وانوِ في قلبك الصلاة التي تريد أن تصلّيها.',
    descEn: 'Stand facing the Qibla and make the intention in your heart for the prayer you wish to offer.',
  },
  {
    id: 'takbir', pose: 'takbir',
    titleAr: 'تكبيرة الإحرام', titleEn: 'Opening Takbīr',
    descAr: 'ارفع يديك إلى أذنيك أو كتفيك وكبّر، بهذا تبدأ الصلاة.',
    descEn: 'Raise your hands to your ears or shoulders and say the Takbīr — this begins the prayer.',
    sayAr: 'اللَّهُ أَكْبَرُ', translit: 'Allāhu Akbar', sayEn: 'Allah is the Greatest.',
  },
  {
    id: 'qiyam', pose: 'qiyam',
    titleAr: 'القيام والقراءة', titleEn: 'Standing & recitation',
    descAr: 'ضع يدك اليمنى على اليسرى على صدرك، واقرأ دعاء الاستفتاح ثمّ الفاتحة ثمّ ما تيسّر من القرآن.',
    descEn: 'Place your right hand over your left on your chest. Say the opening supplication, then Al-Fātiḥah, then a passage of the Qur’an.',
    sayAr: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ',
    translit: 'Subḥānaka-llāhumma wa biḥamdik, wa tabāraka-smuk, wa taʿālā jadduk, wa lā ilāha ghayruk',
    sayEn: 'Glory be to You, O Allah, and praise; blessed is Your name, exalted is Your majesty, and there is no god but You.',
  },
  {
    id: 'ruku', pose: 'ruku',
    titleAr: 'الركوع', titleEn: 'Bowing (Rukūʿ)',
    descAr: 'كبّر وانحنِ حتى يستوي ظهرك وتضع يديك على ركبتيك، وقل ثلاثًا:',
    descEn: 'Say the Takbīr and bow until your back is level, placing your hands on your knees, and say three times:',
    sayAr: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', translit: 'Subḥāna rabbiya-l-ʿAẓīm', sayEn: 'Glory to my Lord, the Most Great.', repeat: '×3',
  },
  {
    id: 'itidal', pose: 'itidal',
    titleAr: 'الرفع من الركوع', titleEn: 'Rising from bowing',
    descAr: 'ارفع من الركوع حتى تعتدل قائمًا، قائلًا عند الرفع ثمّ بعد الاعتدال:',
    descEn: 'Rise from bowing until you stand upright, saying while rising and then once standing:',
    sayAr: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ، رَبَّنَا وَلَكَ الْحَمْدُ',
    translit: 'Samiʿa-llāhu liman ḥamidah, rabbanā wa laka-l-ḥamd',
    sayEn: 'Allah hears whoever praises Him. Our Lord, to You is all praise.',
  },
  {
    id: 'sujud', pose: 'sujud',
    titleAr: 'السجود', titleEn: 'Prostration (Sujūd)',
    descAr: 'كبّر واسجد على سبعة أعضاء: الجبهة والأنف، والكفّين، والركبتين، وأطراف القدمين، وقل ثلاثًا:',
    descEn: 'Say the Takbīr and prostrate on seven points: forehead and nose, both palms, both knees, and the toes of both feet, and say three times:',
    sayAr: 'سُبْحَانَ رَبِّيَ الْأَعْلَى', translit: 'Subḥāna rabbiya-l-Aʿlā', sayEn: 'Glory to my Lord, the Most High.', repeat: '×3',
  },
  {
    id: 'julus', pose: 'julus',
    titleAr: 'الجلوس بين السجدتين', titleEn: 'Sitting between the prostrations',
    descAr: 'اجلس مطمئنًّا وقل، ثمّ اسجد السجدة الثانية مثل الأولى.',
    descEn: 'Sit calmly and say the following, then make the second prostration like the first.',
    sayAr: 'رَبِّ اغْفِرْ لِي', translit: 'Rabbi-ghfir lī', sayEn: 'My Lord, forgive me.',
  },
  {
    id: 'middle-tashahhud', pose: 'julus', middle: true,
    titleAr: 'التشهّد الأوسط', titleEn: 'The Middle Tashahhud',
    descAr: 'خاصٌّ بالصلوات ذات ٣ أو ٤ ركعات (الظهر، العصر، المغرب، العشاء): بعد الركعة الثانية اجلس واقرأ التشهّد فقط (بدون الصلاة الإبراهيمية)، ثمّ قُم مكبّرًا لإكمال باقي الصلاة. أمّا الفجر فركعتان وليس فيه تشهّدٌ أوسط.',
    descEn: 'For prayers of 3 or 4 rakʿahs (Dhuhr, Asr, Maghrib, Isha) only: after the second rakʿah, sit and recite the Tashahhud ONLY (without the prayer upon the Prophet), then stand with the Takbīr to complete the prayer. Fajr is two rakʿahs and has no middle Tashahhud.',
    sayAr: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    translit: 'At-taḥiyyātu lillāhi waṣ-ṣalawātu waṭ-ṭayyibāt … ashhadu an lā ilāha illa-llāh, wa ashhadu anna Muḥammadan ʿabduhu wa rasūluh',
    sayEn: 'All greetings, prayers and good things are for Allah … I bear witness that there is no god but Allah, and that Muhammad is His servant and messenger.',
  },
  {
    id: 'tashahhud', pose: 'tashahhud',
    titleAr: 'التشهّد الأخير', titleEn: 'The Final Tashahhud',
    descAr: 'في الجلوس الأخير اجلس وارفع سبّابتك، واقرأ التشهّد ثمّ الصلاة الإبراهيمية على النبيّ ﷺ.',
    descEn: 'In the final sitting, raise your index finger and recite the Tashahhud, then the prayer upon the Prophet ﷺ.',
    sayAr: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    translit: 'At-taḥiyyātu lillāhi waṣ-ṣalawātu waṭ-ṭayyibāt… ashhadu an lā ilāha illa-llāh, wa ashhadu anna Muḥammadan ʿabduhu wa rasūluh',
    sayEn: 'All greetings, prayers and good things are for Allah… I bear witness that there is no god but Allah, and that Muhammad is His servant and messenger.',
  },
  {
    id: 'tasleem', pose: 'tasleem',
    titleAr: 'التسليم', titleEn: 'The Taslīm',
    descAr: 'أنهِ الصلاة بالتسليم: التفت بوجهك إلى اليمين ثمّ إلى اليسار قائلًا في كلّ مرّة:',
    descEn: 'End the prayer by turning your face to the right, then to the left, saying each time:',
    sayAr: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', translit: 'As-salāmu ʿalaykum wa raḥmatu-llāh', sayEn: 'Peace be upon you, and the mercy of Allah.',
  },
];

// How many rakʿahs each obligatory prayer has.
export const RAKAHS: { ar: string; en: string; n: string }[] = [
  { ar: 'الفجر', en: 'Fajr', n: '٢' },
  { ar: 'الظهر', en: 'Dhuhr', n: '٤' },
  { ar: 'العصر', en: 'Asr', n: '٤' },
  { ar: 'المغرب', en: 'Maghrib', n: '٣' },
  { ar: 'العشاء', en: 'Isha', n: '٤' },
];

// ── Muḥkamāt ──────────────────────────────────────────────────────────────
export interface KeyVerse { surah: number; from: number; to: number; titleAr: string; titleEn: string; whyAr: string; whyEn: string }

// (a) Selected great verses to learn & take refuge with.
export const KEY_VERSES: KeyVerse[] = [
  { surah: 1, from: 1, to: 7, titleAr: 'سورة الفاتحة', titleEn: 'Al-Fātiḥah', whyAr: 'أمّ القرآن، تُقرأ في كلّ ركعة، وهي أعظم سورة في القرآن.', whyEn: 'The “Mother of the Qur’an,” recited in every unit of prayer — the greatest chapter.' },
  { surah: 2, from: 255, to: 255, titleAr: 'آية الكرسي', titleEn: 'Āyat al-Kursī', whyAr: 'أعظم آية في القرآن، من قرأها بعد كلّ صلاة لم يمنعه من الجنّة إلا الموت، وحرزٌ من الشيطان.', whyEn: 'The greatest verse in the Qur’an; a protection from Satan and a means to Paradise when read after each prayer.' },
  { surah: 2, from: 285, to: 286, titleAr: 'أواخر سورة البقرة', titleEn: 'The last verses of Al-Baqarah', whyAr: 'من قرأهما في ليلة كفتاه، فيهما إقرار الإيمان ودعاء جامع.', whyEn: 'Whoever recites them at night, they will suffice him — a declaration of faith and a comprehensive supplication.' },
  { surah: 112, from: 1, to: 4, titleAr: 'سورة الإخلاص', titleEn: 'Al-Ikhlāṣ', whyAr: 'تعدل ثلث القرآن، وفيها أصل التوحيد ووصف الله بالكمال.', whyEn: 'Equal to a third of the Qur’an; it lays out pure monotheism and Allah’s perfection.' },
  { surah: 113, from: 1, to: 5, titleAr: 'سورة الفلق', titleEn: 'Al-Falaq', whyAr: 'من المعوّذتين، يُتحصّن بها من كلّ شرّ ومن الحسد والسحر.', whyEn: 'One of the two “seekings of refuge” — protection from every evil, envy and harm.' },
  { surah: 114, from: 1, to: 6, titleAr: 'سورة الناس', titleEn: 'An-Nās', whyAr: 'من المعوّذتين، يُتحصّن بها من وسوسة الشيطان.', whyEn: 'One of the two “seekings of refuge” — protection from the whisperings of Satan.' },
];

// (b) Verses that establish core rulings (each shown with a simple explanation).
export interface RulingVerse { topicAr: string; topicEn: string; surah: number; from: number; to: number; explAr: string; explEn: string }
export const RULING_VERSES: RulingVerse[] = [
  { topicAr: 'الطهارة والوضوء', topicEn: 'Purification & wudū', surah: 5, from: 6, to: 6, explAr: 'تبيّن أعضاء الوضوء قبل الصلاة: غسل الوجه واليدين إلى المرافق، ومسح الرأس، وغسل الرجلين إلى الكعبين.', explEn: 'It lists the parts of wudū before prayer: washing the face and arms to the elbows, wiping the head, and washing the feet to the ankles.' },
  { topicAr: 'الصلاة', topicEn: 'Prayer', surah: 2, from: 238, to: 238, explAr: 'الأمر بالمحافظة على الصلوات وأداؤها في أوقاتها بخشوع وقنوت لله.', explEn: 'A command to guard the prayers and perform them on time, standing devoutly before Allah.' },
  { topicAr: 'الزكاة والصدقة', topicEn: 'Zakāt & charity', surah: 9, from: 103, to: 103, explAr: 'الزكاة تطهّر المال وتزكّي صاحبها، وتؤخذ من الأغنياء وتُردّ على الفقراء.', explEn: 'Zakāt purifies wealth and the giver; it is taken from the well-off and given to the poor.' },
  { topicAr: 'الصيام', topicEn: 'Fasting', surah: 2, from: 183, to: 183, explAr: 'فُرض صيام رمضان كما فُرض على الأمم قبلنا، غايته تحقيق التقوى.', explEn: 'Fasting Ramadan is prescribed as it was for earlier nations; its goal is God-consciousness (taqwā).' },
  { topicAr: 'الحجّ', topicEn: 'Pilgrimage (Ḥajj)', surah: 3, from: 97, to: 97, explAr: 'حجّ بيت الله الحرام فرضٌ على من استطاع إليه سبيلًا، مرّة في العمر.', explEn: 'Pilgrimage to the Sacred House is an obligation upon whoever is able, once in a lifetime.' },
  { topicAr: 'العدل والإحسان', topicEn: 'Justice & kindness', surah: 16, from: 90, to: 90, explAr: 'جامعةٌ للخير كلّه: تأمر بالعدل والإحسان وصلة الأرحام، وتنهى عن الفحشاء والظلم.', explEn: 'A verse that gathers all goodness: it commands justice, excellence and kinship, and forbids indecency and oppression.' },
  { topicAr: 'برّ الوالدين', topicEn: 'Kindness to parents', surah: 17, from: 23, to: 24, explAr: 'يقرن الله عبادته ببرّ الوالدين، فلا يجوز إغضابهما ولو بكلمة «أُفّ».', explEn: 'Allah pairs His worship with kindness to parents — one may not even say “uff” to them in annoyance.' },
  { topicAr: 'تحريم الربا', topicEn: 'Prohibition of usury', surah: 2, from: 275, to: 275, explAr: 'حرّم الله الربا وأحلّ البيع، لما في الربا من الظلم وأكل أموال الناس بالباطل.', explEn: 'Allah forbade usury and permitted trade, for usury is injustice and devouring people’s wealth wrongfully.' },
];

// (c) The muḥkam / mutashābih concept (Āl ʿImrān 3:7).
export const MUHKAM_INTRO = {
  ar: 'القرآن كلّه حقّ، وآياته نوعان: «محكمات» واضحات الدلالة وهنّ أمّ الكتاب وأصله الذي يُرَدّ إليه، و«متشابهات» تحتمل أكثر من معنى أو استأثر الله بعلم حقيقتها (كصفات الغيب). والراسخون في العلم يؤمنون بالجميع، ويردّون المتشابه إلى المحكم، ولا يتّبعون المتشابه ابتغاء الفتنة. وهذا القسم يجمع لك من المحكمات: آياتٍ عظيمة للحفظ والحماية، وآيات الأحكام التي يقوم عليها الدين.',
  en: 'All of the Qur’an is truth, and its verses are of two kinds: muḥkam — clear in meaning, the foundation of the Book to which everything is referred — and mutashābih — verses that bear more than one meaning or whose full reality Allah alone knows (such as matters of the unseen). Those firmly grounded in knowledge believe in all of it, refer the unclear back to the clear, and do not chase the ambiguous seeking discord. This section gathers, from the muḥkam: great verses to memorise and seek refuge with, and the verses of rulings upon which the religion stands.',
  refSurah: 3, refAyah: 7,
};
