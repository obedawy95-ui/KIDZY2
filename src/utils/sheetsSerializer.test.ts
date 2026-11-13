import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStaffKpiSummaryTable,
  buildStaffSurveyReviewDigest,
  buildSurveySheetTable,
  countStaffRequiredAnswered,
  extractSpreadsheetIdFromInput,
  MOM_INQUIRY_TOPICS,
} from './sheetsSerializer';
import {
  CustomerServiceSurveyResponse,
  DriverSurveyResponse,
  MotherSurveyResponse,
  OperationsSurveyResponse,
  PostVisitLog,
  StaffSurveyResponse,
} from '../types/survey';

const makeSampleStaffResponse = (
  overrides: Partial<StaffSurveyResponse> = {}
): StaffSurveyResponse => ({
  id: 'staff-resp-test-1',
  submittedAt: '2026-11-11T09:30:00.000Z',
  consent: true,
  workDuration: '3–6 أشهر',
  dailyVisitsAvg: 4,
  frequentCharacters: '',
  childAgeGroup: '3–5',
  frequentAreas: 'شمال الرياض',
  housingType: 'فيلا كبيرة',
  doorOpener: 'الأم',
  firstMinuteDesc: 'الطفل ابتسم وركض نحو الشخصية',
  parentsReception: 'بترحاب كبير ومكان مجهز',
  prepTimeMinutes: '',
  giftRecipient: 'الطفل',
  seenCompetitorGifts: 'أحيانًا',
  timeAllocation: { entrance: 2, gift: 2, play: 3, photos: 2, farewell: 1 },
  isTenMinutesEnough: 3,
  isTenMinutesEnoughReason: 'اللعب مع الإخوة يحتاج دقيقتين إضافيتين',
  overflowFrequency: 4,
  overflowMinutesAvg: 5,
  photoFrequencyOutOfTen: 0,
  lateArrivalOutOfTen: 0,
  lateArrivalJustification: '',
  lastTwoMinutesDesc: 'صورة جماعية وتلويح باليد',
  bestMomentDesc: '',
  worstMomentDesc: '',
  childReactions: { directJoy: 8, shyness: 2, fearOrCrying: 0, extremeAttachment: 1 },
  handlingScaredChild: 'الجلوس على مستوى نظر الطفل',
  giftOpeningReaction: 'يلعب بها فورًا',
  childrenSpecialRequests: 'سيارة إضافية للأخ',
  otherChildrenGiftAskOutOfTen: 6,
  otherChildrenGiftReply: 'نوضح بلطف أن الهدية لصاحب المناسبة ويمكن للأهل حجز هدايا إضافية',
  observedInterests: '',
  handlingAttachmentOnLeave: 'وعد بزيارة قريبة وتلويح',
  childAskingToBuy: '',
  whoAttends: ['الأم', 'إخوة'],
  momBehaviorDuringVisit: 'تصور وتشارك اللعب',
  topThreeMomQuestions: '1. الأسعار\n2. الشخصيات الأخرى\n3. التمديد',
  momInquiriesFrequency: {
    'الأسعار': '4–6 مرات',
    'شخصيات أخرى': '1–3 مرات',
    'كيدزي ميديا (إنستا / سناب)': 'لا يحدث',
    'التطبيق أو الموقع': '1–3 مرات',
    'خدمة العملاء': 'لا يحدث',
  },
  pricingSentiment: 'غالية',
  customerServiceFeedback: 'استجابة ممتازة وسريعة',
  appWebsiteComplaints: 'صعوبة تحديد الموقع على الخريطة',
  extraToysInCarAskOutOfTen: 0,
  momsKnowTenMinLimit: 'لا',
  momsUnawareTenMinReaction: 'تستغرب وتظن الزيارة 20 دقيقة',
  primaryConversationPartner: 'الأم والطفل',
  momRepeatPromise: '',
  bestTimingForOffers: 'عند الوداع',
  bestTimingForOffersReason: '',
  momDiscomfortMoments: '',
  photoVideoRequests: '',
  siblingsInterest: '',
  momOvertime: {
    frequency: 5,
    requestedMinutes: 10,
    staffAction: 'أعرض تمديدًا مدفوعًا',
    delayedNextVisit: '',
    paidExtensionExperience: '',
    wishedCompanyGuidance: 'توفير رابط دفع فوري للتمديد',
  },
  situations: {
    sit_hospitality: {
      action: 'الاعتذار بابتسامة بحكم الزي',
      phrase: 'تسلمون يا رب، وجودي في الشخصية ما يسمح لي',
      guidance: '',
      outcome: '',
    },
    sit_crying_child: {
      action: 'التراجع خطوة والجلوس بهدوء',
      phrase: 'أنا صديقتك جبت لك هدية حلوة',
      guidance: '',
      outcome: '',
    },
  },
  otherDifficultSituations: '',
  unleveragedMomChildComments: 'الأمهات يطلبن تصويرًا احترافيًا للزيارة',
  potentialServices: ['زيارة أطول', 'ألعاب إضافية في السيارة للشراء المباشر لبقية الأطفال'],
  upcomingEventsNoticed: '',
  websiteWhatsappInquiries: '',
  frictionInProposing: 'عدم توفر لائحة أسعار في اليد',
  oneMessageAboutKidzy: 'لحظة فرح منظمة تدوم في ذاكرة الطفل',
  neighborsRelativesInterest: '',
  trainingFeedback: '',
  materialsNeeded: '',
  costumeHoursDaily: '',
  costumeDifficulty: '',
  safetyFeeling: '',
  emergencyPreparedness: '',
  costumeChangingSpace: '',
  selfIntroduction: '',
  ideasEvaluation: [],
  biggestRiskPerceived: '',
  bestVisitExperience: 'زيارة تخرج لطفلة في الظهر',
  hardestVisitExperience: 'تزاحم ضيوف في صالة صغيرة',
  messageToLeadership: 'يرجى توضيح مدة الزيارة للأم قبل الوصول',
  firstThingToChange: 'توضيح مدة الـ 10 دقائق في رسالة الحجز',
  finalComments: 'بالتوفيق لفريق كيدزي',
  voiceNotes: [{ questionId: 'voice-1', durationSeconds: 18, recordedAt: '2026-11-11T09:31:00Z' }],
  ...overrides,
});

