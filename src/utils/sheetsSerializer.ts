import {
  CustomerServiceSurveyResponse,
  DriverSurveyResponse,
  MotherSurveyResponse,
  OperationsSurveyResponse,
  PostVisitLog,
  StaffSurveyResponse,
  SurveyTypeKey,
} from '../types/survey';
import { DIFFICULT_SITUATIONS } from '../data/surveyQuestions';
import {
  calculateTimeAllocation,
  isStaffRequiredQuestionComplete,
  STAFF_REQUIRED_QUESTIONS,
  StaffRequiredAnswerState,
} from './surveyLogic';

export function extractSpreadsheetIdFromInput(rawInput: string): string | null {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,})/);
  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  if (/^[a-zA-Z0-9_-]{15,120}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export const STAFF_PUBLISHED_SITUATION_IDS = [
  'sit_hospitality',
  'sit_crying_child',
  'sit_pulling_costume',
  'sit_toy_defect',
] as const;

export const MOM_INQUIRY_TOPICS = [
  { key: 'الأسعار', labelAr: 'الأسعار', labelEn: 'Pricing' },
  { key: 'شخصيات أخرى', labelAr: 'شخصيات أخرى', labelEn: 'Other Characters' },
  { key: 'كيدزي ميديا (إنستا / سناب)', labelAr: 'كيدزي ميديا (إنستا / سناب)', labelEn: 'Kidzy Media (Insta / Snap)' },
  { key: 'التطبيق أو الموقع', labelAr: 'التطبيق أو الموقع', labelEn: 'App or Website' },
  { key: 'خدمة العملاء', labelAr: 'خدمة العملاء', labelEn: 'Customer Service' },
] as const;

export const LEGACY_UNPUBLISHED_STAFF_KEYS = new Set<string>([
  'frequentCharacters',
  'prepTimeMinutes',
  'bestMomentDesc',
  'worstMomentDesc',
  'observedInterests',
  'childAskingToBuy',
  'momRepeatPromise',
  'bestTimingForOffersReason',
  'momDiscomfortMoments',
  'photoVideoRequests',
  'siblingsInterest',
  'upcomingEventsNoticed',
  'websiteWhatsappInquiries',
  'neighborsRelativesInterest',
  'trainingFeedback',
  'materialsNeeded',
  'costumeHoursDaily',
  'costumeDifficulty',
  'safetyFeeling',
  'emergencyPreparedness',
  'costumeChangingSpace',
  'selfIntroduction',
  'ideasEvaluation',
  'biggestRiskPerceived',
]);

export function staffResponseToRequiredState(s: StaffSurveyResponse): StaffRequiredAnswerState {
  return {
    workDuration: s.workDuration || '',
    housingType: s.housingType || '',
    doorOpener: s.doorOpener || '',
    giftRecipient: s.giftRecipient || '',
    seenCompetitorGifts: s.seenCompetitorGifts || '',
    isTenMinutesEnough: typeof s.isTenMinutesEnough === 'number' ? s.isTenMinutesEnough : null,
    photoFrequencyOutOfTen:
      typeof s.photoFrequencyOutOfTen === 'number' ? s.photoFrequencyOutOfTen : null,
    lateArrivalOutOfTen: typeof s.lateArrivalOutOfTen === 'number' ? s.lateArrivalOutOfTen : null,
    giftOpeningReaction: s.giftOpeningReaction || '',
    otherChildrenGiftAskOutOfTen:
      typeof s.otherChildrenGiftAskOutOfTen === 'number' ? s.otherChildrenGiftAskOutOfTen : null,
    primaryConversationPartner: s.primaryConversationPartner || '',
    momsKnowTenMinLimit: s.momsKnowTenMinLimit || '',
    extraToysInCarAskOutOfTen:
      typeof s.extraToysInCarAskOutOfTen === 'number' ? s.extraToysInCarAskOutOfTen : null,
    pricingSentiment: s.pricingSentiment || '',
    customerServiceFeedback: s.customerServiceFeedback || '',
    otherCSFeedback: '',
    momOvertimeStaffAction: s.momOvertime?.staffAction || '',
    potentialServices: Array.isArray(s.potentialServices) ? s.potentialServices : [],
    firstThingToChange: s.firstThingToChange || '',
  };
}

export function countStaffRequiredAnswered(s: StaffSurveyResponse): number {
  const reqState = staffResponseToRequiredState(s);
  return STAFF_REQUIRED_QUESTIONS.filter((q) => isStaffRequiredQuestionComplete(q.key, reqState)).length;
}

export interface StaffBreakdownItem {
  label: string;
  count: number;
  pct: number;
}

export interface StaffSituationReviewGroup {
  situationId: string;
  number: number | string;
  titleAr: string;
  titleEn: string;
  entries: {
    responseId: string;
    submittedAt: string;
    areaOrTenure: string;
    action: string;
    phrase: string;
  }[];
}

export interface StaffSurveyReviewDigest {
  totalResponses: number;
  requiredTargetCount: number;
  fullyCompletedRequiredCount: number;
  averageRequiredAnswered: number;
  latestSubmittedAt: string | null;
  averages: {
    dailyVisitsAvg: string;
    isTenMinutesEnough: string;
    overflowFrequency: string;
    overflowMinutesAvg: string;
    photoFrequencyOutOfTen: string;
    lateArrivalOutOfTen: string;
    otherChildrenGiftAskOutOfTen: string;
    extraToysInCarAskOutOfTen: string;
    momOvertimeFrequency: string;
    momOvertimeRequestedMinutes: string;
    timeAllocation: {
      entrance: number;
      gift: number;
      play: number;
      photos: number;
      farewell: number;
      total: number;
      sampleCount: number;
    };
    childReactions: {
      directJoy: string;
      shyness: string;
      fearOrCrying: string;
      extremeAttachment: string;
    };
  };
  breakdowns: {
    workDuration: StaffBreakdownItem[];
    childAgeGroup: StaffBreakdownItem[];
    housingType: StaffBreakdownItem[];
    doorOpener: StaffBreakdownItem[];
    parentsReception: StaffBreakdownItem[];
    giftRecipient: StaffBreakdownItem[];
    seenCompetitorGifts: StaffBreakdownItem[];
    giftOpeningReaction: StaffBreakdownItem[];
    whoAttends: StaffBreakdownItem[];
    primaryConversationPartner: StaffBreakdownItem[];
    momsKnowTenMinLimit: StaffBreakdownItem[];
    pricingSentiment: StaffBreakdownItem[];
    customerServiceFeedback: StaffBreakdownItem[];
    bestTimingForOffers: StaffBreakdownItem[];
    momOvertimeStaffAction: StaffBreakdownItem[];
    potentialServices: StaffBreakdownItem[];
  };
  momInquiriesMatrix: {
    topicKey: string;
    labelAr: string;
    labelEn: string;
    counts: Record<string, number>;
    totalAnswered: number;
  }[];
  qualitative: {
    firstThingToChange: { responseId: string; meta: string; text: string }[];
    messageToLeadership: { responseId: string; meta: string; text: string }[];
    otherChildrenGiftReply: { responseId: string; meta: string; text: string }[];
    momsUnawareTenMinReaction: { responseId: string; meta: string; text: string }[];
    lateArrivalJustification: { responseId: string; meta: string; text: string }[];
    appWebsiteComplaints: { responseId: string; meta: string; text: string }[];
    unleveragedMomChildComments: { responseId: string; meta: string; text: string }[];
    bestAndHardestMoments: {
      responseId: string;
      meta: string;
      best: string;
      hardest: string;
      finalComment: string;
    }[];
  };
  difficultSituations: StaffSituationReviewGroup[];
}

function buildSingleValueBreakdown(values: (string | undefined)[]): StaffBreakdownItem[] {
  const counts: Record<string, number> = {};
  let valid = 0;
  for (const val of values) {
    const clean = (val || '').trim();
    if (clean) {
      counts[clean] = (counts[clean] || 0) + 1;
      valid++;
    }
  }
  if (valid === 0) return [];
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / valid) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function buildMultiValueBreakdown(lists: (string[] | undefined)[], denominator: number): StaffBreakdownItem[] {
  const counts: Record<string, number> = {};
  for (const arr of lists) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const clean = (item || '').trim();
      if (clean) {
        counts[clean] = (counts[clean] || 0) + 1;
      }
    }
  }
  if (denominator <= 0) return [];
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.min(100, Math.round((count / denominator) * 100)),
    }))
    .sort((a, b) => b.count - a.count);
}

