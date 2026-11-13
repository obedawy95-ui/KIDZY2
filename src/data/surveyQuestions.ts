export interface ProposedIdeaItem {
  id: string;
  title: string;
  category: string;
  description: string;
}

export const PROPOSED_IDEAS: ProposedIdeaItem[] = [
  {
    id: 'idea_qr_card',
    title: 'بطاقة الشخصية برمز QR للأم (صندوق الفرح)',
    category: 'تسويق واحتفاظ',
    description: 'بطاقة أنيقة تحمل صورة الشخصية ورابط إلكتروني مع كود خصم خاص بالأم ومحتوى ترفيهي.'
  },
  {
    id: 'idea_wishlist',
    title: 'قائمة أمنيات الصغار التي تُرسَل للأقارب',
    category: 'مبيعات وهدايا',
    description: 'كتيب أو رابط يسجل فيه الطفل ما يحبه لمشاركته مع الخالات والأعمام بمناسبة الأعياد والنجاح.'
  },
  {
    id: 'idea_paid_extension',
    title: 'تمديد الزيارة بمقابل (5 أو 10 دقائق إضافية)',
    category: 'عمليات وإيراد',
    description: 'إتاحة خيار للموظفة بتمديد الزيارة بمرونة ودفع فوري رقمي عند طلب الأسرة.'
  },
  {
    id: 'idea_birthday_booking',
    title: 'حجز زيارة عيد ميلاد أو حفلة بعد الزيارة',
    category: 'حفلات ومناسبات',
    description: 'عرض باقة الحفلات المصغرة مباشرة عند ملاحظة قرب موعد ميلاد الطفل أو تكرار السؤال.'
  },
  {
    id: 'idea_ask_us_toy',
    title: 'بطاقة «تحقق أولًا» (اسألونا عن أي لعبة تشوفونها)',
    category: 'خدمات إضافية',
    description: 'خدمة مساعدة الأم في توفير ألعاب آمنة ومختارة يطلبها الطفل أثناء زيارة كيدزي.'
  },
  {
    id: 'idea_video_rating',
    title: 'تصوير أو تقييم بإذن الأم (وجوه تقييم، فيديو قصير)',
    category: 'جودة وتوثيق',
    description: 'توثيق انطباع سريع بابتسامة الطفل أو كلمة من الأم بموافقتها الكاملة لدعم المحتوى.'
  },
  {
    id: 'idea_loyalty_stamps',
    title: 'بطاقة ختم الزيارة (هدية بعد ثلاث زيارات)',
    category: 'ولاء العملاء',
    description: 'كرت لطيف يُختم مع كل زيارة يحصل بعده الطفل على هدية مميزة أو زيارة مجانية.'
  },
  {
    id: 'idea_thank_you_card',
    title: 'بطاقة شكر من الأم للمُهدي (العم أو الخالة…)',
    category: 'مشاركة وتجربة',
    description: 'بطاقة جاهزة تصورها الأم وترسلها للشخص الذي حجز الزيارة كهدية للطفل.'
  },
  {
    id: 'idea_farewell_sample',
    title: 'عيّنة صغيرة مع قسيمة تُعطى للأم عند الوداع',
    category: 'تجربة الوداع',
    description: 'توزيع هدايا تذكارية رمزية مثل بالون أو قناع شخصية أو قسيمة خصم للزيارة القادمة.'
  },
  {
    id: 'idea_coordinator_escort',
    title: 'وجود منسقة ترافقك لتتولى الحديث التجاري بدلًا منك',
    category: 'دعم الموظفة',
    description: 'مرافقة موظفة أخرى بلباس عادي تتولى التنسيق والتصوير والرد على استفسارات الأسرة والأسعار.'
  }
];

export interface DifficultSituationConfig {
  id: string;
  number: number | string;
  title: string;
  titleEn: string;
  contextHint?: string;
  contextHintEn?: string;
}