test('extractSpreadsheetIdFromInput handles Google Sheets URLs, raw IDs, and invalid strings', () => {
  assert.equal(
    extractSpreadsheetIdFromInput(
      'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0'
    ),
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  );
  assert.equal(
    extractSpreadsheetIdFromInput('  1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms  '),
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  );
  assert.equal(extractSpreadsheetIdFromInput(''), null);
  assert.equal(extractSpreadsheetIdFromInput('https://example.com/not-a-sheet'), null);
});

test('countStaffRequiredAnswered counts all 18 starred questions even when explicit zeros are answered', () => {
  const full = makeSampleStaffResponse();
  assert.equal(countStaffRequiredAnswered(full), 18);

  const partial = makeSampleStaffResponse({
    giftRecipient: '',
    potentialServices: [],
    firstThingToChange: '',
  });
  assert.equal(countStaffRequiredAnswered(partial), 15);
});

test('buildSurveySheetTable flattens staff-survey nested fields, preserves zero numbers, and excludes legacy unpublished Sec 7-8 keys', () => {
  const sample = makeSampleStaffResponse();
  const tableAr = buildSurveySheetTable('staff-survey', [sample], 'ar');
  const tableEn = buildSurveySheetTable('staff-survey', [sample], 'en');

  assert.equal(tableAr.rows.length, 1);
  assert.equal(tableAr.headers.length, tableEn.headers.length);
  assert.equal(tableAr.headers.length, tableAr.rows[0].length);

  // Explicit zero metrics must stay numeric 0
  const photoIdx = tableEn.headers.indexOf('S2: Photo Rate (/10) *');
  const lateIdx = tableEn.headers.indexOf('S2: Late Arrival (/10) *');
  const extraToysIdx = tableEn.headers.indexOf('S4: Extra Car Toys Ask (/10) *');
  assert.equal(tableEn.rows[0][photoIdx], 0);
  assert.equal(tableEn.rows[0][lateIdx], 0);
  assert.equal(tableEn.rows[0][extraToysIdx], 0);

  // Nested allocations & situations are flattened into readable strings/numbers
  const totalMinsIdx = tableEn.headers.indexOf('S2: Total Allocated (m)');
  const hospActionIdx = tableEn.headers.indexOf('S5-37(A): Hospitality Action');
  const pricingTopicIdx = tableEn.headers.indexOf('S4: Topic - Pricing');
  assert.equal(tableEn.rows[0][totalMinsIdx], 10);
  assert.equal(tableEn.rows[0][hospActionIdx], 'الاعتذار بابتسامة بحكم الزي');
  assert.equal(tableEn.rows[0][pricingTopicIdx], '4–6 مرات');

  // Legacy unpublished Sec 7/8 fields must NOT appear in sheet headers
  assert.equal(tableEn.headers.includes('trainingFeedback'), false);
  assert.equal(tableEn.headers.includes('ideasEvaluation'), false);
  assert.equal(tableEn.headers.includes('biggestRiskPerceived'), false);
});

