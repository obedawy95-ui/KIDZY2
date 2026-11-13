import { 
  TimeAllocation, 
  PostVisitLog, 
  ProposedIdeaRating, 
  StaffSurveyResponse,
  DriverSurveyResponse, 
  CustomerServiceSurveyResponse, 
  OperationsSurveyResponse,
  SurveyTypeKey 
} from '../types/survey';

export interface TimeAllocationResult {
  total: number;
  target: number;
  difference: number;
  isOver: boolean;
  isUnder: boolean;
  isExact: boolean;
  statusLabel: string;
}

export function calculateTimeAllocation(allocation: TimeAllocation): TimeAllocationResult {
  const entrance = Number(allocation.entrance) || 0;
  const gift = Number(allocation.gift) || 0;
  const play = Number(allocation.play) || 0;
  const photos = Number(allocation.photos) || 0;
  const farewell = Number(allocation.farewell) || 0;

  const total = entrance + gift + play + photos + farewell;
  const target = 10;
  const difference = total - target;

  let statusLabel = 'متطابق تمامًا (10 دقائق)';
  if (total > target) {
    statusLabel = `يتجاوز الوقت المحدد بـ ${difference} دقيقة`;
  } else if (total < target) {
    statusLabel = `أقل من الوقت المحدد بـ ${Math.abs(difference)} دقيقة`;
  }

  return {
    total,
    target,
    difference,
    isOver: total > target,
    isUnder: total < target,
    isExact: total === target,
    statusLabel,
  };
}

export interface PostVisitAggregates {
  totalLogs: number;
  averageDurationMinutes: number;
  overtimeRequestRatePercent: number;
  averageAtmosphereRating: number;
  topOpportunities: { label: string; count: number; percent: number }[];
  ageBreakdown: Record<string, number>;
}

export function aggregatePostVisitLogs(logs: PostVisitLog[]): PostVisitAggregates {
  if (!logs || logs.length === 0) {
    return {
      totalLogs: 0,
      averageDurationMinutes: 0,
      overtimeRequestRatePercent: 0,
      averageAtmosphereRating: 0,
      topOpportunities: [],
      ageBreakdown: {},
    };
  }

  const totalLogs = logs.length;
  const totalMinutes = logs.reduce((sum, item) => sum + (Number(item.actualDurationMinutes) || 0), 0);
  const overtimeCount = logs.filter((item) => item.requestedExtraTime).length;
  const totalRating = logs.reduce((sum, item) => sum + (Number(item.atmosphereRating) || 0), 0);

  const oppCounts: Record<string, number> = {};
  const ageCounts: Record<string, number> = {};

  for (const log of logs) {
    if (log.childAgeGroup) {
      ageCounts[log.childAgeGroup] = (ageCounts[log.childAgeGroup] || 0) + 1;
    }
    if (Array.isArray(log.missedOpportunities)) {
      for (const opp of log.missedOpportunities) {
        if (opp && opp !== 'لا شيء') {
          oppCounts[opp] = (oppCounts[opp] || 0) + 1;
        }
      }
    }
  }

  const topOpportunities = Object.entries(oppCounts)
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / totalLogs) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalLogs,
    averageDurationMinutes: Math.round((totalMinutes / totalLogs) * 10) / 10,
    overtimeRequestRatePercent: Math.round((overtimeCount / totalLogs) * 100),
    averageAtmosphereRating: Math.round((totalRating / totalLogs) * 10) / 10,
    topOpportunities,
    ageBreakdown: ageCounts,
  };
}

export interface PricingSentimentStats {
  veryExpensive: number;
  expensive: number;
  reasonable: number;
  noComments: number;
  total: number;
  dominant: string;
  percentages: {
    'غالية جدا': number;
    'غالية': number;
    'معقولة': number;
    'لا توجد تعليقات': number;
  };
  breakdown: {
    'غالية جدا': number;
    'غالية': number;
    'معقولة': number;
    'لا توجد تعليقات': number;
  };
}

export function calculatePricingSentiment(
  itemsOrFirstList: any,
  ...otherLists: any[]
): PricingSentimentStats {
  let allItems: (string | undefined)[] = [];

  if (Array.isArray(itemsOrFirstList)) {
    if (itemsOrFirstList.length > 0 && typeof itemsOrFirstList[0] === 'object' && itemsOrFirstList[0] !== null) {
      // Passed survey objects like staffSurveys
      allItems.push(...itemsOrFirstList.map((s: any) => s.pricingSentiment || s.pricingCommentsHeard || s.pricingCommentsReceived || s.pricingFeedback));
      for (const list of otherLists) {
        if (Array.isArray(list)) {
          allItems.push(...list.map((s: any) => s.pricingSentiment || s.pricingCommentsHeard || s.pricingCommentsReceived || s.pricingFeedback));
        }
      }
    } else {
      allItems = [...itemsOrFirstList];
      for (const list of otherLists) {
        if (Array.isArray(list)) {
          allItems.push(...list);
        }
      }
    }
  }

  const stats = {
    veryExpensive: 0,
    expensive: 0,
    reasonable: 0,
    noComments: 0,
    total: 0,
  };

  for (const item of allItems) {
    if (!item) continue;
    stats.total++;
    const str = String(item).trim();
    if (str.includes('غالية جدا') || str.includes('غالية جدًا')) stats.veryExpensive++;
    else if (str.includes('غالية')) stats.expensive++;
    else if (str.includes('معقولة') || str.includes('مناسبة')) stats.reasonable++;
    else stats.noComments++;
  }

  if (stats.total === 0) {
    return {
      ...stats,
      dominant: 'لا توجد بيانات',
      percentages: {
        'غالية جدا': 0,
        'غالية': 0,
        'معقولة': 0,
        'لا توجد تعليقات': 0,
      },
      breakdown: {
        'غالية جدا': 0,
        'غالية': 0,
        'معقولة': 0,
        'لا توجد تعليقات': 0,
      },
    };
  }

  const total = stats.total;
  const pctVeryExpensive = Math.round((stats.veryExpensive / total) * 100);
  const pctExpensive = Math.round((stats.expensive / total) * 100);
  const pctReasonable = Math.round((stats.reasonable / total) * 100);
  const pctNoComments = Math.max(0, 100 - (pctVeryExpensive + pctExpensive + pctReasonable));

  let dominant = 'معقولة ومناسبة';
  if (stats.noComments > stats.reasonable && stats.noComments > stats.expensive && stats.noComments > stats.veryExpensive) {
    dominant = 'لا توجد تعليقات';
  } else if (stats.veryExpensive > stats.reasonable && stats.veryExpensive > stats.expensive) {
    dominant = 'غالية جداً';
  } else if (stats.expensive > stats.reasonable) {
    dominant = 'غالية نسبياً';
  }

  return {
    ...stats,
    dominant,
    percentages: {
      'غالية جدا': pctVeryExpensive,
      'غالية': pctExpensive,
      'معقولة': pctReasonable,
      'لا توجد تعليقات': pctNoComments,
    },
    breakdown: {
      'غالية جدا': stats.veryExpensive,
      'غالية': stats.expensive,
      'معقولة': stats.reasonable,
      'لا توجد تعليقات': stats.noComments,
    },
  };
}

export interface IdeaRankedResult {
  ideaId: string;
  title: string;
  averageScore: number;
  responsesCount: number;
  feasibilityYesCount: number;
  feasibilityConditionalCount: number;
  feasibilityNoCount: number;
  feasibilityScorePercent: number;
}