function formatNumericAvg(nums: (number | undefined | null)[]): string {
  const valid = nums.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (valid.length === 0) return '—';
  return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
}

function collectQualitative(
  items: StaffSurveyResponse[],
  getter: (s: StaffSurveyResponse) => string | undefined
): { responseId: string; meta: string; text: string }[] {
  const results: { responseId: string; meta: string; text: string }[] = [];
  for (const s of items) {
    const text = (getter(s) || '').trim();
    if (!text) continue;
    const metaParts = [s.workDuration, s.frequentAreas, s.housingType].filter((x) => x && x.trim());
    results.push({
      responseId: s.id,
      meta: metaParts.join(' · ') || s.id.slice(0, 12),
      text,
    });
  }
  return results;
}

export function buildStaffSurveyReviewDigest(staffSurveys: StaffSurveyResponse[]): StaffSurveyReviewDigest {
  const list = Array.isArray(staffSurveys) ? staffSurveys : [];
  const total = list.length;

  let fullyCompleted = 0;
  let totalReqSum = 0;
  for (const s of list) {
    const c = countStaffRequiredAnswered(s);
    totalReqSum += c;
    if (c >= STAFF_REQUIRED_QUESTIONS.length) {
      fullyCompleted++;
    }
  }

  // Average time allocation across responses with any allocated minutes
  const timeSamples = list.filter((s) => {
    const calc = calculateTimeAllocation(
      s.timeAllocation || { entrance: 0, gift: 0, play: 0, photos: 0, farewell: 0 }
    );
    return calc.total > 0;
  });
  const timeSampleCount = timeSamples.length;
  const avgTime = (key: 'entrance' | 'gift' | 'play' | 'photos' | 'farewell') =>
    timeSampleCount > 0
      ? Math.round(
          (timeSamples.reduce((sum, s) => sum + (Number(s.timeAllocation?.[key]) || 0), 0) /
            timeSampleCount) *
            10
        ) / 10
      : 0;
  const entrance = avgTime('entrance');
  const gift = avgTime('gift');
  const play = avgTime('play');
  const photos = avgTime('photos');
  const farewell = avgTime('farewell');

  // Mom inquiry matrix
  const momInquiriesMatrix = MOM_INQUIRY_TOPICS.map((topic) => {
    const counts: Record<string, number> = {
      'لا يحدث': 0,
      '1–3 مرات': 0,
      '4–6 مرات': 0,
      '7–10 مرات': 0,
    };
    let totalAnswered = 0;
    for (const s of list) {
      const val = (s.momInquiriesFrequency?.[topic.key] || '').trim();
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
        totalAnswered++;
      }
    }
    return {
      topicKey: topic.key,
      labelAr: topic.labelAr,
      labelEn: topic.labelEn,
      counts,
      totalAnswered,
    };
  });

  // Difficult situations Q37–Q40
  const difficultSituations: StaffSituationReviewGroup[] = DIFFICULT_SITUATIONS.slice(0, 4).map((sit) => {
    const entries: StaffSituationReviewGroup['entries'] = [];
    for (const s of list) {
      const ans = s.situations?.[sit.id];
      const action = (ans?.action || '').trim();
      const phrase = (ans?.phrase || '').trim();
      if (action || phrase) {
        entries.push({
          responseId: s.id,
          submittedAt: s.submittedAt,
          areaOrTenure: [s.workDuration, s.frequentAreas].filter(Boolean).join(' · ') || s.id.slice(0, 12),
          action,
          phrase,
        });
      }
    }
    return {
      situationId: sit.id,
      number: sit.number,
      titleAr: sit.title,
      titleEn: sit.titleEn,
      entries,
    };
  });

  const bestAndHardestMoments = list
    .map((s) => ({
      responseId: s.id,
      meta: [s.workDuration, s.frequentAreas].filter(Boolean).join(' · ') || s.id.slice(0, 12),
      best: (s.bestVisitExperience || '').trim(),
      hardest: (s.hardestVisitExperience || '').trim(),
      finalComment: (s.finalComments || '').trim(),
    }))
    .filter((x) => x.best || x.hardest || x.finalComment);

  const sortedByTime = [...list].sort(
    (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
  );

  return {
    totalResponses: total,
    requiredTargetCount: STAFF_REQUIRED_QUESTIONS.length,
    fullyCompletedRequiredCount: fullyCompleted,
    averageRequiredAnswered: total > 0 ? Math.round((totalReqSum / total) * 10) / 10 : 0,
    latestSubmittedAt: sortedByTime[0]?.submittedAt || null,
    averages: {
      dailyVisitsAvg: formatNumericAvg(list.map((s) => s.dailyVisitsAvg)),
      isTenMinutesEnough: formatNumericAvg(list.map((s) => s.isTenMinutesEnough)),
      overflowFrequency: formatNumericAvg(list.map((s) => s.overflowFrequency)),
      overflowMinutesAvg: formatNumericAvg(list.map((s) => s.overflowMinutesAvg)),
      photoFrequencyOutOfTen: formatNumericAvg(list.map((s) => s.photoFrequencyOutOfTen)),
      lateArrivalOutOfTen: formatNumericAvg(list.map((s) => s.lateArrivalOutOfTen)),
      otherChildrenGiftAskOutOfTen: formatNumericAvg(list.map((s) => s.otherChildrenGiftAskOutOfTen)),
      extraToysInCarAskOutOfTen: formatNumericAvg(list.map((s) => s.extraToysInCarAskOutOfTen)),
      momOvertimeFrequency: formatNumericAvg(list.map((s) => s.momOvertime?.frequency)),
      momOvertimeRequestedMinutes: formatNumericAvg(list.map((s) => s.momOvertime?.requestedMinutes)),
      timeAllocation: {
        entrance,
        gift,
        play,
        photos,
        farewell,
        total: Math.round((entrance + gift + play + photos + farewell) * 10) / 10,
        sampleCount: timeSampleCount,
      },
      childReactions: {
        directJoy: formatNumericAvg(list.map((s) => s.childReactions?.directJoy)),
        shyness: formatNumericAvg(list.map((s) => s.childReactions?.shyness)),
        fearOrCrying: formatNumericAvg(list.map((s) => s.childReactions?.fearOrCrying)),
        extremeAttachment: formatNumericAvg(list.map((s) => s.childReactions?.extremeAttachment)),
      },
    },
    breakdowns: {
      workDuration: buildSingleValueBreakdown(list.map((s) => s.workDuration)),
      childAgeGroup: buildSingleValueBreakdown(list.map((s) => s.childAgeGroup)),
      housingType: buildSingleValueBreakdown(list.map((s) => s.housingType)),
      doorOpener: buildSingleValueBreakdown(list.map((s) => s.doorOpener)),
      parentsReception: buildSingleValueBreakdown(list.map((s) => s.parentsReception)),
      giftRecipient: buildSingleValueBreakdown(list.map((s) => s.giftRecipient)),
      seenCompetitorGifts: buildSingleValueBreakdown(list.map((s) => s.seenCompetitorGifts)),
      giftOpeningReaction: buildSingleValueBreakdown(list.map((s) => s.giftOpeningReaction)),
      whoAttends: buildMultiValueBreakdown(
        list.map((s) => s.whoAttends),
        total
      ),
      primaryConversationPartner: buildSingleValueBreakdown(
        list.map((s) => s.primaryConversationPartner)
      ),
      momsKnowTenMinLimit: buildSingleValueBreakdown(list.map((s) => s.momsKnowTenMinLimit)),
      pricingSentiment: buildSingleValueBreakdown(list.map((s) => s.pricingSentiment)),
      customerServiceFeedback: buildSingleValueBreakdown(list.map((s) => s.customerServiceFeedback)),
      bestTimingForOffers: buildSingleValueBreakdown(list.map((s) => s.bestTimingForOffers)),
      momOvertimeStaffAction: buildSingleValueBreakdown(
        list.map((s) => s.momOvertime?.staffAction)
      ),
      potentialServices: buildMultiValueBreakdown(
        list.map((s) => s.potentialServices),
        total
      ),
    },
    momInquiriesMatrix,
    qualitative: {
      firstThingToChange: collectQualitative(list, (s) => s.firstThingToChange),
      messageToLeadership: collectQualitative(list, (s) => s.messageToLeadership),
      otherChildrenGiftReply: collectQualitative(list, (s) => s.otherChildrenGiftReply),
      momsUnawareTenMinReaction: collectQualitative(list, (s) => s.momsUnawareTenMinReaction),
      lateArrivalJustification: collectQualitative(list, (s) => s.lateArrivalJustification),
      appWebsiteComplaints: collectQualitative(list, (s) => s.appWebsiteComplaints),
      unleveragedMomChildComments: collectQualitative(list, (s) => s.unleveragedMomChildComments),
      bestAndHardestMoments,
    },
    difficultSituations,
  };
}

