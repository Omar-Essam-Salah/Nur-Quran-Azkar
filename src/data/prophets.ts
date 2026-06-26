// Stories of the Prophets (قصص الأنبياء) — the 25 prophets named in the Qur'an.
// Content is authored as an original, concise factual summary of the well-known
// Qur'anic narrative (not copied from any third-party site), in Arabic and
// English. Each prophet links to a representative Qur'anic passage (shown inline
// from the bundled Qur'an) and to the full surahs.

export interface ProphetRef { n: number; name: string }
export interface ProphetPassage { surah: number; from: number; to: number }

export interface Prophet {
  id: string;
  name: string;     // Arabic
  en: string;       // English
  note: string;     // one-line (Arabic) for the list
  noteEn?: string;  // one-line (English)
  story: string;    // fuller summary, Arabic (paragraphs separated by \n\n)
  storyEn?: string; // fuller summary, English
  refs: ProphetRef[];
  passage?: ProphetPassage;
}

export const PROPHETS: Prophet[] = [
  {
    id: 'adam', name: 'آدم', en: 'Adam', note: 'أبو البشر وأوّل الأنبياء.', noteEn: 'Father of mankind and the first prophet.',
    story: 'خلق الله آدم عليه السلام بيده ونفخ فيه من روحه، وعلّمه الأسماء كلها، وأمر الملائكة بالسجود له تكريمًا، فسجدوا إلا إبليس استكبر وأبى فكان من الكافرين.\n\nأسكنه الله الجنّة هو وزوجه حواء، وأباح لهما كل شيء إلا شجرة واحدة، فوسوس لهما الشيطان حتى أكلا منها، فأهبطهما الله إلى الأرض. وتاب آدم إلى ربّه بكلماتٍ تلقّاها فتاب الله عليه، وجعله خليفةً في الأرض وبدأت ذرّيّته.',
    storyEn: 'Allah created Adam (peace be upon him) with His own hand, breathed into him of His spirit, and taught him the names of all things. He commanded the angels to prostrate to Adam in honour, and they all did — except Iblis, who refused out of pride and became a disbeliever.\n\nAllah settled Adam and his wife Hawwa (Eve) in the Garden and allowed them everything but one tree. Satan whispered to them until they ate from it, so Allah sent them down to earth. Adam then received words of repentance from his Lord and turned back to Him, and Allah accepted his repentance, made him a vicegerent on earth, and from him mankind began.',
    refs: [{ n: 2, name: 'البقرة' }, { n: 7, name: 'الأعراف' }, { n: 20, name: 'طه' }],
    passage: { surah: 2, from: 30, to: 37 },
  },
  {
    id: 'idris', name: 'إدريس', en: 'Idris', note: 'نبيٌّ صدّيق رفعه الله مكانًا عليًّا.', noteEn: 'A truthful prophet whom Allah raised to a high station.',
    story: 'إدريس عليه السلام نبيٌّ صدّيق صبور، أثنى الله عليه بالصدق والصبر وأدخله في رحمته، ورفعه مكانًا عليًّا. وهو من أوائل الأنبياء بعد آدم، وممّن دعا قومه إلى توحيد الله والاستقامة على أمره، وكان كثير العبادة والذكر.',
    storyEn: 'Idris (peace be upon him) was a truthful, patient prophet. Allah praised him for his truthfulness and patience, admitted him into His mercy, and raised him to a high station. He was among the earliest prophets after Adam, calling his people to the worship of the One God and to uprightness, and he was constant in worship and remembrance of Allah.',
    refs: [{ n: 19, name: 'مريم' }, { n: 21, name: 'الأنبياء' }],
    passage: { surah: 19, from: 56, to: 57 },
  },
  {
    id: 'nuh', name: 'نوح', en: 'Nuh', note: 'دعا قومه ألف سنة إلا خمسين عامًا.', noteEn: 'Called his people for 950 years.',
    story: 'بعث الله نوحًا عليه السلام إلى قومٍ عبدوا الأصنام، فدعاهم إلى توحيد الله ليلًا ونهارًا، سرًّا وجهارًا، ألف سنة إلا خمسين عامًا، فما آمن معه إلا قليل، واستكبر أكثرهم وآذوه.\n\nفأوحى الله إليه أن يصنع الفُلك، فلمّا جاء أمر الله وفار التنّور حمل فيها من كلّ زوجين اثنين ومن آمن معه، وأغرق الله الكافرين بالطوفان ومنهم ابنه، ونجّى نوحًا والمؤمنين.',
    storyEn: 'Allah sent Nuh (Noah, peace be upon him) to a people who worshipped idols. He called them to the worship of the One God night and day, secretly and openly, for 950 years — yet only a few believed; most grew arrogant and harmed him.\n\nAllah then inspired him to build the Ark. When His command came and the oven gushed forth, Nuh took aboard a pair of every kind and those who believed. Allah drowned the disbelievers in the Flood — among them Nuh’s own son — and saved Nuh and the believers.',
    refs: [{ n: 71, name: 'نوح' }, { n: 11, name: 'هود' }, { n: 23, name: 'المؤمنون' }],
    passage: { surah: 71, from: 1, to: 12 },
  },
  {
    id: 'hud', name: 'هود', en: 'Hud', note: 'أُرسل إلى قوم عاد.', noteEn: 'Sent to the people of ʿĀd.',
    story: 'أُرسل هود عليه السلام إلى قوم عاد، وكانوا أقوياء البنيان عظماء الأجساد، لكنّهم كفروا واستكبروا في الأرض بغير الحقّ. دعاهم هود إلى عبادة الله وحده وترك الأصنام، فكذّبوه وعاندوا.\n\nفأنجى الله هودًا والذين آمنوا معه، وأهلك عادًا بريحٍ صرصرٍ عاتية سخّرها عليهم سبع ليالٍ وثمانية أيام حسومًا، فأصبحوا لا يُرى إلا مساكنهم.',
    storyEn: 'Hud (peace be upon him) was sent to the people of ʿĀd — mighty in build and great in stature — yet they disbelieved and behaved arrogantly on the earth without right. He called them to worship Allah alone and abandon their idols, but they denied him and persisted.\n\nAllah saved Hud and those who believed with him, and destroyed ʿĀd with a furious, roaring wind that He unleashed upon them for seven nights and eight relentless days, until nothing could be seen but their empty dwellings.',
    refs: [{ n: 11, name: 'هود' }, { n: 7, name: 'الأعراف' }, { n: 26, name: 'الشعراء' }],
    passage: { surah: 11, from: 50, to: 60 },
  },
  {
    id: 'salih', name: 'صالح', en: 'Salih', note: 'أُرسل إلى ثمود، وآيته الناقة.', noteEn: 'Sent to Thamūd; his sign was the she-camel.',
    story: 'أُرسل صالح عليه السلام إلى ثمود الذين نحتوا الجبال بيوتًا، فدعاهم إلى توحيد الله، فطلبوا آية، فأخرج الله لهم ناقةً من صخرة آيةً مبصرة، وجعل لها شِربٌ ولهم شِربُ يومٍ معلوم.\n\nفعقروها وعتوا عن أمر ربّهم، فأخذتهم الصيحة والرجفة فأصبحوا في ديارهم جاثمين، ونجّى الله صالحًا والذين آمنوا معه برحمةٍ منه.',
    storyEn: 'Salih (peace be upon him) was sent to Thamūd, who carved homes into the mountains. He called them to the worship of the One God; they demanded a sign, so Allah brought forth for them a she-camel from a rock as a clear sign, with a fixed day to drink and a fixed day for them.\n\nThey hamstrung her and defied their Lord’s command, so the Blast and the earthquake seized them and they lay lifeless in their homes. Allah saved Salih and those who believed with him by His mercy.',
    refs: [{ n: 7, name: 'الأعراف' }, { n: 11, name: 'هود' }, { n: 26, name: 'الشعراء' }],
    passage: { surah: 11, from: 61, to: 68 },
  },
  {
    id: 'ibrahim', name: 'إبراهيم', en: 'Ibrahim', note: 'خليل الرحمن وأبو الأنبياء.', noteEn: 'The Friend of the Most Merciful and father of the prophets.',
    story: 'إبراهيم عليه السلام خليل الرحمن وإمام الموحّدين؛ نشأ بين قومٍ يعبدون الأصنام والكواكب، فحاجّهم بالحُجّة والبرهان، ثم حطّم أصنامهم ليُبيّن عجزها، فألقَوه في نارٍ عظيمة، فجعلها الله بردًا وسلامًا عليه.\n\nهاجر في سبيل الله، ورزقه إسماعيل وإسحاق على الكِبَر، وابتلاه الله بذبح ابنه ففداه بذبحٍ عظيم، وبنى مع إسماعيل قواعد الكعبة، ودعا لأهلها بالأمن والرزق.',
    storyEn: 'Ibrahim (Abraham, peace be upon him) is the Friend of the Most Merciful and the leader of the monotheists. He grew up among a people who worshipped idols and stars, so he refuted them with proof and argument, then broke their idols to show their helplessness. They cast him into a great fire, but Allah made it cool and safe for him.\n\nHe migrated for the sake of Allah and was granted Ismail and Ishaq in old age. Allah tested him with the sacrifice of his son, then ransomed the boy with a great sacrifice. With Ismail he raised the foundations of the Kaʿbah and prayed for its people to have security and provision.',
    refs: [{ n: 2, name: 'البقرة' }, { n: 21, name: 'الأنبياء' }, { n: 37, name: 'الصافات' }],
    passage: { surah: 21, from: 51, to: 70 },
  },
  {
    id: 'lut', name: 'لوط', en: 'Lut', note: 'أُرسل إلى قومٍ ابتُلوا بالفاحشة.', noteEn: 'Sent to a people afflicted with grave immorality.',
    story: 'لوط عليه السلام ابن أخي إبراهيم، أرسله الله إلى أهل سَدوم الذين أتوا الفاحشة التي لم يسبقهم بها أحد من العالمين. دعاهم إلى التقوى وترك المنكر فأصرّوا وتوعّدوه بالإخراج.\n\nفأرسل الله ملائكته، وأمر لوطًا أن يسري بأهله ليلًا إلا امرأته، فلمّا أشرقت الشمس جعل الله عالي قريتهم سافلها وأمطر عليهم حجارةً من سِجّيل، ونجّى لوطًا وأهله المؤمنين.',
    storyEn: 'Lut (Lot, peace be upon him), the nephew of Ibrahim, was sent by Allah to the people of Sodom, who committed an immorality none in the worlds had committed before them. He called them to piety and to abandon their evil, but they persisted and threatened to drive him out.\n\nAllah sent His angels and commanded Lut to travel by night with his family — except his wife. When the sun rose, Allah turned their town upside down and rained upon them stones of baked clay, and He saved Lut and his believing household.',
    refs: [{ n: 11, name: 'هود' }, { n: 15, name: 'الحجر' }, { n: 26, name: 'الشعراء' }],
    passage: { surah: 11, from: 77, to: 83 },
  },
  {
    id: 'ismail', name: 'إسماعيل', en: 'Ismail', note: 'الذبيح، وجدّ العرب.', noteEn: 'The one ransomed; forefather of the Arabs.',
    story: 'إسماعيل عليه السلام ابن إبراهيم من هاجر، صادق الوعد صبور. لمّا رأى إبراهيم في المنام أنّه يذبحه عرض عليه الأمر، فقال: «يا أبتِ افعل ما تؤمر ستجدني إن شاء الله من الصابرين»، فلمّا أسلما وتلّه للجبين فداه الله بذبحٍ عظيم.\n\nوبنى مع أبيه قواعد البيت الحرام، وكان من نسله خاتم الأنبياء محمد ﷺ.',
    storyEn: 'Ismail (Ishmael, peace be upon him), son of Ibrahim through Hajar, was true to his promise and patient. When Ibrahim saw in a dream that he was to sacrifice him and put it to him, he said: “O my father, do as you are commanded; you will find me, if Allah wills, among the patient.” When they had both submitted and Ibrahim laid him down, Allah ransomed him with a great sacrifice.\n\nWith his father he raised the foundations of the Sacred House (the Kaʿbah), and from his descendants came the Seal of the Prophets, Muhammad ﷺ.',
    refs: [{ n: 37, name: 'الصافات' }, { n: 2, name: 'البقرة' }, { n: 19, name: 'مريم' }],
    passage: { surah: 37, from: 100, to: 111 },
  },
  {
    id: 'ishaq', name: 'إسحاق', en: 'Ishaq', note: 'ابن إبراهيم، بشّرت به الملائكة.', noteEn: 'Son of Ibrahim, foretold by the angels.',
    story: 'إسحاق عليه السلام ابن إبراهيم من سارة، بشّرت به الملائكة وهي في طريقها إلى قوم لوط، وبشّرت من وراء إسحاق بيعقوب. جعله الله نبيًّا من الصالحين، وبارك فيه وفي ذرّيّته، وجعل النبوّة في نسله.',
    storyEn: 'Ishaq (Isaac, peace be upon him), son of Ibrahim through Sarah, was given glad tidings by the angels on their way to the people of Lut, who also foretold — beyond Ishaq — the birth of Yaʿqub. Allah made him a prophet among the righteous, blessed him and his offspring, and placed prophethood within his lineage.',
    refs: [{ n: 37, name: 'الصافات' }, { n: 11, name: 'هود' }, { n: 21, name: 'الأنبياء' }],
    passage: { surah: 11, from: 69, to: 73 },
  },
  {
    id: 'yaqub', name: 'يعقوب', en: 'Yaqub', note: 'إسرائيل، ابن إسحاق ووالد يوسف.', noteEn: 'Israel — son of Ishaq and father of Yusuf.',
    story: 'يعقوب عليه السلام هو إسرائيل، ابن إسحاق بن إبراهيم. كان نبيًّا صبورًا حليمًا، ابتُلي بفراق ابنه يوسف سنينَ طويلة فصبر صبرًا جميلًا، وظلّ موقنًا برحمة الله حتى ردّ الله عليه بصره وجمع شمله بيوسف في مصر.',
    storyEn: 'Yaʿqub (Jacob, peace be upon him) — also called Israel — was the son of Ishaq, son of Ibrahim. He was a patient, forbearing prophet, tested with the loss of his son Yusuf for many long years. He bore it with beautiful patience and never lost certainty in Allah’s mercy, until Allah restored his sight and reunited him with Yusuf in Egypt.',
    refs: [{ n: 12, name: 'يوسف' }, { n: 2, name: 'البقرة' }],
    passage: { surah: 12, from: 83, to: 87 },
  },
  {
    id: 'yusuf', name: 'يوسف', en: 'Yusuf', note: 'قصّته «أحسن القصص».', noteEn: 'His story is “the most beautiful of stories.”',
    story: 'يوسف عليه السلام ابن يعقوب، رأى في صغره أحد عشر كوكبًا والشمس والقمر له ساجدين، فحسده إخوته فألقوه في غيابة الجُبّ، فالتقطته سيّارة وباعوه في مصر بثمنٍ بخس.\n\nنشأ في بيت العزيز، وعصم الله نفسه من الفتنة فسُجن ظلمًا، ثم أخرجه الله بتعبير رؤيا الملك، ومكّن له في الأرض على خزائنها. وفي النهاية جمع الله شمله بأبيه وإخوته الذين عفا عنهم، فكانت عاقبة الصبر والتقوى تمكينًا ورحمة.',
    storyEn: 'Yusuf (Joseph, peace be upon him), son of Yaʿqub, saw in his childhood eleven stars and the sun and the moon prostrating to him. His brothers envied him and threw him into the depths of a well; a caravan picked him up and sold him in Egypt for a paltry price.\n\nHe grew up in the house of the ʿAziz, and Allah protected him from temptation, so he was unjustly imprisoned. Then Allah brought him out through his interpretation of the king’s dream and established him over the treasuries of the land. In the end Allah reunited him with his father and the brothers he forgave — so the outcome of patience and piety was empowerment and mercy.',
    refs: [{ n: 12, name: 'يوسف' }],
    passage: { surah: 12, from: 3, to: 6 },
  },
  {
    id: 'ayyub', name: 'أيوب', en: 'Ayyub', note: 'مَثَلٌ في الصبر على البلاء.', noteEn: 'A model of patience through affliction.',
    story: 'أيوب عليه السلام عبدٌ صالح أنعم الله عليه بالمال والأهل والصحّة، فابتلاه بفقدها جميعًا وبمرضٍ طويل، فصبر صبرًا عظيمًا ولم يشكُ إلا إلى ربّه: «أنّي مسّني الضُّرّ وأنت أرحم الراحمين».\n\nفاستجاب الله له وأمره أن يركض برجله فنبعت عينٌ اغتسل منها فعُوفي، وردّ الله عليه أهله ومثلهم معهم رحمةً منه وذكرى للعابدين.',
    storyEn: 'Ayyub (Job, peace be upon him) was a righteous servant whom Allah blessed with wealth, family and health, then tested by the loss of them all and a long illness. He was immensely patient and complained only to his Lord: “Adversity has touched me, and You are the Most Merciful of the merciful.”\n\nAllah answered him and commanded him to strike the ground with his foot; a spring gushed forth from which he washed and was healed. Allah restored his family and the like of them with them, as a mercy from Him and a reminder for the worshippers.',
    refs: [{ n: 21, name: 'الأنبياء' }, { n: 38, name: 'ص' }],
    passage: { surah: 21, from: 83, to: 84 },
  },
  {
    id: 'shuayb', name: 'شعيب', en: 'Shuayb', note: 'أُرسل إلى أهل مدين.', noteEn: 'Sent to the people of Madyan.',
    story: 'أُرسل شعيب عليه السلام إلى أهل مدين الذين كانوا يبخسون الناس أشياءهم ويُفسدون في الأرض، فدعاهم إلى عبادة الله وحده وإيفاء الكيل والميزان بالعدل وترك الفساد. فكذّبوه وتوعّدوه، فأخذتهم الرجفة وأخذهم عذاب يوم الظُّلّة، ونجّى الله شعيبًا والذين آمنوا معه.',
    storyEn: 'Shuʿayb (peace be upon him) was sent to the people of Madyan, who cheated people of their goods and spread corruption in the land. He called them to worship Allah alone, to give full measure and weight with justice, and to abandon corruption. They denied him and threatened him, so the earthquake seized them and the punishment of the Day of the Shadow overtook them, and Allah saved Shuʿayb and those who believed with him.',
    refs: [{ n: 7, name: 'الأعراف' }, { n: 11, name: 'هود' }, { n: 26, name: 'الشعراء' }],
    passage: { surah: 11, from: 84, to: 95 },
  },
  {
    id: 'musa', name: 'موسى', en: 'Musa', note: 'كليم الله، أُرسل إلى فرعون.', noteEn: 'The one Allah spoke to; sent to Pharaoh.',
    story: 'موسى عليه السلام كليم الله؛ وُلد في زمن فرعون الذي كان يذبّح أبناء بني إسرائيل، فألقته أمّه في اليمّ بأمر الله فالتقطه آل فرعون فنشأ في قصره. ولمّا بلغ أشدّه خرج إلى مدين ثم كلّمه الله في الوادي المقدّس وأرسله إلى فرعون.\n\nأيّده الله بالمعجزات كالعصا واليد، فكذّبه فرعون واستكبر، فأنجى الله موسى وبني إسرائيل وفلق لهم البحر، وأغرق فرعون وجنوده، وأنزل على موسى التوراة هدًى ونورًا.',
    storyEn: 'Musa (Moses, peace be upon him) is the one to whom Allah spoke. He was born in the time of Pharaoh, who slaughtered the sons of the Children of Israel; his mother cast him into the river by Allah’s command, and Pharaoh’s household took him in and he grew up in the palace. When he reached maturity he went to Madyan, then Allah spoke to him in the sacred valley and sent him to Pharaoh.\n\nAllah supported him with miracles such as the staff and the hand, but Pharaoh denied him and grew arrogant. So Allah saved Musa and the Children of Israel, split the sea for them, drowned Pharaoh and his soldiers, and sent down to Musa the Torah as guidance and light.',
    refs: [{ n: 28, name: 'القصص' }, { n: 20, name: 'طه' }, { n: 7, name: 'الأعراف' }],
    passage: { surah: 20, from: 9, to: 24 },
  },
  {
    id: 'harun', name: 'هارون', en: 'Harun', note: 'أخو موسى ووزيره.', noteEn: 'Brother and helper of Musa.',
    story: 'هارون عليه السلام أخو موسى الأكبر، سأل موسى ربّه أن يجعله معه وزيرًا يشُدّ به أزره ويُشركه في أمره لفصاحته، فاستجاب الله ووهبه له نبيًّا. خلَفه موسى في قومه حين ذهب لميقات ربّه، فعالج فتنة العجل بالصبر والرفق حتى رجع موسى.',
    storyEn: 'Harun (Aaron, peace be upon him) was the elder brother of Musa. Musa asked his Lord to make Harun a helper to strengthen him and share in his mission, for he was more eloquent, and Allah granted him to him as a prophet. Musa left him in charge of his people when he went to his Lord’s appointment, and Harun handled the trial of the calf with patience and gentleness until Musa returned.',
    refs: [{ n: 20, name: 'طه' }, { n: 28, name: 'القصص' }, { n: 7, name: 'الأعراف' }],
    passage: { surah: 20, from: 29, to: 36 },
  },
  {
    id: 'dhulkifl', name: 'ذو الكِفل', en: 'Dhul-Kifl', note: 'من الصابرين الأخيار.', noteEn: 'Among the patient and the best.',
    story: 'ذو الكِفل عليه السلام ذكره الله مع إسماعيل وإدريس في جملة الصابرين، وأدخله في رحمته لأنّه كان من الصالحين الأخيار. وقد عُرف بالوفاء بالعهد والصبر على طاعة الله والقيام بأمر قومه بالعدل.',
    storyEn: 'Dhul-Kifl (peace be upon him) is mentioned by Allah alongside Ismail and Idris among the patient, and He admitted him into His mercy, for he was among the righteous and the best. He was known for keeping his covenant, for patience in obeying Allah, and for upholding the affairs of his people with justice.',
    refs: [{ n: 21, name: 'الأنبياء' }, { n: 38, name: 'ص' }],
    passage: { surah: 21, from: 85, to: 86 },
  },
  {
    id: 'dawud', name: 'داود', en: 'Dawud', note: 'آتاه الله المُلك والزبور.', noteEn: 'Given kingship and the Zabūr (Psalms).',
    story: 'داود عليه السلام آتاه الله المُلك والحكمة والنبوّة، وأنزل عليه الزبور، وسخّر معه الجبال والطير يُسبّحن، وألان له الحديد فكان يصنع منه الدروع. وكان قوّيًا في طاعة الله، كثير الصيام والقيام، عادلًا في حكمه بين الناس.',
    storyEn: 'Dawud (David, peace be upon him) was given by Allah kingship, wisdom and prophethood, and the Zabūr (Psalms) was revealed to him. Allah made the mountains and birds glorify Him along with David, and softened iron for him so he fashioned coats of mail. He was strong in obedience to Allah, devoted to fasting and night prayer, and just in his judgment among the people.',
    refs: [{ n: 38, name: 'ص' }, { n: 21, name: 'الأنبياء' }, { n: 2, name: 'البقرة' }],
    passage: { surah: 38, from: 17, to: 26 },
  },
  {
    id: 'sulayman', name: 'سليمان', en: 'Sulayman', note: 'سخّر الله له الريح والجنّ.', noteEn: 'Allah subjected the wind and the jinn to him.',
    story: 'سليمان عليه السلام ابن داود، ورِث النبوّة والمُلك، وسأل الله مُلكًا لا ينبغي لأحدٍ من بعده فأعطاه. سخّر الله له الريح تجري بأمره، والجنّ يعملون بين يديه، وعلّمه منطق الطير.\n\nومن قصصه مع الهدهد ومُلكة سبأ التي دعاها إلى الإسلام فأسلمت مع سليمان لله ربّ العالمين. وكان شاكرًا لنعمة الله قائمًا بالعدل.',
    storyEn: 'Sulayman (Solomon, peace be upon him), son of Dawud, inherited prophethood and kingship. He asked Allah for a kingdom that would belong to no one after him, and Allah granted it. Allah subjected the wind to run by his command, the jinn to work before him, and taught him the speech of the birds.\n\nAmong his stories is the one with the hoopoe and the Queen of Sheba, whom he called to Islam, and she submitted along with Sulayman to Allah, Lord of the worlds. He was grateful for Allah’s favour and upheld justice.',
    refs: [{ n: 27, name: 'النمل' }, { n: 38, name: 'ص' }, { n: 34, name: 'سبأ' }],
    passage: { surah: 27, from: 15, to: 19 },
  },
  {
    id: 'ilyas', name: 'إلياس', en: 'Ilyas', note: 'من المرسلين.', noteEn: 'One of the messengers.',
    story: 'إلياس عليه السلام من المرسلين، أرسله الله إلى قومه يدعوهم إلى تقوى الله وترك عبادة الصنم «بعل»، فكذّبوه إلا عباد الله المخلصين. أثنى الله عليه وسلّم عليه في العالمين، فإنّه كان من عباده المؤمنين.',
    storyEn: 'Ilyas (Elijah, peace be upon him) was one of the messengers. Allah sent him to his people, calling them to the fear of Allah and to abandon the worship of the idol “Baʿl.” They denied him, except the sincere servants of Allah. Allah praised him and sent peace upon him among the worlds, for he was among His believing servants.',
    refs: [{ n: 37, name: 'الصافات' }, { n: 6, name: 'الأنعام' }],
    passage: { surah: 37, from: 123, to: 132 },
  },
  {
    id: 'alyasa', name: 'اليَسَع', en: 'Al-Yasa', note: 'من الأخيار المصطفَين.', noteEn: 'Among the chosen and the best.',
    story: 'اليَسَع عليه السلام نبيٌّ كريم ذكره الله في كتابه مع إسماعيل وذي الكِفل، وعدّه من الأخيار، ومن الذين فضّلهم على العالمين. دعا قومه إلى توحيد الله والاستقامة على دينه.',
    storyEn: 'Al-Yasaʿ (Elisha, peace be upon him) was a noble prophet whom Allah mentioned in His Book alongside Ismail and Dhul-Kifl, counting him among the best and among those He favoured above the worlds. He called his people to the worship of the One God and to steadfastness upon His religion.',
    refs: [{ n: 6, name: 'الأنعام' }, { n: 38, name: 'ص' }],
    passage: { surah: 38, from: 48, to: 48 },
  },
  {
    id: 'yunus', name: 'يونس', en: 'Yunus', note: 'ذو النون؛ نجّاه الله بتسبيحه.', noteEn: 'Companion of the whale; saved by his glorification.',
    story: 'يونس عليه السلام (ذو النون) أرسله الله إلى أهل نينوى، فلمّا أبطؤوا في الإيمان غاضبهم وخرج من غير إذن ربّه، فركب السفينة فالتقمه الحوت.\n\nفنادى في الظلمات: «لا إله إلا أنت سبحانك إنّي كنت من الظالمين»، فاستجاب الله له ونجّاه من الغمّ، ونبذه بالعراء سقيمًا، وأنبت عليه شجرة، فآمن قومه فمتّعهم الله إلى حين.',
    storyEn: 'Yunus (Jonah, peace be upon him), the Companion of the Whale, was sent by Allah to the people of Nineveh. When they were slow to believe, he left in anger without his Lord’s permission and boarded a ship, and the whale swallowed him.\n\nHe called out in the darkness: “There is no god but You; glory be to You; indeed I was among the wrongdoers.” So Allah answered him, saved him from the distress, cast him onto the open shore while he was ill, and caused a plant to grow over him. His people then believed, so Allah granted them enjoyment for a time.',
    refs: [{ n: 21, name: 'الأنبياء' }, { n: 37, name: 'الصافات' }, { n: 10, name: 'يونس' }],
    passage: { surah: 21, from: 87, to: 88 },
  },
  {
    id: 'zakariyya', name: 'زكريّا', en: 'Zakariyya', note: 'كفل مريم ورُزِق يحيى على الكِبَر.', noteEn: 'Guardian of Maryam; granted Yahya in old age.',
    story: 'زكريّا عليه السلام نبيٌّ كفل مريم ورعاها، فكان كلّما دخل عليها المحراب وجد عندها رزقًا من عند الله. ولمّا رأى ذلك دعا ربّه أن يهبه ذرّيّة طيّبة وقد بلغ الكِبَر وامرأته عاقر.\n\nفبشّره الله بيحيى، وجعل آيته أن لا يكلّم الناس ثلاثة أيّام إلا رمزًا، شكرًا لله على نعمته.',
    storyEn: 'Zakariyya (Zechariah, peace be upon him) was a prophet who took charge of Maryam and cared for her; whenever he entered upon her in the prayer-niche he found with her provision from Allah. Seeing that, he asked his Lord to grant him good offspring, though he had reached old age and his wife was barren.\n\nAllah gave him glad tidings of Yahya, and made his sign that he would not speak to people for three days except by gesture, in gratitude to Allah for His favour.',
    refs: [{ n: 19, name: 'مريم' }, { n: 3, name: 'آل عمران' }, { n: 21, name: 'الأنبياء' }],
    passage: { surah: 19, from: 2, to: 11 },
  },
  {
    id: 'yahya', name: 'يحيى', en: 'Yahya', note: 'ابن زكريّا، آتاه الله الحُكم صبيًّا.', noteEn: 'Son of Zakariyya; given wisdom as a child.',
    story: 'يحيى عليه السلام ابن زكريّا، بشّر الله به أباه على الكِبَر، وسمّاه باسمٍ لم يجعله لأحدٍ من قبل. آتاه الله الحُكم صبيًّا، وجعله حَنانًا من لدنه وزكاةً وتقيًّا، وبَرًّا بوالديه، ولم يكن جبّارًا عصيًّا. وسلّم الله عليه يوم وُلد ويوم يموت ويوم يُبعث حيًّا.',
    storyEn: 'Yahya (John, peace be upon him), son of Zakariyya, was given to his father in old age as glad tidings, and Allah named him a name He had given to none before. Allah gave him wisdom as a child, made him tender of heart, pure and God-fearing, dutiful to his parents, and he was neither a tyrant nor disobedient. Allah sent peace upon him the day he was born, the day he dies, and the day he is raised alive.',
    refs: [{ n: 19, name: 'مريم' }, { n: 3, name: 'آل عمران' }],
    passage: { surah: 19, from: 12, to: 15 },
  },
  {
    id: 'isa', name: 'عيسى', en: 'Isa', note: 'ابن مريم؛ وُلد بمعجزة.', noteEn: 'Son of Maryam; born by a miracle.',
    story: 'عيسى عليه السلام ابن مريم العذراء البتول، خلقه الله بكلمةٍ منه من غير أب، فحملت به مريم وولدته، فكلّم الناس في المهد صبيًّا وبرّأ أمّه.\n\nأيّده الله بالبيّنات وروح القُدُس، فكان يُبرئ الأكمه والأبرص ويُحيي الموتى بإذن الله، وأنزل عليه الإنجيل هدًى ونورًا، ودعا قومه إلى عبادة الله وحده. ولمّا أراد الكافرون قتله رفعه الله إليه، وهو من المقرّبين.',
    storyEn: 'Isa (Jesus, peace be upon him), son of the virgin Maryam, was created by Allah with a word from Him without a father. Maryam conceived him and gave birth to him, and he spoke to people in the cradle as an infant and declared his mother’s innocence.\n\nAllah supported him with clear signs and the Holy Spirit, so by Allah’s permission he healed the blind and the leper and revived the dead. The Injīl (Gospel) was sent down to him as guidance and light, and he called his people to worship Allah alone. When the disbelievers sought to kill him, Allah raised him up to Himself, and he is among those brought near.',
    refs: [{ n: 3, name: 'آل عمران' }, { n: 19, name: 'مريم' }, { n: 5, name: 'المائدة' }],
    passage: { surah: 19, from: 16, to: 26 },
  },
  {
    id: 'muhammad', name: 'محمد ﷺ', en: 'Muhammad ﷺ', note: 'خاتم الأنبياء والمرسلين.', noteEn: 'The Seal of the Prophets and Messengers.',
    story: 'محمد ﷺ خاتم الأنبياء والمرسلين، أرسله الله رحمةً للعالمين، وأنزل عليه القرآن هدًى للناس. بُعث في قومٍ يعبدون الأصنام فدعاهم إلى توحيد الله ومكارم الأخلاق، فصبر على الأذى، وهاجر في سبيل الله، حتى أتمّ الله به الدين وأظهره على الدين كله.\n\nكان خُلُقه القرآن، رؤوفًا رحيمًا بالمؤمنين، فبلّغ الرسالة وأدّى الأمانة ونصح الأمّة، صلّى الله عليه وسلّم.',
    storyEn: 'Muhammad ﷺ is the Seal of the Prophets and Messengers. Allah sent him as a mercy to the worlds and revealed to him the Qur’an as guidance for mankind. He was raised among a people who worshipped idols, so he called them to the worship of the One God and to noble character. He bore harm with patience, migrated for the sake of Allah, until Allah perfected the religion through him and made it prevail over all religion.\n\nHis character was the Qur’an itself — kind and merciful to the believers. He conveyed the message, fulfilled the trust, and sincerely advised the Ummah; may Allah’s peace and blessings be upon him.',
    refs: [{ n: 93, name: 'الضحى' }, { n: 94, name: 'الشرح' }, { n: 48, name: 'الفتح' }],
    passage: { surah: 93, from: 1, to: 11 },
  },
];