export const DIFFICULT_SITUATIONS: DifficultSituationConfig[] = [
  {
    id: 'sit_hospitality',
    number: 37,
    title: 'الأم أو الأسرة تدعوك للبقاء أو للضيافة أو الطعام.',
    titleEn: 'The mother or family invites you to stay for hospitality or food.',
    contextHint: 'كيف تتصرفين عند الإحراج أو الإصرار على تناول القهوة/العشاء بينما الزي لا يسمح؟',
    contextHintEn: 'How do you respond politely when offered coffee/food while wearing the mascot costume?',
  },
  {
    id: 'sit_crying_child',
    number: 38,
    title: 'الطفل يبكي ولا يقبل الشخصية.',
    titleEn: 'The child cries and refuses to approach the character.',
    contextHint: 'عندما يتفاجأ الطفل بحجم المجسم أو يصاب بالذعر في الدقيقة الأولى.',
    contextHintEn: 'When the child is startled by the costume size or panics in the first minute.',
  },
  {
    id: 'sit_pulling_costume',
    number: 39,
    title: 'الطفل يصرّ على لمس الزي أو سحبه أو أخذ شيء منه أو محاولة كشف الرأس.',
    titleEn: 'The child insists on touching, pulling, taking something from the costume, or lifting the headpiece.',
    contextHint: 'الحفاظ على سر الشخصية وسلامة الزي وتجنب انزعاج الطفل.',
    contextHintEn: 'Protecting the character illusion, costume integrity, and calming the child gently.',
  },
  {
    id: 'sit_toy_defect',
    number: 40,
    title: 'الأم تطلب تغيير اللعبة، أو تشتكي من عيب فيها، أو تطلب استرجاعها.',
    titleEn: 'The mother asks to exchange the toy, complains about a defect, or requests a refund.',
    contextHint: 'التعامل مع اعتراض الأم على الهدية أو طلب استبدالها أمام الطفل.',
    contextHintEn: 'Handling the mother’s concern about the gift in front of the child.',
  },
  {
    id: 'sit_pricing_inquiry',
    number: 41,
    title: 'الأم تسأل عن أسعار أو عروض أو منتجات أخرى.',
    titleEn: 'The mother asks about prices, offers, or other products.',
    contextHint: 'هل تحفظين الأسعار أم لديك توجيه بتحويلها إلى خدمة العملاء؟',
    contextHintEn: 'Do you know the pricing or direct her to Customer Service?',
  },
  {
    id: 'sit_party_booking',
    number: 42,
    title: 'الأم تسأل عن حفلة عيد ميلاد أو حضور الشخصية في مناسبة كبيرة.',
    titleEn: 'The mother asks about a birthday party or character attendance for a large event.',
    contextHint: 'كيفية التقاط هذه الفرصة التجارية أو ما تقولينه للأم.',
    contextHintEn: 'How to capture this opportunity and what you say to the mother.',
  },
  {
    id: 'sit_personal_contact',
    number: 43,
    title: 'الأم تطلب رقمك الشخصي أو حسابك على وسائل التواصل للتعامل معكِ مباشرة.',
    titleEn: 'The mother asks for your personal phone number or social media to book directly.',
    contextHint: 'سياسة الخصوصية والتعامل مع طلبات الحجز المباشر بعيداً عن المنصة.',
    contextHintEn: 'Privacy policy and handling off-platform booking requests.',
  },
  {
    id: 'sit_crowded_uncomfortable',
    number: 44,
    title: 'يوجد ضيوف كثر أو أشخاص غير مألوفين أو أجواء غير مريحة أو مضايقة.',
    titleEn: 'Many guests, unfamiliar people, or an uncomfortable atmosphere.',
    contextHint: 'شعور الموظفة بعدم الأمان أو ضغط التجمعات غير المتوقعة.',
    contextHintEn: 'Handling unexpected crowded gatherings comfortably and safely.',
  },
  {
    id: 'sit_unauthorized_filming',
    number: 45,
    title: 'تصوير دون إذن، أو سلوك غير لائق من أي شخص.',
    titleEn: 'Filming without permission or inappropriate behavior from someone.',
    contextHint: 'التعامل مع تصوير تفاصيل الزي أو السلوكيات المربكة.',
    contextHintEn: 'Handling intrusive filming or uncomfortable conduct.',
  },
  {
    id: 'sit_late_arrival',
    number: 46,
    title: 'وصلتِ متأخرة، وهناك زيارة أخرى بعدها بوقت قصير.',
    titleEn: 'You arrived late, and there is another visit scheduled shortly after.',
    contextHint: 'إدارة ضغط الوقت ومشاعر الأسرة المستضيفة والزيارة التالية.',
    contextHintEn: 'Managing time pressure and expectations between both families.',
  },
  {
    id: 'sit_sick_child',
    number: 47,
    title: 'الطفل مريض، أو الأسرة في ظرف خاص أو حزين.',
    titleEn: 'The child is sick, or the family is going through a delicate or sad moment.',
    contextHint: 'المرونة الإنسانية وضبط إيقاع الزيارة ليناسب حالة الطفل والأسرة.',
    contextHintEn: 'Adjusting your energy and visit tone with empathy.',
  },
  {
    id: 'sit_costume_malfunction',
    number: 48,
    title: 'خلل أو عطل في زيك أو في اللعبة أثناء الزيارة (تمزق، بطارية، تهوية).',
    titleEn: 'A costume or toy malfunction during the visit (tear, battery, ventilation).',
    contextHint: 'التصرف الطارئ لحفظ ماء الوجه وسلامة الأداء.',
    contextHintEn: 'Handling equipment issues smoothly without breaking character.',
  }
];

