// A duʿāʾ library organised by situation (like Ḥiṣn al-Muslim). Every duʿāʾ is
// a well-known authentic supplication with its source. Arabic is primary; a
// transliteration + meaning help non-Arabic speakers. 100% offline (bundled).
//
// Sources are given by their common names (Bukhārī, Muslim, Abū Dāwūd, Tirmidhī,
// Ibn Mājah, the Qurʾān). Nothing here alters the Qurʾān — Qurʾānic duʿāʾs are
// quoted verbatim with their reference.

export interface Dua {
  ar: string;
  translit?: string;
  en: string;
  ref: string;   // Arabic source label
  refEn: string; // English source label
}
export interface DuaCategory {
  id: string;
  title: string;   // Arabic
  en: string;      // English
  icon: string;    // mapped to a lucide icon in the page
  duas: Dua[];
}

export const DUA_CATEGORIES: DuaCategory[] = [
  {
    id: 'distress', title: 'الهمّ والحزن والكرب', en: 'Anxiety, grief & distress', icon: 'heart',
    duas: [
      {
        ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
        translit: 'Allāhumma innī aʿūdhu bika mina-l-hammi wal-ḥazan, wa aʿūdhu bika mina-l-ʿajzi wal-kasal, wa aʿūdhu bika mina-l-jubni wal-bukhl, wa aʿūdhu bika min ghalabati-d-dayni wa qahri-r-rijāl',
        en: 'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, and from being overcome by debt and overpowered by men.',
        ref: 'رواه البخاري', refEn: 'Al-Bukhārī',
      },
      {
        ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
        translit: 'Lā ilāha illa-llāhu-l-ʿAẓīmu-l-Ḥalīm, lā ilāha illa-llāhu Rabbu-l-ʿarshi-l-ʿaẓīm, lā ilāha illa-llāhu Rabbu-s-samāwāti wa Rabbu-l-arḍi wa Rabbu-l-ʿarshi-l-karīm',
        en: 'There is no god but Allah, the Mighty, the Forbearing; there is no god but Allah, Lord of the Magnificent Throne; there is no god but Allah, Lord of the heavens, Lord of the earth, and Lord of the Noble Throne.',
        ref: 'متفق عليه', refEn: 'Al-Bukhārī & Muslim',
      },
      {
        ar: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لَا إِلَٰهَ إِلَّا أَنْتَ',
        translit: 'Allāhumma raḥmataka arjū falā takilnī ilā nafsī ṭarfata ʿayn, wa aṣliḥ lī shaʾnī kullah, lā ilāha illā ant',
        en: 'O Allah, I hope for Your mercy, so do not leave me to myself even for the blink of an eye; set right all my affairs. There is no god but You.',
        ref: 'رواه أبو داود', refEn: 'Abū Dāwūd',
      },
    ],
  },
  {
    id: 'travel', title: 'السفر', en: 'Travel', icon: 'plane',
    duas: [
      {
        ar: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَىٰ رَبِّنَا لَمُنْقَلِبُونَ. اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَٰذَا الْبِرَّ وَالتَّقْوَىٰ، وَمِنَ الْعَمَلِ مَا تَرْضَىٰ. اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَٰذَا وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الْأَهْلِ',
        en: 'Allah is the Greatest (×3). Glory to Him who has subjected this to us, and we could not have done it by ourselves; and indeed, to our Lord we will return. O Allah, we ask You on this journey of ours righteousness, piety, and deeds pleasing to You. O Allah, make this journey easy for us and fold up its distance. O Allah, You are the Companion on the journey and the Guardian of the family.',
        ref: 'رواه مسلم', refEn: 'Muslim',
      },
      {
        ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        translit: 'Aʿūdhu bikalimāti-llāhi-t-tāmmāti min sharri mā khalaq',
        en: 'I seek refuge in the perfect words of Allah from the evil of what He has created. (Said when stopping at a place.)',
        ref: 'رواه مسلم', refEn: 'Muslim',
      },
    ],
  },
  {
    id: 'knowledge', title: 'طلب العلم والمذاكرة', en: 'Seeking knowledge & study', icon: 'book',
    duas: [
      {
        ar: 'رَبِّ زِدْنِي عِلْمًا',
        translit: 'Rabbi zidnī ʿilmā',
        en: 'My Lord, increase me in knowledge.',
        ref: 'طه: ١١٤', refEn: 'Qurʾān 20:114',
      },
      {
        ar: 'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي، وَعَلِّمْنِي مَا يَنْفَعُنِي، وَزِدْنِي عِلْمًا',
        translit: 'Allāhumma-nfaʿnī bimā ʿallamtanī, wa ʿallimnī mā yanfaʿunī, wa zidnī ʿilmā',
        en: 'O Allah, benefit me by what You have taught me, teach me what will benefit me, and increase me in knowledge.',
        ref: 'رواه الترمذي وابن ماجه', refEn: 'Tirmidhī & Ibn Mājah',
      },
      {
        ar: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
        translit: 'Allāhumma lā sahla illā mā jaʿaltahu sahlā, wa anta tajʿalu-l-ḥazna idhā shiʾta sahlā',
        en: 'O Allah, there is no ease except what You make easy, and You make hardship, if You will, easy. (Said before a hard task or exam.)',
        ref: 'رواه ابن حبان', refEn: 'Ibn Ḥibbān',
      },
    ],
  },
  {
    id: 'sickness', title: 'المرض والشفاء', en: 'Illness & healing', icon: 'pulse',
    duas: [
      {
        ar: 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',
        translit: 'Allāhumma Rabba-n-nās, adhhibi-l-baʾs, ishfi anta-sh-Shāfī, lā shifāʾa illā shifāʾuk, shifāʾan lā yughādiru saqamā',
        en: 'O Allah, Lord of mankind, remove the harm and heal — You are the Healer. There is no healing but Your healing, a healing that leaves no illness.',
        ref: 'متفق عليه', refEn: 'Al-Bukhārī & Muslim',
      },
      {
        ar: 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ  (سبع مرات)',
        translit: 'Asʾalu-llāha-l-ʿAẓīma Rabba-l-ʿarshi-l-ʿaẓīmi an yashfiyak (×7)',
        en: 'I ask Allah the Mighty, Lord of the Magnificent Throne, to heal you. (Said seven times beside the sick.)',
        ref: 'رواه أبو داود والترمذي', refEn: 'Abū Dāwūd & Tirmidhī',
      },
    ],
  },
  {
    id: 'protection', title: 'الحفظ والتحصين', en: 'Protection & refuge', icon: 'shield',
    duas: [
      {
        ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ  (ثلاث مرات)',
        translit: 'Bismillāhi-lladhī lā yaḍurru maʿa-smihi shayʾun fi-l-arḍi wa lā fi-s-samāʾ, wa Huwa-s-Samīʿu-l-ʿAlīm (×3)',
        en: 'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing. (Said three times, morning and evening.)',
        ref: 'رواه أبو داود والترمذي', refEn: 'Abū Dāwūd & Tirmidhī',
      },
      {
        ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ  (ثلاث مرات)',
        translit: 'Aʿūdhu bikalimāti-llāhi-t-tāmmāti min sharri mā khalaq (×3)',
        en: 'I seek refuge in the perfect words of Allah from the evil of what He has created. (Said three times in the evening.)',
        ref: 'رواه مسلم', refEn: 'Muslim',
      },
    ],
  },
  {
    id: 'provision', title: 'الرزق وقضاء الدَّين', en: 'Provision & clearing debt', icon: 'coins',
    duas: [
      {
        ar: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
        translit: 'Allāhumma-kfinī biḥalālika ʿan ḥarāmik, wa aghninī bifaḍlika ʿamman siwāk',
        en: 'O Allah, suffice me with what You have made lawful against what You have forbidden, and enrich me by Your bounty so I need none besides You.',
        ref: 'رواه الترمذي', refEn: 'Tirmidhī',
      },
      {
        ar: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
        translit: 'Rabbi innī limā anzalta ilayya min khayrin faqīr',
        en: 'My Lord, indeed I am, for whatever good You send down to me, in need.',
        ref: 'القصص: ٢٤', refEn: 'Qurʾān 28:24',
      },
    ],
  },
  {
    id: 'forgiveness', title: 'الاستغفار والتوبة', en: 'Forgiveness & repentance', icon: 'sparkles',
    duas: [
      {
        ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
        en: 'O Allah, You are my Lord; there is no god but You. You created me and I am Your servant; I keep Your covenant and promise as best I can. I seek refuge in You from the evil I have done; I acknowledge Your favour upon me and I confess my sin, so forgive me — for none forgives sins but You. (The chief of seeking forgiveness — Sayyid al-Istighfār.)',
        ref: 'رواه البخاري', refEn: 'Al-Bukhārī',
      },
      {
        ar: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ، إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
        translit: 'Rabbi-ghfir lī wa tub ʿalayy, innaka anta-t-Tawwābu-r-Raḥīm',
        en: 'My Lord, forgive me and accept my repentance; indeed You are the Ever-Relenting, the Most Merciful.',
        ref: 'رواه أبو داود والترمذي', refEn: 'Abū Dāwūd & Tirmidhī',
      },
    ],
  },
  {
    id: 'rain', title: 'المطر', en: 'Rain', icon: 'rain',
    duas: [
      { ar: 'اللَّهُمَّ صَيِّبًا نَافِعًا', translit: 'Allāhumma ṣayyiban nāfiʿā', en: 'O Allah, [make it] a beneficial rain. (Said while it rains.)', ref: 'رواه البخاري', refEn: 'Al-Bukhārī' },
      { ar: 'مُطِرْنَا بِفَضْلِ اللَّهِ وَرَحْمَتِهِ', translit: 'Muṭirnā bifaḍli-llāhi wa raḥmatih', en: 'We have been given rain by the grace and mercy of Allah. (Said after rain.)', ref: 'متفق عليه', refEn: 'Al-Bukhārī & Muslim' },
    ],
  },
  {
    id: 'mosque', title: 'دخول المسجد والخروج منه', en: 'Entering & leaving the mosque', icon: 'mosque',
    duas: [
      { ar: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', translit: 'Allāhumma-ftaḥ lī abwāba raḥmatik', en: 'O Allah, open for me the gates of Your mercy. (On entering.)', ref: 'رواه مسلم', refEn: 'Muslim' },
      { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', translit: 'Allāhumma innī asʾaluka min faḍlik', en: 'O Allah, I ask You of Your bounty. (On leaving.)', ref: 'رواه مسلم', refEn: 'Muslim' },
    ],
  },
  {
    id: 'home', title: 'دخول المنزل والخروج منه', en: 'Entering & leaving the home', icon: 'home',
    duas: [
      { ar: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَىٰ اللَّهِ رَبِّنَا تَوَكَّلْنَا', translit: 'Bismillāhi walajnā, wa bismillāhi kharajnā, wa ʿala-llāhi Rabbinā tawakkalnā', en: 'In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely. (On entering, then greet the household.)', ref: 'رواه أبو داود', refEn: 'Abū Dāwūd' },
      { ar: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَىٰ اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', translit: 'Bismillāh, tawakkaltu ʿala-llāh, wa lā ḥawla wa lā quwwata illā billāh', en: 'In the name of Allah, I rely upon Allah; there is no might nor power except with Allah. (On leaving.)', ref: 'رواه أبو داود والترمذي', refEn: 'Abū Dāwūd & Tirmidhī' },
    ],
  },
  {
    id: 'food', title: 'الطعام', en: 'Food', icon: 'food',
    duas: [
      { ar: 'بِسْمِ اللَّهِ  (وإن نسيَ في أوَّله قال: بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ)', translit: 'Bismillāh — (if forgotten at the start:) Bismillāhi awwalahu wa ākhirah', en: 'In the name of Allah. (And if one forgets at the start: In the name of Allah, at its beginning and its end.)', ref: 'رواه أبو داود والترمذي', refEn: 'Abū Dāwūd & Tirmidhī' },
      { ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', translit: 'Al-ḥamdu lillāhi-lladhī aṭʿamanī hādhā wa razaqanīhi min ghayri ḥawlin minnī wa lā quwwah', en: 'Praise be to Allah who fed me this and provided it for me without any might or power on my part. (After eating.)', ref: 'رواه أبو داود والترمذي', refEn: 'Abū Dāwūd & Tirmidhī' },
    ],
  },
];
