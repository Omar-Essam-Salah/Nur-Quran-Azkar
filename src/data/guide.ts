// "Muslim Guide" (دليل المسلم) — a concise, practical, mainstream (non-sectarian)
// how-to for purification, the prayers, and the rites of Hajj & Umrah.
// Content is authored from broadly-agreed Sunni fiqh basics.

// `en*` fields hold the English translation of the corresponding Arabic field.
// They're optional: when missing, the UI falls back to the Arabic text, so the
// guide always works even while translation is being filled in.
export interface GuideStep { text: string; en?: string; note?: string; noteEn?: string }
export interface GuideTopic { id: string; title: string; en: string; intro?: string; introEn?: string; steps: GuideStep[]; ref?: string; refEn?: string }
export interface GuideSection { id: string; title: string; en: string; icon: string; topics: GuideTopic[] }

export const GUIDE: GuideSection[] = [
  {
    id: 'tahara', title: 'الطهارة', en: 'Purification', icon: 'droplets',
    topics: [
      {
        id: 'wudu', title: 'الوضوء', en: 'Ablution (Wudu)',
        intro: 'الوضوء شرطٌ لصحّة الصلاة. قال تعالى: ﴿يا أيها الذين آمنوا إذا قمتم إلى الصلاة فاغسلوا وجوهكم وأيديكم إلى المرافق وامسحوا برؤوسكم وأرجلكم إلى الكعبين﴾.',
        introEn: 'Wudu is a condition for the validity of prayer. Allah says: "O you who believe, when you rise to pray, wash your faces and your hands up to the elbows, wipe your heads, and (wash) your feet up to the ankles."',
        steps: [
          { text: 'النيّة بالقلب (نيّة رفع الحدث)، ثم التسمية: «بسم الله».', en: 'Make the intention in the heart, then say the Basmala: "Bismillah" (In the name of Allah).' },
          { text: 'غسل الكفّين ثلاث مرات.', en: 'Wash both hands up to the wrists three times.' },
          { text: 'المضمضة: إدخال الماء في الفم وإدارته، ثلاثًا.', en: 'Rinse the mouth, swirling water around it, three times.' },
          { text: 'الاستنشاق: جذب الماء بالأنف ثم الاستنثار (إخراجه)، ثلاثًا.', en: 'Sniff water into the nose then blow it out, three times.' },
          { text: 'غسل الوجه ثلاثًا: من منابت شعر الرأس إلى أسفل الذقن، ومن الأذن إلى الأذن.', en: 'Wash the face three times: from the hairline to under the chin, and from ear to ear.' },
          { text: 'غسل اليدين إلى المرفقين ثلاثًا، يبدأ باليمنى ثم اليسرى.', en: 'Wash the arms to the elbows three times, starting with the right then the left.' },
          { text: 'مسح الرأس مرّة واحدة: يمرّر كفّيه من مقدّم الرأس إلى مؤخّره ثم يعيدهما، ثم يمسح الأذنين.', en: 'Wipe the head once: pass both hands from the front of the head to the back and back again, then wipe the ears.' },
          { text: 'غسل الرجلين إلى الكعبين ثلاثًا مع تخليل الأصابع، يبدأ باليمنى.', en: 'Wash the feet to the ankles three times, running fingers between the toes, starting with the right.' },
          { text: 'الدعاء بعده: «أشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أنّ محمدًا عبده ورسوله، اللهم اجعلني من التوّابين واجعلني من المتطهّرين».', en: 'Supplicate afterward: "I bear witness that there is no god but Allah alone, with no partner, and that Muhammad is His servant and messenger. O Allah, make me of those who repent and of those who purify themselves."' },
        ],
        ref: 'مع مراعاة الترتيب والموالاة (عدم التفريق الطويل بين الأعضاء).',
        refEn: 'Observe the order of the limbs and continuity (without a long gap between washing them).',
      },
      {
        id: 'ghusl', title: 'الغُسل من الجنابة', en: 'Ritual Bath (Ghusl)',
        intro: 'يجب الغُسل من الجنابة (الجماع أو خروج المنيّ)، ومن الحيض والنّفاس للمرأة، قبل الصلاة وقراءة القرآن.',
        introEn: 'Ghusl is obligatory after major impurity (intercourse or emission), and after menses and post-natal bleeding for women, before praying or reciting the Quran.',
        steps: [
          { text: 'النيّة، ثم التسمية وغسل الكفّين ثلاثًا.', en: 'Make the intention, say the Basmala, and wash both hands three times.' },
          { text: 'غسل الفرج وإزالة ما عليه من أذى باليد اليسرى.', en: 'Wash the private parts and remove any impurity with the left hand.' },
          { text: 'الوضوء كوضوء الصلاة، ما عدا القدمين (يؤخّر غسلهما إلى آخر الغسل).', en: 'Perform wudu as for prayer, except the feet (delay washing them to the end of the ghusl).' },
          { text: 'إفاضة الماء على الرأس ثلاثًا مع تخليل أصول الشعر حتى يصل الماء إلى البشرة.', en: 'Pour water over the head three times, working it through the roots of the hair until it reaches the scalp.' },
          { text: 'إفاضة الماء على سائر الجسد، يبدأ بالشقّ الأيمن ثم الأيسر، مع تعميم البدن كلّه.', en: 'Pour water over the rest of the body, starting with the right side then the left, covering the entire body.' },
          { text: 'ثم غسل القدمين، إتمامًا للوضوء.', en: 'Then wash the feet, completing the wudu.' },
        ],
        ref: 'المرأة لا يلزمها نقض ضفائر شعرها في غسل الجنابة، ويكفيها إيصال الماء إلى أصول الشعر.',
        refEn: 'A woman need not undo her braids for the ghusl of major impurity; it suffices to let the water reach the roots of the hair.',
      },
      {
        id: 'tayammum', title: 'التيمّم', en: 'Dry Ablution (Tayammum)',
        intro: 'يُشرع عند فقد الماء، أو العجز عن استعماله لمرضٍ أو بردٍ شديد ونحوه.',
        introEn: 'Permitted when water is unavailable, or when it cannot be used due to illness, severe cold, and the like.',
        steps: [
          { text: 'النيّة، ثم التسمية.', en: 'Make the intention, then say the Basmala.' },
          { text: 'ضرب الأرض الطاهرة (تراب أو ما في معناه) بباطن الكفّين ضربةً واحدة.', en: 'Strike clean earth (dust or similar) once with the palms of both hands.' },
          { text: 'مسح الوجه بباطن الكفّين.', en: 'Wipe the face with the palms.' },
          { text: 'مسح ظاهر الكفّين أحدهما بالآخر.', en: 'Wipe the back of each hand with the other.' },
        ],
      },
    ],
  },
  {
    id: 'salah', title: 'الصلاة', en: 'The Prayer', icon: 'sun',
    topics: [
      {
        id: 'how', title: 'صفة الصلاة', en: 'How to Pray',
        intro: 'هذه صفة الصلاة بإيجاز، يُؤدّيها المصلّي على طهارةٍ مستقبلًا القبلة ساترًا عورته.',
        introEn: 'A concise description of the prayer, performed in a state of purity, facing the Qibla, with the body properly covered.',
        steps: [
          { text: 'النيّة بالقلب، ثم تكبيرة الإحرام «الله أكبر» رافعًا يديه حذو منكبيه.', en: 'Make the intention in the heart, then the opening takbir "Allahu Akbar" while raising the hands to shoulder level.' },
          { text: 'دعاء الاستفتاح: «سبحانك اللهم وبحمدك، وتبارك اسمك، وتعالى جدّك، ولا إله غيرك»، ثم الاستعاذة والبسملة.', en: 'The opening supplication: "Glory be to You, O Allah, and praise; blessed is Your name, exalted is Your majesty, and there is no god but You," then seek refuge from Satan and say the Basmala.' },
          { text: 'قراءة الفاتحة (ركنٌ في كل ركعة)، ثم ما تيسّر من القرآن في الركعتين الأوليين.', en: 'Recite al-Fatiha (a pillar in every unit), then whatever is easy of the Quran in the first two units.' },
          { text: 'الركوع: «الله أكبر» ثم «سبحان ربّي العظيم» ثلاثًا.', en: 'Bowing (ruku): "Allahu Akbar," then "Glory to my Lord the Most Great" three times.' },
          { text: 'الرفع: «سمع الله لمن حمده»، «ربّنا ولك الحمد».', en: 'Rising: "Allah hears whoever praises Him," "Our Lord, to You is all praise."' },
          { text: 'السجود على سبعة أعضاء: «الله أكبر» ثم «سبحان ربّي الأعلى» ثلاثًا.', en: 'Prostration on seven limbs: "Allahu Akbar," then "Glory to my Lord the Most High" three times.' },
          { text: 'الجلوس بين السجدتين: «ربِّ اغفر لي»، ثم السجدة الثانية.', en: 'Sitting between the two prostrations: "My Lord, forgive me," then the second prostration.' },
          { text: 'في الصلاة الثلاثية أو الرباعية: بعد الركعة الثانية يجلس للتشهّد الأول، ثم يُكبّر «الله أكبر» ناهضًا قائمًا لإتمام باقي الركعات.', en: 'In a 3- or 4-unit prayer: after the second unit, sit for the first tashahhud, then say "Allahu Akbar" and stand to complete the remaining units.' },
          { text: 'التشهّد الأخير ثم الصلاة الإبراهيمية: «اللهم صلِّ على محمد وعلى آل محمد، كما صليت على إبراهيم وعلى آل إبراهيم…».', en: 'The final tashahhud, then the Ibrahimi salawat: "O Allah, send blessings upon Muhammad and the family of Muhammad as You blessed Ibrahim and the family of Ibrahim…"' },
          { text: 'التسليم يمينًا وشمالًا: «السلام عليكم ورحمة الله».', en: 'The closing salam to the right and left: "Peace and mercy of Allah be upon you."' },
        ],
      },
      {
        id: 'five', title: 'الصلوات الخمس وعدد ركعاتها', en: 'The Five Daily Prayers',
        intro: 'الصلوات المفروضة خمسٌ في اليوم والليلة:',
        introEn: 'The obligatory prayers are five each day and night:',
        steps: [
          { text: 'الفجر: ركعتان (جهريّة)، وقتها من طلوع الفجر الصادق إلى شروق الشمس.', en: 'Fajr: 2 units (recited aloud), from true dawn until sunrise.' },
          { text: 'الظهر: أربع ركعات (سرّية)، وقتها من زوال الشمس إلى أن يصير ظلّ الشيء مثله.', en: 'Dhuhr: 4 units (recited silently), from the sun’s decline past zenith until an object’s shadow equals its length.' },
          { text: 'العصر: أربع ركعات (سرّية)، إلى اصفرار الشمس (والضرورة إلى الغروب).', en: 'Asr: 4 units (silently), until the sun yellows (and, out of necessity, until sunset).' },
          { text: 'المغرب: ثلاث ركعات (جهريّة في الأوليين)، من الغروب إلى مغيب الشفق الأحمر.', en: 'Maghrib: 3 units (first two aloud), from sunset until the red twilight fades.' },
          { text: 'العشاء: أربع ركعات (جهريّة في الأوليين)، إلى منتصف الليل.', en: 'Isha: 4 units (first two aloud), until midnight.' },
        ],
      },
      {
        id: 'rawatib', title: 'السنن الرواتب', en: 'Sunnah Rawatib',
        intro: 'اثنتا عشرة ركعة، من حافظ عليها بنى الله له بيتًا في الجنة:',
        introEn: 'Twelve units; whoever keeps to them, Allah builds for him a house in Paradise:',
        steps: [
          { text: 'ركعتان قبل الفجر (آكدها).', en: '2 units before Fajr (the most emphasized).' },
          { text: 'أربع ركعات قبل الظهر (ركعتان ركعتان) وركعتان بعدها.', en: '4 units before Dhuhr (two by two) and 2 units after it.' },
          { text: 'ركعتان بعد المغرب.', en: '2 units after Maghrib.' },
          { text: 'ركعتان بعد العشاء.', en: '2 units after Isha.' },
        ],
      },
      {
        id: 'witr', title: 'صلاة الوتر', en: 'Witr Prayer',
        intro: 'سنّة مؤكّدة، وقتها بعد العشاء إلى طلوع الفجر، أقلّها ركعة وأكثرها إحدى عشرة.',
        introEn: 'An emphasized sunnah, performed after Isha until dawn; its minimum is one unit and its maximum eleven.',
        steps: [
          { text: 'يصلّي ركعتين ويسلّم، ثم يصلّي ركعةً واحدة، أو يصلّي ثلاثًا متّصلة.', en: 'Pray two units and give salam, then pray a single unit; or pray three joined together.' },
          { text: 'يُستحبّ القنوت في الركعة الأخيرة: «اللهم اهدني فيمن هديت، وعافني فيمن عافيت…».', en: 'It is recommended to make qunut in the last unit: "O Allah, guide me among those You have guided, grant me well-being among those You have granted it…"' },
        ],
      },
      {
        id: 'duha', title: 'صلاة الضحى', en: 'Duha Prayer',
        intro: 'وقتها من ارتفاع الشمس قِيد رمح إلى قُبيل الزوال. أقلّها ركعتان وأكثرها ثمان، وهي صدقة عن مفاصل البدن.',
        introEn: 'Its time is from when the sun has risen a spear’s length until just before noon. Its minimum is 2 units and maximum 8; it is a charity on behalf of the body’s joints.',
        steps: [{ text: 'تُصلّى ركعتين ركعتين بنيّة الضحى في وقتها.', en: 'Pray two units at a time with the intention of Duha during its window.' }],
      },
      {
        id: 'qiyam', title: 'قيام الليل (التهجّد)', en: 'Night Prayer (Tahajjud)',
        intro: 'أفضل الصلاة بعد الفريضة، وأفضل وقتها الثلث الأخير من الليل حين ينزل ربّنا نزولًا يليق بجلاله.',
        introEn: 'The best prayer after the obligatory ones; its best time is the last third of the night, when our Lord descends in a manner befitting His majesty.',
        steps: [
          { text: 'تُصلّى ركعتين ركعتين، يُطيل فيها القراءة والدعاء ما استطاع.', en: 'Pray two units at a time, lengthening the recitation and supplication as much as you can.' },
          { text: 'يُختم قيام الليل بالوتر.', en: 'Conclude the night prayer with Witr.' },
        ],
      },
      {
        id: 'tasabih', title: 'صلاة التسابيح', en: 'Salat al-Tasabih',
        intro: 'أربع ركعات يُكثر فيها من التسبيح حتى يبلغ ثلاثمئة تسبيحة. التسبيح هو: «سبحان الله والحمد لله ولا إله إلا الله والله أكبر».',
        introEn: 'Four units in which the tasbih is repeated until it reaches 300. The tasbih is: "Glory be to Allah, praise be to Allah, there is no god but Allah, and Allah is the Greatest."',
        steps: [
          { text: 'تُصلّى أربع ركعات بتسليمةٍ واحدة أو تسليمتين.', en: 'Pray four units with one salam, or two.' },
          { text: 'بعد قراءة الفاتحة والسورة (قبل الركوع) تقول التسبيح ١٥ مرّة.', en: 'After reciting al-Fatiha and a surah (before bowing), say the tasbih 15 times.' },
          { text: 'في الركوع بعد تسبيحه تقوله ١٠ مرّات.', en: 'In bowing, after its usual glorification, say it 10 times.' },
          { text: 'بعد الرفع من الركوع ١٠ مرّات.', en: 'After rising from bowing, 10 times.' },
          { text: 'في السجود الأول ١٠، وبين السجدتين ١٠، وفي السجود الثاني ١٠.', en: 'In the first prostration 10, between the two prostrations 10, and in the second prostration 10.' },
          { text: 'فذلك ٧٥ تسبيحة في كل ركعة، × ٤ ركعات = ٣٠٠ تسبيحة.', en: 'That is 75 in each unit × 4 units = 300 tasbih in total.' },
        ],
      },
      {
        id: 'istikhara', title: 'صلاة الاستخارة', en: 'Istikhara Prayer',
        intro: 'إذا همّ المسلم بأمرٍ يصلّي ركعتين من غير الفريضة ثم يدعو بدعاء الاستخارة.',
        introEn: 'When a Muslim intends a matter, he prays two non-obligatory units then makes the istikhara supplication.',
        steps: [
          { text: 'يصلّي ركعتين بنيّة الاستخارة.', en: 'Pray two units with the intention of istikhara.' },
          { text: 'ثم يدعو: «اللهم إني أستخيرك بعلمك، وأستقدرك بقدرتك، وأسألك من فضلك العظيم… اللهم إن كنت تعلم أنّ هذا الأمر خيرٌ لي… فاقدره لي ويسّره لي ثم بارك لي فيه…».', en: 'Then supplicate: "O Allah, I seek Your guidance by Your knowledge, and Your power by Your might, and I ask of Your great bounty… O Allah, if You know this matter is good for me… then decree it for me, make it easy for me, and bless it for me…"' },
        ],
      },
      {
        id: 'janaza', title: 'صلاة الجنازة', en: 'Funeral Prayer',
        intro: 'فرض كفاية، تُصلّى قيامًا بلا ركوع ولا سجود، بأربع تكبيرات.',
        introEn: 'A communal obligation, prayed standing with no bowing or prostration, with four takbirs.',
        steps: [
          { text: 'التكبيرة الأولى (تكبيرة الإحرام) ثم قراءة الفاتحة.', en: 'The first takbir (the opening takbir), then recite al-Fatiha.' },
          { text: 'التكبيرة الثانية ثم الصلاة الإبراهيمية على النبي ﷺ.', en: 'The second takbir, then the Ibrahimi salawat upon the Prophet ﷺ.' },
          { text: 'التكبيرة الثالثة ثم الدعاء للميّت: «اللهم اغفر له وارحمه وعافه واعفُ عنه…».', en: 'The third takbir, then supplication for the deceased: "O Allah, forgive him, have mercy on him, pardon him…"' },
          { text: 'التكبيرة الرابعة، ثم وقفةٌ يسيرة، ويُدعى فيها: «اللهم اغفر للمسلمين والمسلمات، والمؤمنين والمؤمنات، الأحياء منهم والأموات»، ثم التسليم.', en: 'The fourth takbir, then a brief pause with supplication: "O Allah, forgive the believing men and women, the living and the dead," then give salam.' },
        ],
      },
      {
        id: 'dua-mayyit', title: 'أدعية للمتوفّى', en: 'Du‘a for the Deceased',
        intro: 'يُدعى للميّت في صلاة الجنازة، وبعد دفنه، وعند زيارة قبره؛ فالدعاء له صدقةٌ جارية تنفعه:',
        introEn: 'The deceased is prayed for in the funeral prayer, after burial, and when visiting the grave; supplication for them is an ongoing charity that benefits them:',
        steps: [
          { text: 'اللهم اغفر له وارحمه، وعافِه واعفُ عنه، وأكرم نُزُله، ووسِّع مُدخَله، واغسله بالماء والثلج والبَرَد، ونقِّه من الخطايا كما يُنقّى الثوب الأبيض من الدَّنَس، وأبدله دارًا خيرًا من داره، وأهلًا خيرًا من أهله، وأدخله الجنّة، وأعِذه من عذاب القبر وعذاب النار.', en: 'O Allah, forgive him and have mercy on him, keep him safe and pardon him, honor his resting place, widen his entry, wash him with water, snow and hail, and cleanse him of sins as a white garment is cleansed of dirt; give him a home better than his home, a family better than his family, admit him to Paradise, and protect him from the punishment of the grave and the Fire.', note: 'رواه مسلم', noteEn: 'Reported by Muslim' },
          { text: 'اللهم اغفر لحيِّنا وميّتنا، وشاهدنا وغائبنا، وصغيرنا وكبيرنا، وذكرنا وأنثانا. اللهم من أحييته منّا فأحيِه على الإسلام، ومن توفّيته منّا فتوفّه على الإيمان.', en: 'O Allah, forgive our living and our dead, those present and absent, our young and old, our males and females. O Allah, whomever of us You keep alive, keep him alive upon Islam, and whomever You take, take him upon faith.', note: 'رواه أبو داود والترمذي', noteEn: 'Reported by Abu Dawud & al-Tirmidhi' },
          { text: 'اللهم إنّ هذا عبدُك ابنُ عبدك، احتاج إلى رحمتك، وأنت غنيٌّ عن عذابه؛ إن كان محسنًا فزِد في حسناته، وإن كان مسيئًا فتجاوز عنه.', en: 'O Allah, this is Your servant, son of Your servant; he is in need of Your mercy and You have no need to punish him. If he was righteous, increase his good deeds; if he erred, overlook it.' },
          { text: 'للطفل الصغير: اللهم اجعله لوالديه فرَطًا وسلفًا وذُخرًا، وثقّل به موازينهما، وأعظِم به أجورهما.', en: 'For a young child: O Allah, make him a forerunner, an advance reward and a treasure for his parents, and through him make heavy their scales and great their reward.' },
          { text: 'عند الدفن يُقال: «بسم الله وعلى مِلّة رسول الله»، ثم يُدعى له بالتثبيت: اللهم ثبّته عند السؤال.', en: 'At burial say: "In the name of Allah and upon the way of the Messenger of Allah," then pray for his steadfastness: O Allah, make him firm when questioned.', note: 'رواه أبو داود', noteEn: 'Reported by Abu Dawud' },
        ],
        ref: 'يُستحبّ الإكثار من الدعاء والاستغفار للميّت، والصدقة عنه، ولا يُذكر عند قبره إلا بخير.',
        refEn: 'It is recommended to supplicate and seek forgiveness for the deceased often, give charity on their behalf, and mention them only with good at the grave.',
      },
      {
        id: 'jumua', title: 'الجمعة والعيدان والتراويح', en: 'Jumu‘ah, Eid & Taraweeh',
        intro: 'صلوات جماعةٍ مخصوصة:',
        introEn: 'Specific congregational prayers:',
        steps: [
          { text: 'الجمعة: ركعتان جهريّتان تسبقهما خطبتان، تجب على الرجال البالغين بدل الظهر.', en: 'Jumu‘ah: 2 units recited aloud, preceded by two sermons; obligatory on adult men in place of Dhuhr.' },
          { text: 'العيدان: ركعتان فيهما تكبيراتٌ زوائد (سبعٌ في الأولى وخمسٌ في الثانية) ثم خطبة.', en: 'The two Eids: 2 units with extra takbirs (seven in the first, five in the second), then a sermon.' },
          { text: 'التراويح: قيام رمضان، تُصلّى ركعتين ركعتين بعد العشاء، ويُوتر بعدها.', en: 'Taraweeh: the night prayer of Ramadan, prayed two units at a time after Isha, ending with Witr.' },
        ],
      },
    ],
  },
  {
    id: 'hajj', title: 'الحج والعمرة', en: 'Hajj & Umrah', icon: 'kaaba',
    topics: [
      {
        id: 'umrah', title: 'مناسك العمرة', en: 'The Rites of Umrah',
        intro: 'العمرة سنّة مؤكّدة، وأركانها: الإحرام، والطواف، والسعي، والحلق أو التقصير.',
        introEn: 'Umrah is an emphasized sunnah. Its pillars are: ihram, tawaf, sa‘i, and shaving or trimming the hair.',
        steps: [
          { text: 'الإحرام من الميقات بنيّة العمرة، والتلبية: «لبّيك اللهم عمرة»، ثم «لبّيك اللهم لبّيك…».', en: 'Enter ihram at the miqat with the intention of Umrah, declaring: "Here I am, O Allah, for Umrah," then "Here I am, O Allah, here I am…"' },
          { text: 'دخول المسجد الحرام والطواف بالكعبة سبعة أشواط، يبدأ ويختم بالحجر الأسود.', en: 'Enter the Sacred Mosque and circle the Ka‘bah seven times (tawaf), beginning and ending at the Black Stone.' },
          { text: 'صلاة ركعتين خلف مقام إبراهيم إن تيسّر، وإلا ففي أي مكانٍ من المسجد.', en: 'Pray two units behind the Station of Ibrahim if possible, otherwise anywhere in the mosque.' },
          { text: 'السعي بين الصفا والمروة سبعة أشواط (يبدأ بالصفا).', en: 'Walk between Safa and Marwah seven times (sa‘i), starting at Safa.' },
          { text: 'الحلق أو التقصير، وبه تتمّ العمرة ويتحلّل المعتمر.', en: 'Shave or trim the hair — with this the Umrah is complete and the pilgrim exits ihram.' },
        ],
      },
      {
        id: 'hajj', title: 'مناسك الحج', en: 'The Rites of Hajj',
        intro: 'الحج ركن الإسلام الخامس على المستطيع، ومناسكه مرتّبة على أيام محدّدة من ٨ إلى ١٣ ذي الحجة. أركانه: الإحرام، والوقوف بعرفة، وطواف الإفاضة، والسعي. وإليك التفصيل يومًا بيوم:',
        introEn: 'Hajj is the fifth pillar of Islam upon those able. Its rites are arranged over set days, 8–13 Dhul-Hijjah. Its pillars are: ihram, standing at Arafah, tawaf al-ifadah, and sa‘i. Here is the day-by-day detail:',
        steps: [
          { text: '١) يوم التروية (٨ ذو الحجة): الإحرام بنيّة الحج من مكانك والتلبية: «لبّيك اللهم حجًّا».', en: '1) Day of Tarwiyah (8 Dhul-Hijjah): Enter ihram with the intention of Hajj from your place, declaring: "Here I am, O Allah, for Hajj."', note: 'ثم الإكثار من التلبية: «لبّيك اللهم لبّيك، لبّيك لا شريك لك لبّيك…».', noteEn: 'Then frequently repeat the talbiyah: "Here I am, O Allah, here I am; You have no partner, here I am…"' },
          { text: 'التوجّه إلى مِنى، وصلاة الظهر والعصر والمغرب والعشاء والفجر فيها قصرًا (من غير جمع)، والمبيت بها.', en: 'Proceed to Mina, praying Dhuhr, Asr, Maghrib, Isha and Fajr there shortened (without combining), and stay overnight.' },
          { text: '٢) يوم عرفة (٩ ذو الحجة): بعد الشروق التوجّه من مِنى إلى عرفات.', en: '2) Day of Arafah (9 Dhul-Hijjah): After sunrise, head from Mina to Arafat.' },
          { text: 'صلاة الظهر والعصر جمع تقديم وقصرًا (ركعتين ركعتين) في نَمِرة أو مخيّمك.', en: 'Pray Dhuhr and Asr combined-early and shortened (two units each) at Namirah or your camp.' },
          { text: 'الوقوف بعرفة والإكثار من الدعاء والتضرّع والذكر حتى غروب الشمس — وهو الركن الأعظم: «الحجّ عرفة».', en: 'Stand at Arafah, abundant in supplication, humility and remembrance until sunset — the greatest pillar: "Hajj is Arafah."' },
          { text: 'بعد الغروب: الدفع إلى مزدلفة، وصلاة المغرب والعشاء جمع تأخير، والمبيت بها حتى الفجر، ولقط حصى الجمار.', en: 'After sunset: move to Muzdalifah, pray Maghrib and Isha combined-late, stay overnight until Fajr, and gather pebbles for the stoning.' },
          { text: '٣) يوم النحر (١٠ ذو الحجة): بعد طلوع الشمس في مِنى، رمي جمرة العقبة الكبرى بسبع حصيات.', en: '3) Day of Nahr (10 Dhul-Hijjah): After sunrise in Mina, stone the great Jamrat al-Aqabah with seven pebbles.' },
          { text: 'الهَدي: ذبح الهَدي (للمتمتّع والقارن).', en: 'The sacrifice: slaughter the hady (for those performing tamattu‘ and qiran).' },
          { text: 'التحلّل الأول: حلق الرأس أو تقصيره — وبه يحلّ كل شيء إلا النساء.', en: 'First release from ihram: shave or trim the head — after which everything becomes permitted except intimacy.' },
          { text: 'طواف الإفاضة بمكة سبعة أشواط، وركعتان، ثم السعي بين الصفا والمروة — وبعده التحلّل الكامل.', en: 'Tawaf al-ifadah in Mecca (seven circuits) and two units, then sa‘i between Safa and Marwah — after which the full release is complete.' },
          { text: '٤) أيام التشريق (١١–١٢–١٣ ذو الحجة): المبيت بمِنى لياليها.', en: '4) Days of Tashriq (11–12–13 Dhul-Hijjah): Stay overnight in Mina on its nights.' },
          { text: 'رمي الجمرات الثلاث بعد الزوال كل يوم: الصغرى ثم الوسطى ثم الكبرى، بسبع حصيات لكل جمرة.', en: 'Stone the three Jamarat after midday each day: the small, then the middle, then the great, with seven pebbles each.', note: 'يجوز للمتعجّل الخروج من مِنى يوم ١٢ قبل غروب الشمس.', noteEn: 'Those in haste may leave Mina on the 12th before sunset.' },
          { text: '٥) طواف الوداع: آخر المناسك عند مغادرة مكة، يطوف الحاج سبعة أشواط ويكون آخر عهده بالبيت.', en: '5) Farewell tawaf: the final rite upon leaving Mecca — the pilgrim makes seven circuits, so the House is the last thing they encounter.' },
        ],
        ref: 'الفرق باختصار — العمرة: إحرام وطواف وسعي وتقصير (في أي وقت). الحج: مرتبط بأيام ٨–١٣ ذي الحجة، وفيه الوقوف بعرفة والمبيت بمِنى ومزدلفة ورمي الجمرات. ومن ترك واجبًا جبره بدمٍ، ومن ترك ركنًا لم يصحّ حجّه إلا به.',
        refEn: 'The difference in brief — Umrah: ihram, tawaf, sa‘i and trimming (any time). Hajj: tied to 8–13 Dhul-Hijjah, including standing at Arafah, overnight stays at Mina and Muzdalifah, and stoning the Jamarat. Whoever omits an obligation makes up for it with a sacrifice; whoever omits a pillar — his Hajj is not valid without it.',
      },
    ],
  },
  {
    id: 'occasions', title: 'أدعية المناسبات', en: 'Du‘as for Occasions', icon: 'heart',
    topics: [
      {
        id: 'wedding', title: 'دعاء الزواج والزفاف', en: 'Marriage & Wedding Du‘as',
        intro: 'يُهنَّأ المتزوّج ويُدعى له بالبركة والتوفيق:',
        introEn: 'The newlywed is congratulated and prayed for with blessing and success:',
        steps: [
          { text: 'تهنئة المتزوّج: «بارَكَ اللهُ لك، وبارَكَ عليك، وجَمَعَ بينكما في خير».', en: 'Congratulating the newlywed: "May Allah bless you, and send blessings upon you, and join you both in goodness."', note: 'رواه أبو داود والترمذي', noteEn: 'Reported by Abu Dawud & al-Tirmidhi' },
          { text: 'دعاء الزوج إذا دخل على زوجته، يضع يده على مقدّم رأسها ويقول: «اللهم إني أسألك خيرها وخير ما جبلتها عليه، وأعوذ بك من شرّها وشرّ ما جبلتها عليه».', en: 'When the husband first comes to his wife, he places his hand on the front of her head and says: "O Allah, I ask You for the good in her and the good of the nature You created her with, and I seek refuge in You from her evil and the evil of the nature You created her with."', note: 'رواه أبو داود', noteEn: 'Reported by Abu Dawud' },
          { text: 'قبل الجِماع يقول: «بسم الله، اللهم جنّبنا الشيطان، وجنّب الشيطان ما رزقتنا».', en: 'Before intimacy he says: "In the name of Allah. O Allah, keep Satan away from us, and keep Satan away from what You bestow upon us."', note: 'متفق عليه — فإن قُضي بينهما ولد لم يضرّه الشيطان', noteEn: 'Agreed upon — if a child is decreed for them, Satan will not harm it.' },
        ],
        ref: 'ويُستحبّ أن يُصلّي بزوجته ركعتين أوّل لقاء، ويدعو بالألفة والذرّية الصالحة.',
        refEn: 'It is recommended that he pray two units with his wife at their first meeting, and supplicate for harmony and righteous offspring.',
      },
    ],
  },
];