export function aggregateIdeasRatings(ratingsList: ProposedIdeaRating[][]): IdeaRankedResult[] {
  const map: Record<string, {
    title: string;
    totalScore: number;
    count: number;
    yes: number;
    cond: number;
    no: number;
  }> = {};

  for (const list of ratingsList) {
    for (const item of list) {
      if (!map[item.ideaId]) {
        map[item.ideaId] = {
          title: item.title,
          totalScore: 0,
          count: 0,
          yes: 0,
          cond: 0,
          no: 0,
        };
      }
      if (item.score > 0) {
        map[item.ideaId].totalScore += item.score;
        map[item.ideaId].count += 1;
      }
      if (item.feasibility === 'نعم') map[item.ideaId].yes += 1;
      else if (item.feasibility === 'بشروط') map[item.ideaId].cond += 1;
      else if (item.feasibility === 'لا') map[item.ideaId].no += 1;
    }
  }

  return Object.entries(map).map(([ideaId, val]) => {
    const averageScore = val.count > 0 ? Math.round((val.totalScore / val.count) * 10) / 10 : 0;
    const totalFeas = val.yes + val.cond + val.no;
    const feasibilityScorePercent = totalFeas > 0
      ? Math.round(((val.yes * 100 + val.cond * 50) / (totalFeas * 100)) * 100)
      : 0;

    return {
      ideaId,
      title: val.title,
      averageScore,
      responsesCount: val.count,
      feasibilityYesCount: val.yes,
      feasibilityConditionalCount: val.cond,
      feasibilityNoCount: val.no,
      feasibilityScorePercent,
    };
  }).sort((a, b) => b.averageScore - a.averageScore);
}

export interface ShareUrlOptions {
  guest?: boolean;
  standalone?: boolean;
}

export function getSurveyShareUrl(
  surveyKey: SurveyTypeKey,
  origin?: string,
  options?: ShareUrlOptions
): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://kidzy.app');
  const standalone = options?.standalone !== false;
  const params = new URLSearchParams();
  params.set('survey', surveyKey);
  if (standalone) {
    params.set('mode', 'standalone');
  }
  if (options?.guest) {
    params.set('guest', '1');
  }
  return `${base}/?${params.toString()}`;
}

export function getGuestHubShareUrl(origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://kidzy.app');
  return `${base}/?guest=1`;
}

export function getGuestResponsesShareUrl(origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://kidzy.app');
  return `${base}/?tab=analytics&guest=1`;
}

export interface ScriptGeneratorOptions {
  companyName: string;
  fixSetCollectEmail: boolean;
  visitDurationMinutes: number;
  allowVoiceResponseNote: boolean;
}