// ==================== SPREADSHEET & CSV FLATTENING ====================

export interface SheetColumnDef<T> {
  headerAr: string;
  headerEn: string;
  value: (item: T) => string | number | boolean;
}

const yesNo = (val: boolean | undefined, lang: 'ar' | 'en') =>
  val ? (lang === 'en' ? 'Yes' : 'نعم') : lang === 'en' ? 'No' : 'لا';

export function getStaffSurveyColumns(lang: 'ar' | 'en'): SheetColumnDef<StaffSurveyResponse>[] {
  return [
    { headerAr: 'المعرف', headerEn: 'Response ID', value: (s) => s.id || '' },
    { headerAr: 'تاريخ الإرسال', headerEn: 'Submitted At', value: (s) => s.submittedAt || '' },
    {
      headerAr: 'اكتمال الإلزامي (*)',
      headerEn: 'Required Completed',
      value: (s) => `${countStaffRequiredAnswered(s)}/${STAFF_REQUIRED_QUESTIONS.length}`,
    },
    { headerAr: 'الموافقة', headerEn: 'Consent', value: (s) => yesNo(s.consent, lang) },
    // Section 1
    { headerAr: 'ق1: مدة العمل *', headerEn: 'S1: Tenure *', value: (s) => s.workDuration || '' },
    { headerAr: 'ق1: متوسط الزيارات اليومية', headerEn: 'S1: Avg Daily Visits', value: (s) => s.dailyVisitsAvg ?? 0 },
    { headerAr: 'ق1: الفئة العمرية للأطفال', headerEn: 'S1: Child Age Group', value: (s) => s.childAgeGroup || '' },
    { headerAr: 'ق1: المناطق الأكثر زيارة', headerEn: 'S1: Frequent Areas', value: (s) => s.frequentAreas || '' },
    { headerAr: 'ق1: نوع المنزل *', headerEn: 'S1: Housing Type *', value: (s) => s.housingType || '' },
    { headerAr: 'ق1: من يفتح الباب *', headerEn: 'S1: Door Opener *', value: (s) => s.doorOpener || '' },
    // Section 2
    { headerAr: 'ق2: أول دقيقة بعد الدخول', headerEn: 'S2: First Minute', value: (s) => s.firstMinuteDesc || '' },
    { headerAr: 'ق2: استقبال الأهل', headerEn: 'S2: Parents Reception', value: (s) => s.parentsReception || '' },
    { headerAr: 'ق2: مستلم الهدية *', headerEn: 'S2: Gift Recipient *', value: (s) => s.giftRecipient || '' },
    { headerAr: 'ق2: هدايا شركات أخرى *', headerEn: 'S2: Competitor Gifts *', value: (s) => s.seenCompetitorGifts || '' },
    { headerAr: 'ق2: وقت الدخول (د)', headerEn: 'S2: Time Entrance (m)', value: (s) => s.timeAllocation?.entrance ?? 0 },
    { headerAr: 'ق2: وقت الهدية (د)', headerEn: 'S2: Time Gift (m)', value: (s) => s.timeAllocation?.gift ?? 0 },
    { headerAr: 'ق2: وقت اللعب (د)', headerEn: 'S2: Time Play (m)', value: (s) => s.timeAllocation?.play ?? 0 },
    { headerAr: 'ق2: وقت الصور (د)', headerEn: 'S2: Time Photos (m)', value: (s) => s.timeAllocation?.photos ?? 0 },
    { headerAr: 'ق2: وقت الوداع (د)', headerEn: 'S2: Time Farewell (m)', value: (s) => s.timeAllocation?.farewell ?? 0 },
    {
      headerAr: 'ق2: مجموع الدقائق الموزعة',
      headerEn: 'S2: Total Allocated (m)',
      value: (s) => calculateTimeAllocation(s.timeAllocation || { entrance: 0, gift: 0, play: 0, photos: 0, farewell: 0 }).total,
    },
    { headerAr: 'ق2: كفاية الـ10 دقائق (1-5) *', headerEn: 'S2: 10m Enough (1-5) *', value: (s) => s.isTenMinutesEnough ?? '' },
    { headerAr: 'ق2: سبب تقييم الوقت', headerEn: 'S2: Time Reason', value: (s) => s.isTenMinutesEnoughReason || '' },
    { headerAr: 'ق2: تكرار التجاوز (من 10)', headerEn: 'S2: Overflow Freq (/10)', value: (s) => s.overflowFrequency ?? 0 },
    { headerAr: 'ق2: متوسط دقائق التجاوز', headerEn: 'S2: Avg Overflow Mins', value: (s) => s.overflowMinutesAvg ?? 0 },
    { headerAr: 'ق2: التصوير مع الأطفال (/10) *', headerEn: 'S2: Photo Rate (/10) *', value: (s) => s.photoFrequencyOutOfTen ?? 0 },
    { headerAr: 'ق2: الوصول متأخرة (/10) *', headerEn: 'S2: Late Arrival (/10) *', value: (s) => s.lateArrivalOutOfTen ?? 0 },
    { headerAr: 'ق2: تبرير التأخير للعميل', headerEn: 'S2: Delay Justification', value: (s) => s.lateArrivalJustification || '' },
    { headerAr: 'ق2: آخر دقيقتين في الزيارة', headerEn: 'S2: Last 2 Minutes', value: (s) => s.lastTwoMinutesDesc || '' },
    // Section 3
    { headerAr: 'ق3: فرح مباشر (/10)', headerEn: 'S3: Direct Joy (/10)', value: (s) => s.childReactions?.directJoy ?? 0 },
    { headerAr: 'ق3: خجل أو ترقب (/10)', headerEn: 'S3: Shyness (/10)', value: (s) => s.childReactions?.shyness ?? 0 },
    { headerAr: 'ق3: خوف أو بكاء (/10)', headerEn: 'S3: Fear/Crying (/10)', value: (s) => s.childReactions?.fearOrCrying ?? 0 },
    { headerAr: 'ق3: تعلق شديد (/10)', headerEn: 'S3: Attachment (/10)', value: (s) => s.childReactions?.extremeAttachment ?? 0 },
    { headerAr: 'ق3: التعامل مع الخائف/الخجول', headerEn: 'S3: Handling Scared Child', value: (s) => s.handlingScaredChild || '' },
    { headerAr: 'ق3: رد فعل فتح الهدية *', headerEn: 'S3: Gift Reaction *', value: (s) => s.giftOpeningReaction || '' },
    { headerAr: 'ق3: طلبات الأطفال الخاصة', headerEn: 'S3: Child Special Requests', value: (s) => s.childrenSpecialRequests || '' },
    { headerAr: 'ق3: سؤال بقية الأطفال عن هدايا (/10) *', headerEn: 'S3: Other Kids Gift Ask (/10) *', value: (s) => s.otherChildrenGiftAskOutOfTen ?? 0 },
    { headerAr: 'ق3: إجابة الموظفة على بقية الأطفال', headerEn: 'S3: Reply to Other Kids', value: (s) => s.otherChildrenGiftReply || '' },
    { headerAr: 'ق3: التعامل مع التعلق عند المغادرة', headerEn: 'S3: Handling Attachment Exit', value: (s) => s.handlingAttachmentOnLeave || '' },
    // Section 4
    { headerAr: 'ق4: من يحضر الزيارة', headerEn: 'S4: Who Attends', value: (s) => (s.whoAttends || []).join(' | ') },
    { headerAr: 'ق4: تصرف الأم أثناء الزيارة', headerEn: 'S4: Mom Behavior', value: (s) => s.momBehaviorDuringVisit || '' },
    { headerAr: 'ق4: أكثر من يتبادل الحديث *', headerEn: 'S4: Primary Conversation *', value: (s) => s.primaryConversationPartner || '' },
    { headerAr: 'ق4: أكثر 3 أسئلة للأمهات', headerEn: 'S4: Top 3 Mom Questions', value: (s) => s.topThreeMomQuestions || '' },
    { headerAr: 'ق4: تكرار سؤال الأسعار', headerEn: 'S4: Topic - Pricing', value: (s) => s.momInquiriesFrequency?.['الأسعار'] || '' },
    { headerAr: 'ق4: تكرار سؤال شخصيات أخرى', headerEn: 'S4: Topic - Other Characters', value: (s) => s.momInquiriesFrequency?.['شخصيات أخرى'] || '' },
    { headerAr: 'ق4: تكرار سؤال كيدزي ميديا', headerEn: 'S4: Topic - Kidzy Media', value: (s) => s.momInquiriesFrequency?.['كيدزي ميديا (إنستا / سناب)'] || '' },
    { headerAr: 'ق4: تكرار سؤال التطبيق/الموقع', headerEn: 'S4: Topic - App/Website', value: (s) => s.momInquiriesFrequency?.['التطبيق أو الموقع'] || '' },
    { headerAr: 'ق4: تكرار سؤال خدمة العملاء', headerEn: 'S4: Topic - Customer Service', value: (s) => s.momInquiriesFrequency?.['خدمة العملاء'] || '' },
    { headerAr: 'ق4: هل تعلم الأم بمدة الـ10د *', headerEn: 'S4: Moms Know 10m Limit *', value: (s) => s.momsKnowTenMinLimit || '' },
    { headerAr: 'ق4: ردة فعلها إذا لم تكن تعلم', headerEn: 'S4: Reaction if Unaware', value: (s) => s.momsUnawareTenMinReaction || '' },
    { headerAr: 'ق4: سؤال ألعاب إضافية بالسيارة (/10) *', headerEn: 'S4: Extra Car Toys Ask (/10) *', value: (s) => s.extraToysInCarAskOutOfTen ?? 0 },
    { headerAr: 'ق4: التعليقات الشائعة عن الأسعار *', headerEn: 'S4: Pricing Sentiment *', value: (s) => s.pricingSentiment || '' },
    { headerAr: 'ق4: تعليقات خدمة العملاء *', headerEn: 'S4: CS Feedback *', value: (s) => s.customerServiceFeedback || '' },
    { headerAr: 'ق4: شكاوى التطبيق أو الموقع', headerEn: 'S4: App/Website Complaints', value: (s) => s.appWebsiteComplaints || '' },
    { headerAr: 'ق4: أفضل توقيت للعروض الجديدة', headerEn: 'S4: Best Offer Timing', value: (s) => s.bestTimingForOffers || '' },
    // Section 5
    { headerAr: 'ق5: طلب وقت إضافي (/10)', headerEn: 'S5: Overtime Ask Freq (/10)', value: (s) => s.momOvertime?.frequency ?? 0 },
    { headerAr: 'ق5: الدقائق الإضافية المطلوبة', headerEn: 'S5: Requested Mins', value: (s) => s.momOvertime?.requestedMinutes ?? 0 },
    { headerAr: 'ق5: تصرف الموظفة عند طلب تمديد *', headerEn: 'S5: Overtime Staff Action *', value: (s) => s.momOvertime?.staffAction || '' },
    { headerAr: 'ق5: ما تتمناه من الإدارة للتمديد', headerEn: 'S5: Overtime Guidance Wished', value: (s) => s.momOvertime?.wishedCompanyGuidance || '' },
    { headerAr: 'ق5-37(أ): الضيافة - التصرف', headerEn: 'S5-37(A): Hospitality Action', value: (s) => s.situations?.sit_hospitality?.action || '' },
    { headerAr: 'ق5-37(ب): الضيافة - العبارة', headerEn: 'S5-37(B): Hospitality Phrase', value: (s) => s.situations?.sit_hospitality?.phrase || '' },
    { headerAr: 'ق5-38(أ): بكاء الطفل - التصرف', headerEn: 'S5-38(A): Crying Child Action', value: (s) => s.situations?.sit_crying_child?.action || '' },
    { headerAr: 'ق5-38(ب): بكاء الطفل - العبارة', headerEn: 'S5-38(B): Crying Child Phrase', value: (s) => s.situations?.sit_crying_child?.phrase || '' },
    { headerAr: 'ق5-39(أ): سحب الزي - التصرف', headerEn: 'S5-39(A): Pulling Costume Action', value: (s) => s.situations?.sit_pulling_costume?.action || '' },
    { headerAr: 'ق5-39(ب): سحب الزي - العبارة', headerEn: 'S5-39(B): Pulling Costume Phrase', value: (s) => s.situations?.sit_pulling_costume?.phrase || '' },
    { headerAr: 'ق5-40(أ): عيب اللعبة - التصرف', headerEn: 'S5-40(A): Toy Defect Action', value: (s) => s.situations?.sit_toy_defect?.action || '' },
    { headerAr: 'ق5-40(ب): عيب اللعبة - العبارة', headerEn: 'S5-40(B): Toy Defect Phrase', value: (s) => s.situations?.sit_toy_defect?.phrase || '' },
    { headerAr: 'ق5: مواقف صعبة أخرى', headerEn: 'S5: Other Difficult Situations', value: (s) => s.otherDifficultSituations || '' },
    // Section 6
    { headerAr: 'ق6: ملاحظات غير مستغلة من الأهل', headerEn: 'S6: Untapped Comments', value: (s) => s.unleveragedMomChildComments || '' },
    { headerAr: 'ق6: خدمات مقترحة للأسرة *', headerEn: 'S6: Potential Services *', value: (s) => (s.potentialServices || []).join(' | ') },
    { headerAr: 'ق6: عوائق اقتراح عروض جديدة', headerEn: 'S6: Friction in Proposing', value: (s) => s.frictionInProposing || '' },
    { headerAr: 'ق6: رسالة واحدة عن كيدزي', headerEn: 'S6: One Message About Kidzy', value: (s) => s.oneMessageAboutKidzy || '' },
    // Section 7
    { headerAr: 'ق7: أجمل تجربة زيارة', headerEn: 'S7: Best Visit Experience', value: (s) => s.bestVisitExperience || '' },
    { headerAr: 'ق7: أصعب تجربة زيارة', headerEn: 'S7: Hardest Visit Experience', value: (s) => s.hardestVisitExperience || '' },
    { headerAr: 'ق7: رسالة للمسؤولين', headerEn: 'S7: Message to Leadership', value: (s) => s.messageToLeadership || '' },
    { headerAr: 'ق7: أول شيء تقترح تغييره *', headerEn: 'S7: First Thing to Change *', value: (s) => s.firstThingToChange || '' },
    { headerAr: 'ق7: ملاحظات ختامية', headerEn: 'S7: Final Comments', value: (s) => s.finalComments || '' },
    { headerAr: 'عدد الملاحظات الصوتية', headerEn: 'Voice Notes Count', value: (s) => s.voiceNotes?.length ?? 0 },
  ];
}