test('buildSurveySheetTable generates clean structured tables for all other 5 survey types', () => {
  const postLogs: PostVisitLog[] = [
    {
      id: 'pv-1',
      timestamp: '2026-11-11T10:00:00Z',
      characterName: 'شخصية ميني',
      staffNameOrCode: 'K-1',
      childAgeGroup: '3–5',
      actualDurationMinutes: 12,
      requestedExtraTime: true,
      extraTimeNotes: 'طلبت الأم 5 دقائق',
      topMomQuestion: 'هل يوجد تمديد؟',
      pricingSentiment: 'معقولة',
      missedOpportunities: ['سؤال عن سعر'],
      atmosphereRating: 5,
    },
  ];
  const momSurveys: MotherSurveyResponse[] = [
    {
      id: 'mom-1',
      timestamp: '2026-11-11T10:05:00Z',
      experienceRating: 5,
      wasTenMinutesEnough: 'نعم، كافية',
      interestedInPaidExtension: 'نعم',
      pricingFeedback: 'معقولة ومناسبة',
      customerServiceSatisfaction: 'ممتازة وسريعة',
      appExperienceFeedback: 'سلس',
      missingWishes: '',
      whatsappOptIn: true,
      whatsappPhone: '0500000000',
    },
  ];
  const driverSurveys: DriverSurveyResponse[] = [
    {
      id: 'drv-1',
      submittedAt: '2026-11-11T10:10:00Z',
      driverNameOrCode: 'D-1',
      experiencePeriod: '3–6 أشهر',
      dailyDeliveriesAvg: 9,
      vehicleType: 'فان مخصص',
      commonDeliveryItems: ['هدايا وصناديق مفاجآت'],
      lateArrivalOutOfTen: 1,
      lateArrivalReasons: ['الازدحام'],
      lateArrivalJustification: 'زحمة طريق الملك فهد',
      doorOpener: 'الأم',
      clientRequiresEntry: 'لا',
      photoProofFrequencyOutOfTen: 8,
      pricingCommentsHeard: 'معقولة',
      appMapComplaints: '',
      customerServiceSupportRating: 5,
      biggestRoadblock: 'تأخر الرد عند البوابة',
      suggestionsForOps: '',
    },
  ];
  const csSurveys: CustomerServiceSurveyResponse[] = [
    {
      id: 'cs-1',
      submittedAt: '2026-11-11T10:15:00Z',
      agentNameOrCode: 'CS-1',
      shiftType: 'صباحية',
      dailyTicketsCount: 35,
      topInquiryTypes: ['الأسعار'],
      pricingCommentsReceived: 'معقولة',
      commonClientComplaintsAboutCS: ['لا توجد شكاوى'],
      complaintsAboutCSDetails: '',
      appWebsiteComplaintsDetails: 'لا توجد',
      cancellationReasons: ['تغيير الموعد'],
      unservedDemands: ['كيك مخصص'],
      toolsNeededToImprove: 'قوالب رد سريع',
      generalNotes: '',
    },
  ];
  const opsSurveys: OperationsSurveyResponse[] = [
    {
      id: 'ops-1',
      submittedAt: '2026-11-11T10:20:00Z',
      coordinatorNameOrCode: 'OPS-1',
      shiftType: 'مسائية',
      dailyDispatchedVisits: 28,
      scheduleAdherenceRating: 4,
      driverLatenessRateOutOfTen: 2,
      mascotLatenessRateOutOfTen: 1,
      primaryDispatchBottlenecks: ['المسافات بين الأحياء'],
      costumeReadinessAndMaintenance: 'ممتازة',
      appBookingIntegrationIssues: '',
      pricingFeedbackFromOperations: 'متوازنة',
      coordinationBetweenCSAndField: 'جيدة',
      peakHoursStrategyFeedback: '',
      proposalsForLeadership: '',
    },
  ];

  assert.equal(buildSurveySheetTable('post-visit-log', postLogs, 'en').rows.length, 1);
  assert.equal(buildSurveySheetTable('mother-survey', momSurveys, 'en').rows.length, 1);
  assert.equal(buildSurveySheetTable('drivers-survey', driverSurveys, 'en').rows.length, 1);
  assert.equal(buildSurveySheetTable('customer-service-survey', csSurveys, 'en').rows.length, 1);
  assert.equal(buildSurveySheetTable('operations-survey', opsSurveys, 'en').rows.length, 1);
});

test('buildStaffSurveyReviewDigest & buildStaffKpiSummaryTable accurately summarize live responses', () => {
  const s1 = makeSampleStaffResponse({ id: 's1', isTenMinutesEnough: 4, pricingSentiment: 'معقولة' });
  const s2 = makeSampleStaffResponse({
    id: 's2',
    isTenMinutesEnough: 2,
    pricingSentiment: 'غالية',
    giftRecipient: 'الأم',
    momsKnowTenMinLimit: 'نعم',
    momsUnawareTenMinReaction: '',
  });

  const digest = buildStaffSurveyReviewDigest([s1, s2]);
  assert.equal(digest.totalResponses, 2);
  assert.equal(digest.fullyCompletedRequiredCount, 2);
  assert.equal(digest.averages.isTenMinutesEnough, '3.0');
  assert.equal(digest.averages.timeAllocation.total, 10);
  assert.equal(digest.momInquiriesMatrix.length, MOM_INQUIRY_TOPICS.length);
  assert.equal(digest.momInquiriesMatrix[0].counts['4–6 مرات'], 2);
  assert.equal(digest.difficultSituations.length, 4);
  assert.equal(digest.difficultSituations[0].entries.length, 2);
  assert.equal(digest.qualitative.momsUnawareTenMinReaction.length, 1);
  assert.equal(digest.qualitative.firstThingToChange.length, 2);

  const summarySheet = buildStaffKpiSummaryTable([s1, s2], 'ar');
  assert.equal(summarySheet.headers.length, 3);
  assert.ok(summarySheet.rows.length >= 10);
  assert.equal(summarySheet.rows[0][1], 2);
});