export interface SurveySectionConfig {
  id: number;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
}

// Published Character Staff Survey Sections (Sections 7 [Tools & Safety] and 8 [Ideas Evaluation] unpublished per instructions)
export const SURVEY_SECTIONS: SurveySectionConfig[] = [
  {
    id: 1,
    title: 'القسم 1: عنكِ',
    titleEn: 'Section 1: About You',
    subtitle: 'معلومات عامة حول تجربتك ومناطق زياراتك (الأسئلة المميزة بـ * إلزامية)',
    subtitleEn: 'General info about your experience & areas (questions with * are required)',
  },
  {
    id: 2,
    title: 'القسم 2: مجرى الزيارة',
    titleEn: 'Section 2: Visit Flow',
    subtitle: 'تفاصيل العشر دقائق: الدخول، استلام الهدية، تقسيم الوقت، والختام',
    subtitleEn: 'The 10-minute flow: arrival, gift handoff, time allocation, and farewell',
  },
  {
    id: 3,
    title: 'القسم 3: الطفل',
    titleEn: 'Section 3: The Child',
    subtitle: 'تفاعلات الطفل، مشاعره، وبقية الأطفال والهدية',
    subtitleEn: 'Child reactions, emotions, gift moments, and other children asking for gifts',
  },
  {
    id: 4,
    title: 'القسم 4: الأم والأسرة',
    titleEn: 'Section 4: Mom & Family',
    subtitle: 'حضور الأهل، مدة الزيارة، المحادثة، وتكرار الاستفسارات والأسعار',
    subtitleEn: 'Family attendance, 10-minute awareness, conversation partner, pricing, and topics',
  },
  {
    id: 5,
    title: 'القسم 5: المواقف الصعبة',
    titleEn: 'Section 5: Difficult Situations',
    subtitle: 'أهم المواقف الميدانية: كيف تتصرفين وماذا تقولين؟',
    subtitleEn: 'Key field situations: what you do and what you say',
  },
  {
    id: 6,
    title: 'القسم 6: الفرص غير المستغلة',
    titleEn: 'Section 6: Untapped Opportunities',
    subtitle: 'ما الذي يمكن تقديمه للأسرة وتطوير الخدمة الميدانية',
    subtitleEn: 'Services we can offer families and ways to elevate field value',
  },
  {
    id: 7,
    title: 'القسم 7: أسئلة مفتوحة',
    titleEn: 'Section 7: Open Questions',
    subtitle: 'رسالتك للإدارة، وتجاربك الأجمل والأصعب',
    subtitleEn: 'Your message to leadership and your best & hardest visit moments',
  },
];