export function buildSurveySheetTable(
  surveyType: SurveyTypeKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[],
  lang: 'ar' | 'en'
): { sheetTitle: string; headers: string[]; rows: (string | number | boolean)[][] } {
  const safeItems = Array.isArray(items) ? items : [];

  const toTable = <T>(
    sheetTitle: string,
    cols: SheetColumnDef<T>[],
    list: T[]
  ): { sheetTitle: string; headers: string[]; rows: (string | number | boolean)[][] } => ({
    sheetTitle,
    headers: cols.map((c) => (lang === 'en' ? c.headerEn : c.headerAr)),
    rows: list.map((row) => cols.map((c) => c.value(row))),
  });

  if (surveyType === 'staff-survey') {
    return toTable<StaffSurveyResponse>(
      lang === 'en' ? 'Character Staff Survey' : 'استبيان الشخصيات',
      getStaffSurveyColumns(lang),
      safeItems
    );
  }

  if (surveyType === 'post-visit-log') {
    return toTable<PostVisitLog>(
      lang === 'en' ? 'Post-Visit Logs (30s)' : 'مذكرات الزيارة 30ث',
      [
        { headerAr: 'المعرف', headerEn: 'ID', value: (x) => x.id || '' },
        { headerAr: 'التوقيت', headerEn: 'Timestamp', value: (x) => x.timestamp || '' },
        { headerAr: 'الشخصية', headerEn: 'Character', value: (x) => x.characterName || '' },
        { headerAr: 'الموظفة / الكود', headerEn: 'Staff Code', value: (x) => x.staffNameOrCode || '' },
        { headerAr: 'عمر الطفل', headerEn: 'Child Age', value: (x) => x.childAgeGroup || '' },
        { headerAr: 'المدة الفعلية (د)', headerEn: 'Actual Mins', value: (x) => x.actualDurationMinutes ?? 0 },
        { headerAr: 'طُلب وقت إضافي؟', headerEn: 'Requested Extra Time?', value: (x) => yesNo(x.requestedExtraTime, lang) },
        { headerAr: 'ملاحظات التمديد', headerEn: 'Extra Time Notes', value: (x) => x.extraTimeNotes || '' },
        { headerAr: 'أبرز سؤال للأم', headerEn: 'Top Mom Question', value: (x) => x.topMomQuestion || '' },
        { headerAr: 'تعليق الأسعار', headerEn: 'Pricing Sentiment', value: (x) => x.pricingSentiment || '' },
        { headerAr: 'فرص غير مستغلة', headerEn: 'Missed Opportunities', value: (x) => (x.missedOpportunities || []).join(' | ') },
        { headerAr: 'تقييم الأجواء (1-5)', headerEn: 'Atmosphere (1-5)', value: (x) => x.atmosphereRating ?? 0 },
      ],
      safeItems
    );
  }

  if (surveyType === 'mother-survey') {
    return toTable<MotherSurveyResponse>(
      lang === 'en' ? 'Mothers Survey' : 'استبيان الأمهات',
      [
        { headerAr: 'المعرف', headerEn: 'ID', value: (x) => x.id || '' },
        { headerAr: 'التوقيت', headerEn: 'Timestamp', value: (x) => x.timestamp || '' },
        { headerAr: 'تقييم التجربة (1-5)', headerEn: 'Rating (1-5)', value: (x) => x.experienceRating ?? 0 },
        { headerAr: 'كفاية الـ10 دقائق', headerEn: '10 Mins Enough', value: (x) => x.wasTenMinutesEnough || '' },
        { headerAr: 'الاهتمام بتمديد مدفوع', headerEn: 'Paid Extension', value: (x) => x.interestedInPaidExtension || '' },
        { headerAr: 'انطباع الأسعار', headerEn: 'Pricing Feedback', value: (x) => x.pricingFeedback || '' },
        { headerAr: 'تقييم خدمة العملاء', headerEn: 'CS Satisfaction', value: (x) => x.customerServiceSatisfaction || '' },
        { headerAr: 'ملاحظات التطبيق والموقع', headerEn: 'App/Website Feedback', value: (x) => x.appExperienceFeedback || '' },
        { headerAr: 'أمنيات ومقترحات', headerEn: 'Missing Wishes', value: (x) => x.missingWishes || '' },
        { headerAr: 'اشتراك واتساب', headerEn: 'WhatsApp Opt-In', value: (x) => yesNo(x.whatsappOptIn, lang) },
        { headerAr: 'رقم الواتساب', headerEn: 'WhatsApp Phone', value: (x) => x.whatsappPhone || '' },
      ],
      safeItems
    );
  }

  if (surveyType === 'drivers-survey') {
    return toTable<DriverSurveyResponse>(
      lang === 'en' ? 'Drivers Survey' : 'استبيان السائقين',
      [
        { headerAr: 'المعرف', headerEn: 'ID', value: (x) => x.id || '' },
        { headerAr: 'تاريخ الإرسال', headerEn: 'Submitted At', value: (x) => x.submittedAt || '' },
        { headerAr: 'اسم/كود السائق', headerEn: 'Driver Name/Code', value: (x) => x.driverNameOrCode || '' },
        { headerAr: 'مدة العمل', headerEn: 'Experience', value: (x) => x.experiencePeriod || '' },
        { headerAr: 'متوسط الطلبات اليومية', headerEn: 'Daily Deliveries', value: (x) => x.dailyDeliveriesAvg ?? 0 },
        { headerAr: 'نوع المركبة', headerEn: 'Vehicle Type', value: (x) => x.vehicleType || '' },
        { headerAr: 'الطلبات الموصلة', headerEn: 'Common Items', value: (x) => (x.commonDeliveryItems || []).join(' | ') },
        { headerAr: 'التأخير (/10)', headerEn: 'Late Rate (/10)', value: (x) => x.lateArrivalOutOfTen ?? 0 },
        { headerAr: 'أسباب التأخير', headerEn: 'Late Reasons', value: (x) => (x.lateArrivalReasons || []).join(' | ') },
        { headerAr: 'تبرير التأخير', headerEn: 'Delay Justification', value: (x) => x.lateArrivalJustification || '' },
        { headerAr: 'من يفتح الباب', headerEn: 'Door Opener', value: (x) => x.doorOpener || '' },
        { headerAr: 'طلب دخول المنزل', headerEn: 'Client Entry Request', value: (x) => x.clientRequiresEntry || '' },
        { headerAr: 'توثيق بالصور (/10)', headerEn: 'Photo Proof (/10)', value: (x) => x.photoProofFrequencyOutOfTen ?? 0 },
        { headerAr: 'انطباع الأسعار', headerEn: 'Pricing Heard', value: (x) => x.pricingCommentsHeard || '' },
        { headerAr: 'شكاوى التطبيق والخرائط', headerEn: 'App/Map Complaints', value: (x) => x.appMapComplaints || '' },
        { headerAr: 'تعليقات خدمة العملاء', headerEn: 'CS Feedback', value: (x) => x.customerServiceFeedback || '' },
        { headerAr: 'دعم خدمة العملاء (1-5)', headerEn: 'CS Support (1-5)', value: (x) => x.customerServiceSupportRating ?? 0 },
        { headerAr: 'أكبر عائق', headerEn: 'Biggest Roadblock', value: (x) => x.biggestRoadblock || '' },
        { headerAr: 'مقترحات للتشغيل', headerEn: 'Ops Suggestions', value: (x) => x.suggestionsForOps || '' },
      ],
      safeItems
    );
  }

  if (surveyType === 'customer-service-survey') {
    return toTable<CustomerServiceSurveyResponse>(
      lang === 'en' ? 'Customer Service Survey' : 'استبيان خدمة العملاء',
      [
        { headerAr: 'المعرف', headerEn: 'ID', value: (x) => x.id || '' },
        { headerAr: 'تاريخ الإرسال', headerEn: 'Submitted At', value: (x) => x.submittedAt || '' },
        { headerAr: 'اسم/كود الممثلة', headerEn: 'Agent Name/Code', value: (x) => x.agentNameOrCode || '' },
        { headerAr: 'فترة الوردية', headerEn: 'Shift Type', value: (x) => x.shiftType || '' },
        { headerAr: 'المحادثات اليومية', headerEn: 'Daily Tickets', value: (x) => x.dailyTicketsCount ?? 0 },
        { headerAr: 'الاستفسارات المتكررة', headerEn: 'Top Inquiries', value: (x) => (x.topInquiryTypes || []).join(' | ') },
        { headerAr: 'انطباع الأسعار', headerEn: 'Pricing Received', value: (x) => x.pricingCommentsReceived || '' },
        { headerAr: 'شكاوى خدمة العملاء', headerEn: 'Common CS Complaints', value: (x) => (x.commonClientComplaintsAboutCS || []).join(' | ') },
        { headerAr: 'تفاصيل شكاوى الخدمة', headerEn: 'CS Details', value: (x) => x.complaintsAboutCSDetails || '' },
        { headerAr: 'شكاوى التطبيق والموقع', headerEn: 'App/Web Complaints', value: (x) => x.appWebsiteComplaintsDetails || '' },
        { headerAr: 'أسباب الإلغاء', headerEn: 'Cancellation Reasons', value: (x) => (x.cancellationReasons || []).join(' | ') },
        { headerAr: 'طلبات غير متوفرة', headerEn: 'Unserved Demands', value: (x) => (x.unservedDemands || []).join(' | ') },
        { headerAr: 'أدوات مطلوبة', headerEn: 'Tools Needed', value: (x) => x.toolsNeededToImprove || '' },
        { headerAr: 'ملاحظات عامة', headerEn: 'General Notes', value: (x) => x.generalNotes || '' },
      ],
      safeItems
    );
  }

  return toTable<OperationsSurveyResponse>(
    lang === 'en' ? 'Operations Survey' : 'استبيان العمليات',
    [
      { headerAr: 'المعرف', headerEn: 'ID', value: (x) => x.id || '' },
      { headerAr: 'تاريخ الإرسال', headerEn: 'Submitted At', value: (x) => x.submittedAt || '' },
      { headerAr: 'اسم/كود المنسق', headerEn: 'Coordinator Name/Code', value: (x) => x.coordinatorNameOrCode || '' },
      { headerAr: 'فترة الوردية', headerEn: 'Shift Type', value: (x) => x.shiftType || '' },
      { headerAr: 'الطلبات الموزعة', headerEn: 'Dispatched Orders', value: (x) => x.dailyDispatchedVisits ?? 0 },
      { headerAr: 'الالتزام بالجدول (1-5)', headerEn: 'Schedule Adherence (1-5)', value: (x) => x.scheduleAdherenceRating ?? 0 },
      { headerAr: 'تأخير السائقين (/10)', headerEn: 'Driver Lateness (/10)', value: (x) => x.driverLatenessRateOutOfTen ?? 0 },
      { headerAr: 'تأخير الشخصيات (/10)', headerEn: 'Staff Lateness (/10)', value: (x) => x.mascotLatenessRateOutOfTen ?? 0 },
      { headerAr: 'أبرز اختناقات التوجيه', headerEn: 'Dispatch Bottlenecks', value: (x) => (x.primaryDispatchBottlenecks || []).join(' | ') },
      { headerAr: 'جاهزية وصيانة الأزياء', headerEn: 'Costume Maintenance', value: (x) => x.costumeReadinessAndMaintenance || '' },
      { headerAr: 'مشاكل تكامل التطبيق', headerEn: 'App Integration Issues', value: (x) => x.appBookingIntegrationIssues || '' },
      { headerAr: 'رؤية التشغيل للأسعار', headerEn: 'Ops Pricing Feedback', value: (x) => x.pricingFeedbackFromOperations || '' },
      { headerAr: 'التنسيق مع خدمة العملاء', headerEn: 'CS Coordination', value: (x) => x.coordinationBetweenCSAndField || '' },
      { headerAr: 'مقترحات أوقات الذروة', headerEn: 'Peak Hours Strategy', value: (x) => x.peakHoursStrategyFeedback || '' },
      { headerAr: 'مقترحات للإدارة', headerEn: 'Leadership Proposals', value: (x) => x.proposalsForLeadership || '' },
    ],
    safeItems
  );
}