export function generateGoogleAppsScript(options: ScriptGeneratorOptions): string {
  const company = options.companyName || 'kidzy kpi,s';
  const duration = options.visitDurationMinutes || 10;
  
  const emailLine = options.fixSetCollectEmail
    ? `  // form.setCollectEmail(false); // تم تعطيله لتفادي خطأ TypeError: form.setCollectEmail is not a function في Google Workspace الجديد`
    : `  form.setCollectEmail(false);          // anonymous: do not collect emails`;

  const voiceNoteText = options.allowVoiceResponseNote
    ? `• المدة 20–25 دقيقة. من تفضّل الإجابة صوتيًا عبر واتساب فهذا مقبول ومتاح.`
    : `• المدة 20–25 دقيقة. يُرجى الإجابة بدقة في النموذج.`;

  return `/**
 * ${company} – حزمة استبيانات ونماذج الميدان والتشغيل الكاملة (Google Apps Script)
 * ملف ينشئ 6 نماذج Google Forms متكاملة بنقرة واحدة لخدمة ${company}:
 * 1) createStaffForm (استبيان موظفات الشخصيات الكرتونية — 7 أقسام محدثة)
 * 2) createPostVisitLog (مذكرة ما بعد الزيارة السريعة - 30 ثانية)
 * 3) createMothersSurvey (استبيان الأمهات ورضا العملاء)
 * 4) createDriversForm (استبيان السائقين وتوصيل الطلبات بدون شخصيات)
 * 5) createCustomerServiceForm (استبيان قسم خدمة العملاء)
 * 6) createOperationsForm (استبيان العمليات والتشغيل واللوجستيات)
 *
 * طريقة الاستخدام:
 * 1) افتحوا https://script.google.com ثم اضغطوا «مشروع جديد».
 * 2) احذفوا الكود القديم والصقوا هذا الكود كاملًا، ثم اضغطوا حفظ (Ctrl+S).
 * 3) اختاروا الدالة المطلوبة واضغطوا «تشغيل» (Run) ووافقوا على الأذونات مرة واحدة.
 * 4) الروابط ستظهر فورًا في «سجل التنفيذ» (Execution log).
 */

var NUM_HELP = "اكتبي رقمًا بين ";

// ==================== 1. استبيان موظفات الشخصيات (7 أقسام محدثة) ====================
function createStaffForm() {
  var form = newForm_("استبيان موظفات الشخصيات – ${company}", "هدفنا أن نفهم ما يدور فعلًا في الـ ${duration} دقائق لنساعدكنّ ونحسّن الخدمة. ليس هذا تقييمًا لأدائكنّ.\\n\\n• لا توجد إجابة صحيحة أو خاطئة. نريد تجربتكنّ الحقيقية بصراحة.\\n• الاستبيان سري، والاسم غير مطلوب. لا تذكرن أسماء العملاء ولا عناوينهم ولا صور الأطفال.\\n${voiceNoteText}\\n• تُحلَّل الإجابات مجمّعة، ولا تُستخدم ضد أي موظفة.\\n• أي موقف يتعلق بسلامتكنّ أو سلامة طفل يُبلَّغ عنه فورًا للمشرفة ولا ينتظر نتائج الاستبيان.", "شكرًا لكِ. رأيكِ يصنع فرقًا حقيقيًا في تحسين الخدمة.");
  
  addMc_(form, "موافقة على المشاركة", ["قرأتُ التعليمات أعلاه وأوافق على المشاركة طوعًا"], false, true, null);
  
  addSection_(form, "القسم 1: عنكِ (اختياري)", null);
  addMc_(form, "1. مدة عملك في الخدمة", ["أقل من 3 أشهر", "3–6 أشهر", "6–12 شهرًا", "أكثر من سنة"], false, false, null);
  addNum_(form, "2. متوسط زياراتك في اليوم", 0, 30, false, "اكتبي رقمًا");
  addMc_(form, "3. الفئة العمرية الأغلب لدى الأطفال الذين تزورينهم", ["أقل من 3", "3–5", "6–9", "10 فأكثر"], false, false, null);
  addText_(form, "4. المناطق الأكثر زيارة", false, null);
  addMc_(form, "5. نوع المنزل غالبًا", ["فيلا كبيرة", "فيلا داخل مجمع", "شقة", "فندق"], false, false, null);
  addMc_(form, "6. من يفتح لكِ الباب غالبًا؟", ["الأم", "الخادمة", "الحارس", "أحد أفراد الأسرة"], false, false, null);
  
  addSection_(form, "القسم 2: مجرى الزيارة", null);
  addPara_(form, "7. صفي أول دقيقة بعد دخولك: ماذا يحدث؟ ماذا ترين وتسمعين؟", false, null);
  addMc_(form, "كيف يستقبلك الأهل عادة؟", ["بترحاب كبير ومكان مجهز", "باستعداد بسيط", "بانشغال أو استعجال", "بتردد أو توتر"], false, false, null);
  addMc_(form, "8. من الذي يستلم منكِ الهدية في العادة؟", ["الأم", "الطفل", "الخادمة", "آخرون"], false, false, null);
  addMc_(form, "هل تشاهدين هدايا أو ألعابًا من شركات أخرى قُدمت للطفل؟", ["نعم دائمًا", "أحيانًا", "لا أذكر"], false, false, null);
  addHeader_(form, "9. كيف توزعين الـ ${duration} دقائق عادةً؟", "اكتبي الدقائق التقريبية لكل مرحلة (رقم من 0 إلى ${duration})");
  addNum_(form, "دخول (دقائق)", 0, ${duration}, false, null);
  addNum_(form, "فتح الهدية (دقائق)", 0, ${duration}, false, null);
  addNum_(form, "لعب (دقائق)", 0, ${duration}, false, null);
  addNum_(form, "صور (دقائق)", 0, ${duration}, false, null);
  addNum_(form, "وداع (دقائق)", 0, ${duration}, false, null);
  addScale_(form, "10. هل الـ ${duration} دقائق كافية؟", 1, 5, "غير كافية", "كافية جدًا", false, null);
  addPara_(form, "10-ب. لماذا؟", false, null);
  addNum_(form, "11. في كم من كل 10 زيارات يتجاوز الوقت الـ ${duration} دقائق؟", 0, 10, false, null);
  addNum_(form, "11-ب. بكم دقيقة تقريبًا يتجاوز الوقت عادةً؟", 0, 60, false, null);
  addNum_(form, "كم من كل 10 زيارات يتم فيها تصوير الشخصية مع الأطفال؟", 0, 10, false, null);
  addNum_(form, "كم من كل 10 زيارات تصلين فيها متأخرة عن الموعد؟", 0, 10, false, null);
  addPara_(form, "وبماذا تبررين التأخير للعميل عادةً؟", false, "مثال: زحمة السير، خطأ موقع، تأخر الزيارة السابقة...");
  addPara_(form, "12. ماذا يحدث في آخر دقيقتين؟ كيف تنتهي الزيارة غالبًا؟", false, null);
  
  addSection_(form, "القسم 3: الطفل", null);
  addHeader_(form, "15. من كل 10 زيارات، كم مرة يكون رد فعل الطفل عند دخولك:", "اكتبي رقمًا من 0 إلى 10 لكل رد فعل");
  addNum_(form, "فرح مباشر", 0, 10, false, null);
  addNum_(form, "خجل أو ترقب", 0, 10, false, null);
  addNum_(form, "خوف أو بكاء", 0, 10, false, null);
  addNum_(form, "تعلّق شديد", 0, 10, false, null);
  addPara_(form, "16. كيف تتعاملين مع الطفل الخائف أو الخجول؟", false, null);
  addMc_(form, "17. ماذا يفعل الطفل أول ما يفتح الهدية؟", ["يلعب بها فورًا", "ينظر إليك ويطلب منك أن تلعبي", "يطلب مساعدة أمه", "يتركها ويلعب معك"], false, false, null);
  addPara_(form, "18. هل يسأل الأطفال عن أشياء أخرى؟ ما أكثر ما يطلبونه؟", false, null);
  addNum_(form, "كم من كل 10 زيارات سألكِ بقية الأطفال عن هدايا لهم؟", 0, 10, false, null);
  addPara_(form, "وبماذا تجيبين غالبًا على بقية الأطفال؟", false, null);
  addPara_(form, "20. هل يتعلق الطفل بالشخصية ويرفض أن تغادري؟ كيف تتصرفين؟", false, null);
  
  addSection_(form, "القسم 4: الأم والأسرة والأسعار والتطبيق", null);
  addCb_(form, "22. من يحضر عادةً؟ (يمكن اختيار أكثر من إجابة)", ["الأم", "الأب", "الجدة", "إخوة", "أقارب", "مربية أو خادمة", "ضيوف"], true, false, null);
  addPara_(form, "23. ماذا تفعل الأم أثناء الزيارة؟", false, null);
  addMc_(form, "أثناء الزيارة، من الذي يتبادل معكِ الحديث أكثر؟", ["الأم", "الطفل", "الأم والطفل", "ضيوف آخرون"], false, false, null);
  addPara_(form, "24. اكتبي ثلاثة أسئلة تسألها الأمهات أكثر من غيرها", false, null);
  addGrid_(form, "25. كم مرة تسأل الأمهات عن كل موضوع من كل 10 زيارات؟", ["الأسعار", "شخصيات أخرى", "كيدزي ميديا (إنستا / سناب)", "التطبيق أو الموقع", "خدمة العملاء"], ["لا يحدث", "1–3 مرات", "4–6 مرات", "7–10 مرات"], false, null);
  addMc_(form, "هل تعلم الأمهات أن وقت الزيارة 10 دقائق؟", ["نعم", "لا"], false, false, null);
  addPara_(form, "إذا كانت الإجابة لا، صفي ردة فعلها", false, null);
  addNum_(form, "كم من كل 10 زيارات سألكِ أولياء الأمور عن توفر ألعاب إضافية في السيارة؟", 0, 10, false, null);
  addMc_(form, "26. ما هي التعليقات التي تسمعينها غالبًا عن الأسعار؟", ["غالية جدا", "غالية", "معقولة", "لا توجد تعليقات"], false, false, null);
  addMc_(form, "ما هي تعليقات العملاء عن خدمة العملاء؟", ["تأخر في الرد", "عدم الاستجابة", "استجابة ممتازة وسريعة", "أخرى"], true, false, null);
  addPara_(form, "سؤال عن شكوى أو انزعاج من العملاء بخصوص التطبيق أو الموقع: عن ماذا يشتكون بالضبط؟", false, "مثال: صعوبة الحجز، خطأ اللوكيشن، مشاكل الدفع...");
  addMc_(form, "27. متى تكون الأم أكثر انفتاحًا لاقتراح جديد؟", ["قبل اللعب", "أثناء اللعب", "عند الوداع", "لا أعرف"], false, false, null);
  
  addSection_(form, "القسم 5: المواقف الصعبة", "لكل موقف أجيبي عن سؤالين: (أ) ما الذي تفعلينه؟ (ب) ماذا تقولين بالنص تقريبًا؟");
  addHeader_(form, "الموقف 1: الأم تطلب مزيدًا من الوقت", null);
  addNum_(form, "31. كم مرة يحدث هذا من كل 10 زيارات؟", 0, 10, false, null);
  addNum_(form, "32. كم دقيقة تطلب الأم عادةً؟", 0, 120, false, null);
  addMc_(form, "33. ما الذي تفعلينه عادةً؟", ["أوافق فورًا دون مقابل", "أوافق بعد إذن المشرفة", "أعرض تمديدًا مدفوعًا", "أقترح موعدًا آخر لزيارة أطول", "أعتذر بسبب موعد الزيارة التالية"], true, false, null);
  addPara_(form, "36. ما الذي تتمنين أن تقوله الإدارة لكِ في هذا الموقف؟", false, null);
  
  var hardSituations = [
    "37. الأم أو الأسرة تدعوك للبقاء أو للضيافة أو الطعام.",
    "38. الطفل يبكي ولا يقبل الشخصية.",
    "39. الطفل يصرّ على لمس الزي أو سحبه أو أخذ شيء منه أو محاولة كشف الرأس.",
    "40. الأم تطلب تغيير اللعبة، أو تشتكي من عيب فيها، أو تطلب استرجاعها."
  ];
  for (var i = 0; i < hardSituations.length; i++) {
    addHeader_(form, hardSituations[i], null);
    addPara_(form, "(أ) ما الذي تفعلينه عادةً؟", false, null);
    addPara_(form, "(ب) ما الذي تقولينه بالنص تقريبًا؟", false, null);
  }
  addPara_(form, "49. أي موقف آخر صعب مررتِ به ولم نذكره، وكيف تصرفتِ؟", false, null);
  
  addSection_(form, "القسم 6: الفرص غير المستغلة", null);
  addPara_(form, "50. ما الأشياء التي تقولها الأمهات أو الأطفال وتشعرين أننا لا نستفيد منها؟", false, null);
  addCb_(form, "51. ما الذي يمكن أن نقدمه للأسرة ولا نقدمه الآن؟", ["زيارة أطول", "ألعاب إضافية في السيارة للشراء المباشر لبقية الأطفال", "بطاقة أو ذكرى تبقى في المنزل"], false, false, null);
  addPara_(form, "54. ما الذي يمنعكِ من اقتراح أي شيء على الأم؟", false, null);
  addPara_(form, "55. ما الرسالة الواحدة التي تتمنين أن تصل إلى الأم عن كيدزي؟", false, null);

  addSection_(form, "القسم 7: أسئلة مفتوحة", null);
  addPara_(form, "أجمل زيارة مررتِ بها، وماذا جعلها كذلك؟", false, null);
  addPara_(form, "أصعب زيارة مررتِ بها، وماذا تعلمتِ منها؟", false, null);
  addPara_(form, "ما الذي يجب أن يعرفه المسؤولون عن هذه الخدمة ولا يعرفونه؟", false, null);
  addText_(form, "لو كان القرار بيدكِ، ما أول شيء تغيّرينه في الزيارة؟", false, null);
  addPara_(form, "هل هناك شيء آخر تودين قوله؟", false, null);
  logUrls_(form);
}

// ==================== 2. مذكرة ما بعد الزيارة (30 ثانية) ====================
function createPostVisitLog() {
  var form = newForm_("مذكرة ما بعد الزيارة – ${company} (30 ثانية)", "تُملأ بعد كل زيارة مباشرة لالتقاط التفاصيل الميدانية السريعة. لا تذكري أسماء العملاء أو عناوينهم.", "تم الإرسال. شكرًا لكِ.");
  addMc_(form, "الفئة العمرية للطفل", ["أقل من 3", "3–5", "6–9", "10 فأكثر"], false, true, null);
  addNum_(form, "المدة الفعلية للزيارة بالدقائق", 1, 90, true, null);
  addMc_(form, "هل طُلب وقت إضافي؟", ["لا", "نعم"], false, true, null);
  addPara_(form, "إن كانت الإجابة نعم: ماذا حدث؟", false, null);
  addPara_(form, "أبرز سؤال سألته الأم", false, null);
  addMc_(form, "ما هو تعليق الأم على الأسعار إن تم ذكره؟", ["غالية جدا", "غالية", "معقولة", "لا توجد تعليقات"], false, false, null);
  addCb_(form, "فرصة لم نستفد منها", ["سؤال عن سعر", "سؤال عن حفلة", "اهتمام ظاهر للطفل", "أخ أو أخت", "مناسبة قادمة", "لا شيء"], true, false, null);
  addScale_(form, "أجواء الزيارة", 1, 5, "سيئة", "ممتازة", true, null);
  logUrls_(form);
}

// ==================== 3. استبيان الأمهات ====================
function createMothersSurvey() {
  var form = newForm_("رأيكِ في زيارة ${company} (5 أسئلة)", "شكرًا لاستقبالنا في بيتكم. هذا الاستبيان القصير لا يطلب أي بيانات عن طفلكم، وهو وسيلتنا لنسمع منكِ كيف نجعل التجربة أفضل.", "شكرًا لكِ. رأيكِ يساعدنا على تحسين الزيارة.");
  addScale_(form, "1. كيف كانت تجربة الزيارة؟", 1, 5, "سيئة", "ممتازة", true, null);
  addMc_(form, "2. هل كانت الـ ${duration} دقائق كافية؟", ["نعم، كافية", "أحتاج وقتًا أكثر", "كانت أطول من اللازم"], false, false, null);
  addMc_(form, "3. ما رأيكِ في أسعار باقات ${company}؟", ["غالية جدا", "غالية", "معقولة ومناسبة", "لا توجد لدي فكرة"], false, false, null);
  addMc_(form, "4. كيف تقيّمين سهولة الحجز عبر التطبيق أو الموقع الإلكتروني؟", ["سهل وسلس جدًا", "مقبول", "واجهت صعوبة أو بطء", "حجزت عبر الواتساب مباشرة"], false, false, null);
  addPara_(form, "4-ب. إن واجهتِ أي صعوبة في التطبيق، عن ماذا كانت الشكوى بالضبط؟", false, null);
  addMc_(form, "5. ما هو تقييمك لسرعة وتجاوب خدمة العملاء؟", ["ممتازة وسريعة", "تأخر في الرد", "عدم استجابة", "لم أتواصل معهم"], false, false, null);
  addPara_(form, "6. ما الذي كنتِ تتمنين أن تجديه في الزيارة ولم تجديه؟", false, null);
  addMc_(form, "7. هل ترغبين في استلام أفكار هدايا وعروض من ${company} على واتساب؟", ["نعم", "لا"], false, false, "اختيار «نعم» هو موافقتكِ على الاشتراك.");
  addText_(form, "إن اخترتِ «نعم»: رقم واتساب الخاص بكِ", false, "لن نستخدمه إلا لهذا الغرض.");
  logUrls_(form);
}

// ==================== 4. استبيان السائقين والتوصيل المباشر ====================
function createDriversForm() {
  var form = newForm_("استبيان السائقين والتوصيل – ${company}", "مخصص لطلبات التوصيل التي ينفذها السائقون فقط بدون مرافقة شخصيات كرتونية (هدايا، بالونات، كيك، صناديق مفاجآت).", "تم حفظ استبيان السائق. شكرًا لجهودك.");
  addText_(form, "رمز السائق أو الاسم (اختياري)", false, null);
  addMc_(form, "1. مدة عملك في توصيل طلبات ${company}", ["أقل من 3 أشهر", "3–6 أشهر", "6–12 شهرًا", "أكثر من سنة"], false, true, null);
  addNum_(form, "2. متوسط عدد طلبات التوصيل اليومية", 0, 40, true, "اكتب رقمًا");
  addCb_(form, "3. ما نوع الطلبات التي توصلها غالبًا بدون شخصيات؟", ["هدايا وصناديق مفاجآت", "بالونات وتوزيعات", "كيك وحلويات", "ألعاب فقط", "باقات مشتركة"], true, false, null);
  addNum_(form, "4. من كل 10 طلبات، كم مرة تصل متأخرًا عن الموعد المحدد؟", 0, 10, true, null);
  addPara_(form, "5. بماذا تبرر التأخير للعميل عند الوصول؟ وما السبب الرئيسي؟", false, "مثال: زحام الطرق، تأخر استلام الطلب، خطأ في لوكيشن الخريطة بالتطبيق...");
  addMc_(form, "6. من يفتح لك الباب ويستلم الطلب غالبًا؟", ["الأم", "الأب", "الخادمة", "الحارس", "الطفل نفسه"], false, false, null);
  addMc_(form, "7. هل يطلب العميل دخولك للمنزل لتجهيز أو ترتيب الهدية؟", ["نعم دائمًا", "أحيانًا", "نادرًا أو لا يحدث"], false, false, null);
  addNum_(form, "8. من كل 10 طلبات، كم مرة يتم تصوير الاستلام أو يطلب منك تصوير الطفل؟", 0, 10, false, null);
  addMc_(form, "9. ما هي الأسعار التي تسمعها أو تعليقات العملاء عن قيمة التوصيل أو الباقات؟", ["غالية جدا", "غالية", "معقولة", "لا توجد تعليقات"], false, false, null);
  addPara_(form, "10. ما هي شكاوى العملاء بخصوص التطبيق أو الخريطة أو التتبع؟", false, "مثال: العنوان غير دقيق، عدم تحديث موقع السائق...");
  addMc_(form, "11. ما هي تعليقات العملاء عن خدمة العملاء التي ينقلونها لك؟", ["تأخر في الرد", "عدم الاستجابة", "خدمة جيدة", "أخرى"], true, false, null);
  addPara_(form, "12. ما أكبر عائق تواجهه في التوصيل وما اقتراحك لتسهيل المسارات؟", false, null);
  logUrls_(form);
}

// ==================== 5. استبيان قسم خدمة العملاء ====================
function createCustomerServiceForm() {
  var form = newForm_("استبيان قسم خدمة العملاء – ${company}", "يهدف لتحليل تجربة التواصل مع الأمهات والعملاء وحصر الشكاوى والفرص البيعية.", "تم إرسال رد خدمة العملاء بنجاح.");
  addText_(form, "رمز ممثلة الخدمة (اختياري)", false, null);
  addNum_(form, "1. متوسط المحادثات أو الاتصالات التي تستقبلينها يوميًا", 0, 200, true, "اكتبي رقمًا");
  addMc_(form, "2. ما هي تعليقات العملاء الأكثر تكرارًا عن الأسعار؟", ["غالية جدا", "غالية", "معقولة", "لا توجد تعليقات"], false, true, null);
  addCb_(form, "3. ما هي أكثر تعليقات أو شكاوى العملاء عن خدمة العملاء؟", ["تأخر في الرد في أوقات الذروة", "عدم الاستجابة السريعة", "عدم وضوح تفاصيل الحجز", "صعوبة تعديل الموعد", "لا توجد شكاوى"], true, false, null);
  addPara_(form, "3-ب. إن كانت هناك شكاوى أخرى عن خدمة العملاء، اذكريها بالتفصيل", false, null);
  addPara_(form, "4. سؤال عن شكوى أو انزعاج من العملاء بخصوص التطبيق أو الموقع: عن ماذا يشتكون بالضبط؟", false, "اذكري بالتفصيل: واجهة الحجز، خطأ تحديد الموقع، بوابات الدفع...");
  addNum_(form, "5. من كل 10 عملاء، كم عميل يسأل عن خدمات إضافية لا نوفرها حاليًا؟", 0, 10, false, null);
  addCb_(form, "6. ما هي أكثر الخدمات المطلوبة التي لا نقدمها؟", ["كيك مخصص وحلويات", "تنظيم كامل للحفلة", "باقة تصوير احترافي", "توصيل سريع في نفس اليوم", "زيارات متكررة باشتراك"], true, false, null);
  addPara_(form, "7. ما هي أكثر أسباب طلب الإلغاء أو تعديل الحجز؟", false, null);
  addPara_(form, "8. ما هي الأدوات أو الصلاحيات التي تنقصكِ لحل مشاكل العملاء فورًا؟", false, null);
  logUrls_(form);
}

// ==================== 6. استبيان العمليات والتشغيل ====================
function createOperationsForm() {
  var form = newForm_("استبيان العمليات والتشغيل الميداني – ${company}", "يهدف لحصر اختناقات الجدولة، التوصيل، والتنسيق بين الميدان وخدمة العملاء.", "تم إرسال نموذج العمليات.");
  addText_(form, "رمز مشرف/منسق العمليات (اختياري)", false, null);
  addNum_(form, "1. متوسط عدد الزيارات والطلبات المجدولة في نوبتك", 0, 100, true, null);
  addNum_(form, "2. من كل 10 زيارات، كم مرة يتأخر السائق أو الموظفة عن الموعد؟", 0, 10, true, null);
  addPara_(form, "3. بماذا يتم تبرير التأخير للعميل في تقارير العمليات؟ وما هو السبب الأكثر شيوعًا؟", false, "مثال: بعد المسافات بين الأحياء، تأخر تجهيز المجسم، أخطاء العناوين...");
  addMc_(form, "4. انطباع مسؤولي التشغيل عن أسعار الخدمة مقارنة بالتكاليف التشغيلية", ["غالية جدا", "غالية", "معقولة ومتوازنة", "منخفضة وتحتاج زيادة"], false, false, null);
  addPara_(form, "5. ما هي أبرز المشاكل التقنية في التطبيق أو نظام الإسناد والخرائط؟", false, null);
  addCb_(form, "6. ما هي أكبر الاختناقات التشغيلية في الميدان؟", ["المسافات الطويلة بين الأحياء في نفس النوبة", "تأخر تجهيز الهدايا أو الكيك", "صيانة وتنظيف أزياء الشخصيات", "تعديل العملاء لمواعيدهم في اللحظة الأخيرة", "صعوبة التواصل مع السائق أثناء القيادة"], true, false, null);
  addPara_(form, "7. كيف تقيّمين التنسيق الحالي بين خدمة العملاء ومشرفي الميدان؟", false, null);
  addPara_(form, "8. مقترحاتك لرفع كفاءة التوصيل وتقليل التأخير في عطلات نهاية الأسبوع", false, null);
  logUrls_(form);
}

// ==================== دوال مساعدة عامة ====================
function addHeader_(form, title, help) {
  var h = form.addSectionHeaderItem().setTitle(title);
  if (help) h.setHelpText(help);
}
function addSection_(form, title, help) {
  var p = form.addPageBreakItem().setTitle(title);
  if (help) p.setHelpText(help);
}
function addText_(form, title, req, help) {
  var it = form.addTextItem().setTitle(title).setRequired(!!req);
  if (help) it.setHelpText(help);
}
function addNum_(form, title, lo, hi, req, help) {
  var it = form.addTextItem().setTitle(title).setRequired(!!req);
  if (help) it.setHelpText(help);
  var v = FormApp.createTextValidation()
    .setHelpText(NUM_HELP + lo + ' - ' + hi)
    .requireNumberBetween(lo, hi)
    .build();
  it.setValidation(v);
}
function addPara_(form, title, req, help) {
  var it = form.addParagraphTextItem().setTitle(title).setRequired(!!req);
  if (help) it.setHelpText(help);
}
function addMc_(form, title, choices, other, req, help) {
  var it = form.addMultipleChoiceItem().setTitle(title).setRequired(!!req);
  if (help) it.setHelpText(help);
  var cs = [];
  for (var i = 0; i < choices.length; i++) cs.push(it.createChoice(choices[i]));
  it.setChoices(cs);
  if (other) it.showOtherOption(true);
}
function addCb_(form, title, choices, other, req, help) {
  var it = form.addCheckboxItem().setTitle(title).setRequired(!!req);
  if (help) it.setHelpText(help);
  var cs = [];
  for (var i = 0; i < choices.length; i++) cs.push(it.createChoice(choices[i]));
  it.setChoices(cs);
  if (other) it.showOtherOption(true);
}
function addScale_(form, title, lo, hi, loLabel, hiLabel, req, help) {
  var it = form.addScaleItem().setTitle(title).setBounds(lo, hi).setLabels(loLabel, hiLabel).setRequired(!!req);
  if (help) it.setHelpText(help);
}
function addGrid_(form, title, rows, cols, req, help) {
  var it = form.addGridItem().setTitle(title).setRows(rows).setColumns(cols).setRequired(!!req);
  if (help) it.setHelpText(help);
}
function newForm_(title, desc, confirm) {
  var form = FormApp.create(title);
  form.setDescription(desc);
  form.setConfirmationMessage(confirm);
${emailLine}
  try {
    if (typeof form.setRequireLogin === 'function') {
      form.setRequireLogin(false); // allow guest responses without email/password login
    }
  } catch (e) {}
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(true);
  return form;
}
function logUrls_(form) {
  Logger.log('EDIT LINK (للمشرفين):      ' + form.getEditUrl());
  Logger.log('SHARE LINK (للمشاركين):    ' + form.getPublishedUrl());
}
`;
}

export const STAFF_TOTAL_QUESTIONS_COUNT = 55;

export type StaffRequiredQuestionKey =
  | 'workDuration'
  | 'housingType'
  | 'doorOpener'
  | 'giftRecipient'
  | 'seenCompetitorGifts'
  | 'isTenMinutesEnough'
  | 'photoFrequencyOutOfTen'
  | 'lateArrivalOutOfTen'
  | 'giftOpeningReaction'
  | 'otherChildrenGiftAskOutOfTen'
  | 'primaryConversationPartner'
  | 'momsKnowTenMinLimit'
  | 'extraToysInCarAskOutOfTen'
  | 'pricingSentiment'
  | 'customerServiceFeedback'
  | 'momOvertimeStaffAction'
  | 'potentialServices'
  | 'firstThingToChange';

export interface StaffRequiredQuestionMeta {
  key: StaffRequiredQuestionKey;
  section: number;
  labelAr: string;
  labelEn: string;
}

// Exactly 18 questions = 1/3 of the 55 visible Character Staff Survey questions
export const STAFF_REQUIRED_QUESTIONS: StaffRequiredQuestionMeta[] = [
  // Section 1 (3 of 6)
  {
    key: 'workDuration',
    section: 1,
    labelAr: '1. مدة عملك في خدمة الشخصيات',
    labelEn: '1. Character performer tenure',
  },
  {
    key: 'housingType',
    section: 1,
    labelAr: '5. نوع المنزل غالبًا',
    labelEn: '5. Usual home / venue type',
  },
  {
    key: 'doorOpener',
    section: 1,
    labelAr: '6. من يفتح لكِ الباب غالبًا؟',
    labelEn: '6. Who usually opens the door',
  },
  // Section 2 (5 of 13)
  {
    key: 'giftRecipient',
    section: 2,
    labelAr: '8. من الذي يستلم منكِ الهدية في العادة؟',
    labelEn: '8. Who usually receives the gift',
  },
  {
    key: 'seenCompetitorGifts',
    section: 2,
    labelAr: 'هل تشاهدين هدايا أو ألعابًا من شركات أخرى قُدمت للطفل؟',
    labelEn: 'Competitor gifts/toys observed',
  },
  {
    key: 'isTenMinutesEnough',
    section: 2,
    labelAr: '10. هل العشر دقائق كافية؟',
    labelEn: '10. Are 10 minutes enough?',
  },
  {
    key: 'photoFrequencyOutOfTen',
    section: 2,
    labelAr: 'كم من كل عشر زيارات يتم فيها تصوير الشخصية مع الأطفال؟',
    labelEn: 'Photos with character (out of 10)',
  },
  {
    key: 'lateArrivalOutOfTen',
    section: 2,
    labelAr: 'كم من كل عشر زيارات تصلين متأخرة؟',
    labelEn: 'Late arrival frequency (out of 10)',
  },
  // Section 3 (2 of 7)
  {
    key: 'giftOpeningReaction',
    section: 3,
    labelAr: '17. ماذا يفعل الطفل أول ما يفتح الهدية؟',
    labelEn: '17. Child reaction upon opening gift',
  },
  {
    key: 'otherChildrenGiftAskOutOfTen',
    section: 3,
    labelAr: 'كم من كل عشرة زيارات سألكِ بقية الأطفال عن هدايا لهم؟',
    labelEn: 'Other kids asking for gifts (out of 10)',
  },
  // Section 4 (5 of 11)
  {
    key: 'primaryConversationPartner',
    section: 4,
    labelAr: 'أثناء الزيارة، من الذي يتبادل معكِ الحديث أكثر؟',
    labelEn: 'Primary conversation partner',
  },
  {
    key: 'momsKnowTenMinLimit',
    section: 4,
    labelAr: 'هل تعلم الأمهات أن وقت الزيارة 10 دقائق؟',
    labelEn: 'Do mothers know 10-min visit limit?',
  },
  {
    key: 'extraToysInCarAskOutOfTen',
    section: 4,
    labelAr: 'كم من كل عشرة زيارات سألكِ أولياء الأمور عن توفر ألعاب إضافية في السيارة؟',
    labelEn: 'Parents asking for extra car toys (out of 10)',
  },
  {
    key: 'pricingSentiment',
    section: 4,
    labelAr: '26. ما هي التعليقات التي تسمعينها غالبًا عن الأسعار؟',
    labelEn: '26. Usual pricing feedback',
  },
  {
    key: 'customerServiceFeedback',
    section: 4,
    labelAr: 'ما هي تعليقات العملاء عن خدمة العملاء؟',
    labelEn: 'Customer service feedback',
  },
  // Section 5 (1 of 9)
  {
    key: 'momOvertimeStaffAction',
    section: 5,
    labelAr: '33. ما الذي تفعلينه عادةً عند طلب وقت إضافي؟',
    labelEn: '33. Usual action on overtime request',
  },
  // Section 6 (1 of 4)
  {
    key: 'potentialServices',
    section: 6,
    labelAr: '51. ما الذي يمكن أن نقدمه للأسرة ولا نقدمه الآن؟',
    labelEn: '51. New services we could offer',
  },
  // Section 7 (1 of 5)
  {
    key: 'firstThingToChange',
    section: 7,
    labelAr: 'لو كان القرار بيدكِ، ما أول شيء تغيّرينه في الزيارة؟',
    labelEn: 'First thing to change in the visit',
  },
];