export function buildStaffKpiSummaryTable(
  staffSurveys: StaffSurveyResponse[],
  lang: 'ar' | 'en'
): { sheetTitle: string; headers: string[]; rows: (string | number | boolean)[][] } {
  const digest = buildStaffSurveyReviewDigest(staffSurveys);
  const sheetTitle = lang === 'en' ? 'Character KPI Summary' : 'ملخص مؤشرات الشخصيات';
  const headers =
    lang === 'en'
      ? ['Section / Metric', 'Value / Breakdown', 'Sample / Detail']
      : ['القسم / المؤشر', 'النتيجة / النسبة', 'العينة / التفاصيل'];

  const rows: (string | number | boolean)[][] = [
    [
      lang === 'en' ? 'Total Character Staff Responses' : 'إجمالي استجابات استبيان الشخصيات',
      digest.totalResponses,
      lang === 'en'
        ? `${digest.fullyCompletedRequiredCount} fully completed all ${digest.requiredTargetCount} starred questions`
        : `${digest.fullyCompletedRequiredCount} مكتمل لكافة الأسئلة الإلزامية (${digest.requiredTargetCount})`,
    ],
    [
      lang === 'en' ? '10-Minute Visit Sufficiency (1-5)' : 'متوسط كفاية الـ 10 دقائق (من 5)',
      digest.averages.isTenMinutesEnough,
      lang === 'en'
        ? `Avg distributed duration: ${digest.averages.timeAllocation.total} mins`
        : `متوسط الدقائق الموزعة: ${digest.averages.timeAllocation.total} د`,
    ],
    [
      lang === 'en' ? 'Photo Frequency With Kids (/10)' : 'معدل تصوير الشخصية مع الأطفال (من 10)',
      digest.averages.photoFrequencyOutOfTen,
      `${digest.totalResponses}`,
    ],
    [
      lang === 'en' ? 'Character Arrival Lateness (/10)' : 'معدل تأخر الشخصية عن الموعد (من 10)',
      digest.averages.lateArrivalOutOfTen,
      `${digest.totalResponses}`,
    ],
    [
      lang === 'en' ? 'Other Kids Asking for Gifts (/10)' : 'سؤال بقية الأطفال عن هدايا لهم (من 10)',
      digest.averages.otherChildrenGiftAskOutOfTen,
      `${digest.totalResponses}`,
    ],
    [
      lang === 'en' ? 'Parents Asking for Extra Car Toys (/10)' : 'سؤال الأهل عن ألعاب إضافية بالسيارة (من 10)',
      digest.averages.extraToysInCarAskOutOfTen,
      `${digest.totalResponses}`,
    ],
  ];

  const appendBreakdown = (titleAr: string, titleEn: string, items: StaffBreakdownItem[]) => {
    const label = lang === 'en' ? titleEn : titleAr;
    if (items.length === 0) {
      rows.push([label, lang === 'en' ? 'No responses yet' : 'بانتظار استجابات', '0']);
      return;
    }
    rows.push([
      label,
      items.map((x) => `${x.label}: ${x.pct}% (${x.count})`).join(' | '),
      items[0]?.label || '',
    ]);
  };

  appendBreakdown('من يستلم الهدية عادةً', 'Usual Gift Recipient', digest.breakdowns.giftRecipient);
  appendBreakdown('هدايا أو ألعاب من شركات أخرى', 'Competitor Gifts Observed', digest.breakdowns.seenCompetitorGifts);
  appendBreakdown('هل تعلم الأمهات أن الزيارة 10 دقائق؟', 'Moms Know 10-Min Limit?', digest.breakdowns.momsKnowTenMinLimit);
  appendBreakdown('أكثر من يتبادل الحديث مع الشخصية', 'Primary Conversation Partner', digest.breakdowns.primaryConversationPartner);
  appendBreakdown('التعليقات عن الأسعار', 'Pricing Sentiment', digest.breakdowns.pricingSentiment);
  appendBreakdown('تعليقات خدمة العملاء', 'Customer Service Feedback', digest.breakdowns.customerServiceFeedback);
  appendBreakdown('تصرف الموظفة عند طلب تمديد', 'Overtime Staff Action', digest.breakdowns.momOvertimeStaffAction);
  appendBreakdown('خدمات يمكن تقديمها للأسرة', 'Potential Services Requested', digest.breakdowns.potentialServices);

  return { sheetTitle, headers, rows };
}