export interface StaffRequiredAnswerState {
  workDuration: string;
  housingType: string;
  doorOpener: string;
  giftRecipient: string;
  seenCompetitorGifts: string;
  isTenMinutesEnough: number | null;
  photoFrequencyOutOfTen: number | null;
  lateArrivalOutOfTen: number | null;
  giftOpeningReaction: string;
  otherChildrenGiftAskOutOfTen: number | null;
  primaryConversationPartner: string;
  momsKnowTenMinLimit: string;
  extraToysInCarAskOutOfTen: number | null;
  pricingSentiment: string;
  customerServiceFeedback: string;
  otherCSFeedback?: string;
  momOvertimeStaffAction: string;
  potentialServices: string[];
  firstThingToChange: string;
}

export function isStaffRequiredQuestionComplete(
  key: StaffRequiredQuestionKey,
  state: StaffRequiredAnswerState
): boolean {
  switch (key) {
    case 'workDuration':
      return state.workDuration.trim().length > 0;
    case 'housingType':
      return state.housingType.trim().length > 0;
    case 'doorOpener':
      return state.doorOpener.trim().length > 0;
    case 'giftRecipient':
      return state.giftRecipient.trim().length > 0;
    case 'seenCompetitorGifts':
      return state.seenCompetitorGifts.trim().length > 0;
    case 'isTenMinutesEnough':
      return typeof state.isTenMinutesEnough === 'number' && state.isTenMinutesEnough >= 1 && state.isTenMinutesEnough <= 5;
    case 'photoFrequencyOutOfTen':
      return typeof state.photoFrequencyOutOfTen === 'number' && state.photoFrequencyOutOfTen >= 0 && state.photoFrequencyOutOfTen <= 10;
    case 'lateArrivalOutOfTen':
      return typeof state.lateArrivalOutOfTen === 'number' && state.lateArrivalOutOfTen >= 0 && state.lateArrivalOutOfTen <= 10;
    case 'giftOpeningReaction':
      return state.giftOpeningReaction.trim().length > 0;
    case 'otherChildrenGiftAskOutOfTen':
      return typeof state.otherChildrenGiftAskOutOfTen === 'number' && state.otherChildrenGiftAskOutOfTen >= 0 && state.otherChildrenGiftAskOutOfTen <= 10;
    case 'primaryConversationPartner':
      return state.primaryConversationPartner.trim().length > 0;
    case 'momsKnowTenMinLimit':
      return state.momsKnowTenMinLimit.trim().length > 0;
    case 'extraToysInCarAskOutOfTen':
      return typeof state.extraToysInCarAskOutOfTen === 'number' && state.extraToysInCarAskOutOfTen >= 0 && state.extraToysInCarAskOutOfTen <= 10;
    case 'pricingSentiment':
      return state.pricingSentiment.trim().length > 0;
    case 'customerServiceFeedback':
      return (
        state.customerServiceFeedback.trim().length > 0 ||
        Boolean(state.otherCSFeedback && state.otherCSFeedback.trim().length > 0)
      );
    case 'momOvertimeStaffAction':
      return state.momOvertimeStaffAction.trim().length > 0;
    case 'potentialServices':
      return Array.isArray(state.potentialServices) && state.potentialServices.length > 0;
    case 'firstThingToChange':
      return state.firstThingToChange.trim().length > 0;
    default:
      return false;
  }
}

export interface StaffRequiredProgressResult {
  totalQuestionsCount: number;
  requiredCount: number;
  completedCount: number;
  missingQuestions: StaffRequiredQuestionMeta[];
  missingBySection: Record<number, StaffRequiredQuestionMeta[]>;
  totalBySection: Record<number, number>;
  completedBySection: Record<number, number>;
  isComplete: boolean;
  firstIncompleteSection: number | null;
}

export function evaluateStaffSurveyRequiredProgress(
  state: StaffRequiredAnswerState
): StaffRequiredProgressResult {
  const missingQuestions: StaffRequiredQuestionMeta[] = [];
  const missingBySection: Record<number, StaffRequiredQuestionMeta[]> = {};
  const totalBySection: Record<number, number> = {};
  const completedBySection: Record<number, number> = {};

  for (const item of STAFF_REQUIRED_QUESTIONS) {
    totalBySection[item.section] = (totalBySection[item.section] || 0) + 1;
    if (completedBySection[item.section] === undefined) {
      completedBySection[item.section] = 0;
    }

    if (isStaffRequiredQuestionComplete(item.key, state)) {
      completedBySection[item.section] += 1;
    } else {
      missingQuestions.push(item);
      if (!missingBySection[item.section]) {
        missingBySection[item.section] = [];
      }
      missingBySection[item.section].push(item);
    }
  }

  const requiredCount = STAFF_REQUIRED_QUESTIONS.length;
  const completedCount = requiredCount - missingQuestions.length;

  return {
    totalQuestionsCount: STAFF_TOTAL_QUESTIONS_COUNT,
    requiredCount,
    completedCount,
    missingQuestions,
    missingBySection,
    totalBySection,
    completedBySection,
    isComplete: missingQuestions.length === 0,
    firstIncompleteSection: missingQuestions.length > 0 ? missingQuestions[0].section : null,
  };
}

export const clampNum = (val: unknown, min: number, max: number, fallback: number): number => {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
};

export const safeStr = (val: unknown, maxLen: number): string => {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
};

export const safeStrArray = (val: unknown, maxItems: number, maxItemLen = 300): string[] => {
  if (!Array.isArray(val)) return [];
  return val
    .filter((item): item is string => typeof item === 'string')
    .map((s) => s.trim().slice(0, maxItemLen))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
};

export const safeId = (val: unknown, prefix: string): string => {
  if (typeof val === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(val)) {
    return val;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const safeIsoTimestamp = (val: unknown): string => {
  const s = safeStr(val, 64);
  return s.length >= 10 ? s : new Date().toISOString();
};

export function buildStaffSurveyPayload(survey: StaffSurveyResponse) {
  const id = safeId(survey.id, 'staff-resp');
  return {
    id,
    submittedAt: safeIsoTimestamp(survey.submittedAt),
    consent: Boolean(survey.consent),
    workDuration: safeStr(survey.workDuration, 100),
    dailyVisitsAvg: clampNum(survey.dailyVisitsAvg, 0, 100, 0),
    frequentCharacters: safeStr(survey.frequentCharacters, 500),
    childAgeGroup: safeStr(survey.childAgeGroup, 64),
    frequentAreas: safeStr(survey.frequentAreas, 500),
    housingType: safeStr(survey.housingType, 100),
    doorOpener: safeStr(survey.doorOpener, 100),
    firstMinuteDesc: safeStr(survey.firstMinuteDesc, 3000),
    parentsReception: safeStr(survey.parentsReception, 200),
    prepTimeMinutes: safeStr(survey.prepTimeMinutes, 100),
    giftRecipient: safeStr(survey.giftRecipient, 100),
    seenCompetitorGifts: safeStr(survey.seenCompetitorGifts, 100),
    timeAllocation: {
      entrance: clampNum(survey.timeAllocation?.entrance, 0, 120, 0),
      gift: clampNum(survey.timeAllocation?.gift, 0, 120, 0),
      play: clampNum(survey.timeAllocation?.play, 0, 120, 0),
      photos: clampNum(survey.timeAllocation?.photos, 0, 120, 0),
      farewell: clampNum(survey.timeAllocation?.farewell, 0, 120, 0),
    },
    isTenMinutesEnough: clampNum(survey.isTenMinutesEnough, 1, 5, 3),
    isTenMinutesEnoughReason: safeStr(survey.isTenMinutesEnoughReason, 2000),
    overflowFrequency: clampNum(survey.overflowFrequency, 0, 10, 0),
    overflowMinutesAvg: clampNum(survey.overflowMinutesAvg, 0, 120, 0),
    photoFrequencyOutOfTen: clampNum(survey.photoFrequencyOutOfTen, 0, 10, 0),
    lateArrivalOutOfTen: clampNum(survey.lateArrivalOutOfTen, 0, 10, 0),
    lateArrivalJustification: safeStr(survey.lateArrivalJustification, 2000),
    lastTwoMinutesDesc: safeStr(survey.lastTwoMinutesDesc, 2000),
    bestMomentDesc: safeStr(survey.bestMomentDesc, 2000),
    worstMomentDesc: safeStr(survey.worstMomentDesc, 2000),
    childReactions: {
      directJoy: clampNum(survey.childReactions?.directJoy, 0, 10, 0),
      shyness: clampNum(survey.childReactions?.shyness, 0, 10, 0),
      fearOrCrying: clampNum(survey.childReactions?.fearOrCrying, 0, 10, 0),
      extremeAttachment: clampNum(survey.childReactions?.extremeAttachment, 0, 10, 0),
    },
    handlingScaredChild: safeStr(survey.handlingScaredChild, 2000),
    giftOpeningReaction: safeStr(survey.giftOpeningReaction, 300),
    childrenSpecialRequests: safeStr(survey.childrenSpecialRequests, 2000),
    otherChildrenGiftAskOutOfTen: clampNum(survey.otherChildrenGiftAskOutOfTen, 0, 10, 0),
    otherChildrenGiftReply: safeStr(survey.otherChildrenGiftReply, 2000),
    observedInterests: safeStr(survey.observedInterests, 2000),
    handlingAttachmentOnLeave: safeStr(survey.handlingAttachmentOnLeave, 2000),
    childAskingToBuy: safeStr(survey.childAskingToBuy, 2000),
    whoAttends: safeStrArray(survey.whoAttends, 15),
    momBehaviorDuringVisit: safeStr(survey.momBehaviorDuringVisit, 2000),
    topThreeMomQuestions: safeStr(survey.topThreeMomQuestions, 2000),
    momInquiriesFrequency:
      survey.momInquiriesFrequency &&
      typeof survey.momInquiriesFrequency === 'object' &&
      !Array.isArray(survey.momInquiriesFrequency)
        ? Object.fromEntries(
            Object.entries(survey.momInquiriesFrequency)
              .slice(0, 15)
              .map(([k, v]) => [safeStr(k, 100), safeStr(v, 100)] as const)
              .filter(([k]) => k.length > 0)
          )
        : {},
    pricingSentiment: safeStr(survey.pricingSentiment, 100),
    customerServiceFeedback: safeStr(survey.customerServiceFeedback, 1000),
    appWebsiteComplaints: safeStr(survey.appWebsiteComplaints, 2000),
    extraToysInCarAskOutOfTen: clampNum(survey.extraToysInCarAskOutOfTen, 0, 10, 0),
    momsKnowTenMinLimit: safeStr(survey.momsKnowTenMinLimit, 100),
    momsUnawareTenMinReaction: safeStr(survey.momsUnawareTenMinReaction, 2000),
    primaryConversationPartner: safeStr(survey.primaryConversationPartner, 100),
    momRepeatPromise: safeStr(survey.momRepeatPromise, 2000),
    bestTimingForOffers: safeStr(survey.bestTimingForOffers, 200),
    bestTimingForOffersReason: safeStr(survey.bestTimingForOffersReason, 2000),
    momDiscomfortMoments: safeStr(survey.momDiscomfortMoments, 2000),
    photoVideoRequests: safeStr(survey.photoVideoRequests, 2000),
    siblingsInterest: safeStr(survey.siblingsInterest, 2000),
    momOvertime: {
      frequency: clampNum(survey.momOvertime?.frequency, 0, 10, 0),
      requestedMinutes: clampNum(survey.momOvertime?.requestedMinutes, 0, 240, 0),
      staffAction: safeStr(survey.momOvertime?.staffAction, 500),
      delayedNextVisit: safeStr(survey.momOvertime?.delayedNextVisit, 1000),
      paidExtensionExperience: safeStr(survey.momOvertime?.paidExtensionExperience, 1000),
      wishedCompanyGuidance: safeStr(survey.momOvertime?.wishedCompanyGuidance, 1000),
    },
    situations:
      survey.situations &&
      typeof survey.situations === 'object' &&
      !Array.isArray(survey.situations)
        ? Object.fromEntries(
            Object.entries(survey.situations)
              .slice(0, 15)
              .map(([k, v]) => [
                safeStr(k, 100),
                {
                  action: safeStr(v?.action, 1000),
                  phrase: safeStr(v?.phrase, 1000),
                  guidance: safeStr(v?.guidance, 50),
                  outcome: safeStr(v?.outcome, 1000),
                },
              ] as const)
              .filter(([k]) => k.length > 0)
          )
        : {},
    otherDifficultSituations: safeStr(survey.otherDifficultSituations, 2000),
    unleveragedMomChildComments: safeStr(survey.unleveragedMomChildComments, 2000),
    potentialServices: safeStrArray(survey.potentialServices, 20),
    upcomingEventsNoticed: safeStr(survey.upcomingEventsNoticed, 2000),
    websiteWhatsappInquiries: safeStr(survey.websiteWhatsappInquiries, 2000),
    frictionInProposing: safeStr(survey.frictionInProposing, 2000),
    oneMessageAboutKidzy: safeStr(survey.oneMessageAboutKidzy, 1000),
    neighborsRelativesInterest: safeStr(survey.neighborsRelativesInterest, 2000),
    trainingFeedback: safeStr(survey.trainingFeedback, 2000),
    materialsNeeded: safeStr(survey.materialsNeeded, 2000),
    costumeHoursDaily: safeStr(survey.costumeHoursDaily, 200),
    costumeDifficulty: safeStr(survey.costumeDifficulty, 1000),
    safetyFeeling: safeStr(survey.safetyFeeling, 500),
    emergencyPreparedness: safeStr(survey.emergencyPreparedness, 200),
    costumeChangingSpace: safeStr(survey.costumeChangingSpace, 1000),
    selfIntroduction: safeStr(survey.selfIntroduction, 1000),
    ideasEvaluation: Array.isArray(survey.ideasEvaluation)
      ? survey.ideasEvaluation.slice(0, 15).map((item) => ({
          ideaId: safeStr(item?.ideaId, 100),
          title: safeStr(item?.title, 300),
          score: clampNum(item?.score, 0, 5, 0),
          feasibility: safeStr(item?.feasibility, 50),
        }))
      : [],
    biggestRiskPerceived: safeStr(survey.biggestRiskPerceived, 2000),
    bestVisitExperience: safeStr(survey.bestVisitExperience, 3000),
    hardestVisitExperience: safeStr(survey.hardestVisitExperience, 3000),
    messageToLeadership: safeStr(survey.messageToLeadership, 3000),
    firstThingToChange: safeStr(survey.firstThingToChange, 2000),
    finalComments: safeStr(survey.finalComments, 3000),
    voiceNotes: Array.isArray(survey.voiceNotes)
      ? survey.voiceNotes.slice(0, 20).map((vn) => ({
          questionId: safeStr(vn?.questionId, 100),
          durationSeconds: clampNum(vn?.durationSeconds, 0, 3600, 0),
          transcription: safeStr(vn?.transcription, 2000),
          recordedAt: safeStr(vn?.recordedAt, 64),
        }))
      : [],
  };
}


