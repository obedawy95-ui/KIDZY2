import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTimeAllocation,
  aggregatePostVisitLogs,
  aggregateIdeasRatings,
  generateGoogleAppsScript,
  calculatePricingSentiment,
  getSurveyShareUrl,
  getGuestHubShareUrl,
  getGuestResponsesShareUrl,
  STAFF_TOTAL_QUESTIONS_COUNT,
  STAFF_REQUIRED_QUESTIONS,
  isStaffRequiredQuestionComplete,
  evaluateStaffSurveyRequiredProgress,
  StaffRequiredAnswerState,
  buildStaffSurveyPayload
} from './surveyLogic';
import { PostVisitLog, ProposedIdeaRating, StaffSurveyResponse } from '../types/survey';

test('calculateTimeAllocation accurately sums minutes and detects exact 10 mins', () => {
  const result = calculateTimeAllocation({
    entrance: 2,
    gift: 2,
    play: 3,
    photos: 2,
    farewell: 1
  });

  assert.equal(result.total, 10);
  assert.equal(result.difference, 0);
  assert.equal(result.isExact, true);
  assert.equal(result.isOver, false);
  assert.equal(result.isUnder, false);
});

test('calculateTimeAllocation detects overflow beyond 10 minutes', () => {
  const result = calculateTimeAllocation({
    entrance: 3,
    gift: 3,
    play: 4,
    photos: 2,
    farewell: 2
  });

  assert.equal(result.total, 14);
  assert.equal(result.difference, 4);
  assert.equal(result.isExact, false);
  assert.equal(result.isOver, true);
});

test('aggregatePostVisitLogs calculates duration average and overtime rate', () => {
  const sampleLogs: PostVisitLog[] = [
    {
      id: '1',
      timestamp: '2026-11-09T10:00:00Z',
      childAgeGroup: '3–5',
      actualDurationMinutes: 12,
      requestedExtraTime: true,
      topMomQuestion: 'هل تسوون حفلات أعياد ميلاد؟',
      missedOpportunities: ['سؤال عن حفلة', 'سؤال عن سعر'],
      atmosphereRating: 5
    },
    {
      id: '2',
      timestamp: '2026-11-09T11:00:00Z',
      childAgeGroup: '6–9',
      actualDurationMinutes: 10,
      requestedExtraTime: false,
      topMomQuestion: 'كم سعر الزيارة الشهرية؟',
      missedOpportunities: ['سؤال عن سعر'],
      atmosphereRating: 4
    }
  ];

  const agg = aggregatePostVisitLogs(sampleLogs);
  assert.equal(agg.totalLogs, 2);
  assert.equal(agg.averageDurationMinutes, 11);
  assert.equal(agg.overtimeRequestRatePercent, 50);
  assert.equal(agg.averageAtmosphereRating, 4.5);
  assert.equal(agg.topOpportunities[0].label, 'سؤال عن سعر');
  assert.equal(agg.topOpportunities[0].count, 2);
  assert.equal(agg.topOpportunities[0].percent, 100);
});

test('aggregateIdeasRatings aggregates scores and sorts highest rated idea first', () => {
  const ratings: ProposedIdeaRating[][] = [
    [
      { ideaId: 'idea_qr', title: 'بطاقة QR', score: 5, feasibility: 'نعم' },
      { ideaId: 'idea_ext', title: 'تمديد مدفوع', score: 3, feasibility: 'بشروط' }
    ],
    [
      { ideaId: 'idea_qr', title: 'بطاقة QR', score: 4, feasibility: 'نعم' },
      { ideaId: 'idea_ext', title: 'تمديد مدفوع', score: 4, feasibility: 'لا' }
    ]
  ];

  const ranked = aggregateIdeasRatings(ratings);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].ideaId, 'idea_qr');
  assert.equal(ranked[0].averageScore, 4.5);
  assert.equal(ranked[0].feasibilityYesCount, 2);
  assert.equal(ranked[0].feasibilityScorePercent, 100);

  assert.equal(ranked[1].ideaId, 'idea_ext');
  assert.equal(ranked[1].averageScore, 3.5);
});

test('generateGoogleAppsScript includes company name and handles fixSetCollectEmail', () => {
  const codeFixed = generateGoogleAppsScript({
    companyName: 'كيدزي السعيدة',
    fixSetCollectEmail: true,
    visitDurationMinutes: 10,
    allowVoiceResponseNote: true
  });

  assert.ok(codeFixed.includes('كيدزي السعيدة'));
  assert.ok(codeFixed.includes('// form.setCollectEmail(false)'));
  assert.ok(codeFixed.includes('createStaffForm'));
  assert.ok(codeFixed.includes('createPostVisitLog'));
  assert.ok(codeFixed.includes('createMothersSurvey'));
  assert.ok(codeFixed.includes('createDriversForm'));
  assert.ok(codeFixed.includes('createCustomerServiceForm'));
  assert.ok(codeFixed.includes('createOperationsForm'));

  const codeUnfixed = generateGoogleAppsScript({
    companyName: '',
    fixSetCollectEmail: false,
    visitDurationMinutes: 15,
    allowVoiceResponseNote: false
  });

  assert.ok(codeUnfixed.includes('kidzy kpi,s'));
  assert.ok(codeUnfixed.includes('form.setCollectEmail(false);'));
  assert.ok(codeUnfixed.includes('15 دقائق'));
});

test('generateGoogleAppsScript Character Staff Survey reflects updated sections 1-7 and hides old 7 & 8', () => {
  const script = generateGoogleAppsScript({
    companyName: 'kidzy kpi,s',
    fixSetCollectEmail: true,
    visitDurationMinutes: 10,
    allowVoiceResponseNote: true
  });

  // New & modified staff survey questions present
  assert.ok(script.includes('من الذي يستلم منكِ الهدية في العادة؟'));
  assert.ok(script.includes('هل تشاهدين هدايا أو ألعابًا من شركات أخرى قُدمت للطفل؟'));
  assert.ok(script.includes('كم من كل 10 زيارات سألكِ بقية الأطفال عن هدايا لهم؟'));
  assert.ok(script.includes('أثناء الزيارة، من الذي يتبادل معكِ الحديث أكثر؟'));
  assert.ok(script.includes('كيدزي ميديا (إنستا / سناب)'));
  assert.ok(script.includes('هل تعلم الأمهات أن وقت الزيارة 10 دقائق؟'));
  assert.ok(script.includes('كم من كل 10 زيارات سألكِ أولياء الأمور عن توفر ألعاب إضافية في السيارة؟'));
  assert.ok(script.includes('26. ما هي التعليقات التي تسمعينها غالبًا عن الأسعار؟'));
  assert.ok(script.includes('ألعاب إضافية في السيارة للشراء المباشر لبقية الأطفال'));
  assert.ok(script.includes('القسم 7: أسئلة مفتوحة'));

  // Removed part (ج) & old Section 7 (Tools/Safety) unpublished
  assert.ok(!script.includes('(ج) هل لديك توجيه من الشركة لهذا الموقف؟'));
  assert.ok(!script.includes('القسم 6: الأدوات والسلامة والمقترحات'));
});

test('calculatePricingSentiment categorizes responses correctly', () => {
  const sentiment = calculatePricingSentiment([
    'غالية جدا',
    'غالية جدًا',
    'غالية',
    'معقولة',
    'مناسبة',
    'لا توجد تعليقات'
  ]);

  assert.equal(sentiment.total, 6);
  assert.equal(sentiment.veryExpensive, 2);
  assert.equal(sentiment.expensive, 1);
  assert.equal(sentiment.reasonable, 2);
  assert.equal(sentiment.noComments, 1);
});

test('calculatePricingSentiment returns zero percentages when no responses exist', () => {
  const emptySentiment = calculatePricingSentiment([], [], [], []);

  assert.equal(emptySentiment.total, 0);
  assert.equal(emptySentiment.dominant, 'لا توجد بيانات');
  assert.equal(emptySentiment.percentages['معقولة'], 0);
  assert.equal(emptySentiment.percentages['لا توجد تعليقات'], 0);
});

test('getSurveyShareUrl formats standalone link with origin', () => {
  const url = getSurveyShareUrl('drivers-survey', 'https://kidzy.app');
  assert.equal(url, 'https://kidzy.app/?survey=drivers-survey&mode=standalone');
});

test('getSurveyShareUrl and getGuestHubShareUrl support guest access links without sign-in', () => {
  const guestSurveyUrl = getSurveyShareUrl('staff-survey', 'https://kidzy.app', { guest: true });
  assert.equal(guestSurveyUrl, 'https://kidzy.app/?survey=staff-survey&mode=standalone&guest=1');

  const guestHubUrl = getGuestHubShareUrl('https://kidzy.app');
  assert.equal(guestHubUrl, 'https://kidzy.app/?guest=1');

  const guestResponsesUrl = getGuestResponsesShareUrl('https://kidzy.app');
  assert.equal(guestResponsesUrl, 'https://kidzy.app/?tab=analytics&guest=1');

  const script = generateGoogleAppsScript({
    companyName: 'kidzy kpi,s',
    fixSetCollectEmail: true,
    visitDurationMinutes: 10,
    allowVoiceResponseNote: true,
  });
  assert.ok(script.includes('form.setRequireLogin(false)'));
});

const createEmptyStaffRequiredState = (): StaffRequiredAnswerState => ({
  workDuration: '',
  housingType: '',
  doorOpener: '',
  giftRecipient: '',
  seenCompetitorGifts: '',
  isTenMinutesEnough: null,
  photoFrequencyOutOfTen: null,
  lateArrivalOutOfTen: null,
  giftOpeningReaction: '',
  otherChildrenGiftAskOutOfTen: null,
  primaryConversationPartner: '',
  momsKnowTenMinLimit: '',
  extraToysInCarAskOutOfTen: null,
  pricingSentiment: '',
  customerServiceFeedback: '',
  otherCSFeedback: '',
  momOvertimeStaffAction: '',
  potentialServices: [],
  firstThingToChange: '',
});

test('STAFF_REQUIRED_QUESTIONS equals exactly 1/3 of published staff survey questions (18 of 55)', () => {
  assert.equal(STAFF_TOTAL_QUESTIONS_COUNT, 55);
  assert.equal(STAFF_REQUIRED_QUESTIONS.length, Math.round(STAFF_TOTAL_QUESTIONS_COUNT / 3));
  assert.equal(STAFF_REQUIRED_QUESTIONS.length, 18);
  const uniqueKeys = new Set(STAFF_REQUIRED_QUESTIONS.map((q) => q.key));
  assert.equal(uniqueKeys.size, 18);
});

test('evaluateStaffSurveyRequiredProgress distinguishes explicit 0 from null and enforces all 18 starred questions', () => {
  const emptyState = createEmptyStaffRequiredState();
  const emptyProg = evaluateStaffSurveyRequiredProgress(emptyState);
  assert.equal(emptyProg.completedCount, 0);
  assert.equal(emptyProg.requiredCount, 18);
  assert.equal(emptyProg.isComplete, false);
  assert.equal(emptyProg.firstIncompleteSection, 1);

  const completedWithZeros: StaffRequiredAnswerState = {
    workDuration: '3–6 أشهر',
    housingType: 'فيلا كبيرة',
    doorOpener: 'الأم',
    giftRecipient: 'الطفل',
    seenCompetitorGifts: 'أحيانًا',
    isTenMinutesEnough: 3,
    photoFrequencyOutOfTen: 0,
    lateArrivalOutOfTen: 0,
    giftOpeningReaction: 'يلعب بها فورًا',
    otherChildrenGiftAskOutOfTen: 0,
    primaryConversationPartner: 'الأم والطفل',
    momsKnowTenMinLimit: 'لا',
    extraToysInCarAskOutOfTen: 0,
    pricingSentiment: 'معقولة',
    customerServiceFeedback: '',
    otherCSFeedback: 'العميلة أثنت على سرعة التجاوب',
    momOvertimeStaffAction: 'أعرض تمديدًا مدفوعًا',
    potentialServices: ['زيارة أطول'],
    firstThingToChange: 'زيادة مدة الزيارة إلى 15 دقيقة',
  };

  assert.equal(isStaffRequiredQuestionComplete('photoFrequencyOutOfTen', completedWithZeros), true);
  assert.equal(isStaffRequiredQuestionComplete('customerServiceFeedback', completedWithZeros), true);

  const fullProg = evaluateStaffSurveyRequiredProgress(completedWithZeros);
  assert.equal(fullProg.completedCount, 18);
  assert.equal(fullProg.isComplete, true);
  assert.equal(fullProg.firstIncompleteSection, null);
  assert.equal(fullProg.missingQuestions.length, 0);

  // Removing a single required field should detect exact incomplete section
  const missingSec6 = evaluateStaffSurveyRequiredProgress({
    ...completedWithZeros,
    potentialServices: [],
  });
  assert.equal(missingSec6.completedCount, 17);
  assert.equal(missingSec6.isComplete, false);
  assert.equal(missingSec6.firstIncompleteSection, 6);
  assert.equal(missingSec6.missingBySection[6].length, 1);
});

test('buildStaffSurveyPayload produces exact 79-key Firestore schema and clamps/truncates inputs safely', () => {
  const dirtySurvey = {
    id: 'bad id with spaces!!!',
    submittedAt: 'bad',
    consent: true,
    workDuration: '3–6 أشهر',
    dailyVisitsAvg: 999,
    frequentCharacters: 'س',
    childAgeGroup: '3–5',
    frequentAreas: '',
    housingType: 'فيلا كبيرة',
    doorOpener: 'الأم',
    firstMinuteDesc: 'أ'.repeat(5000),
    parentsReception: '',
    prepTimeMinutes: '',
    giftRecipient: 'الطفل',
    seenCompetitorGifts: 'أحيانًا',
    timeAllocation: { entrance: -5, gift: 2, play: 200, photos: 2, farewell: 1 },
    isTenMinutesEnough: 99,
    isTenMinutesEnoughReason: 'ر'.repeat(2500),
    overflowFrequency: 25,
    overflowMinutesAvg: 300,
    photoFrequencyOutOfTen: 0,
    lateArrivalOutOfTen: 0,
    lateArrivalJustification: '',
    lastTwoMinutesDesc: '',
    bestMomentDesc: '',
    worstMomentDesc: '',
    childReactions: { directJoy: 10, shyness: -1, fearOrCrying: 2, extremeAttachment: 0 },
    handlingScaredChild: '',
    giftOpeningReaction: 'يلعب بها فورًا',
    childrenSpecialRequests: '',
    otherChildrenGiftAskOutOfTen: 0,
    otherChildrenGiftReply: '',
    observedInterests: '',
    handlingAttachmentOnLeave: '',
    childAskingToBuy: '',
    whoAttends: Array.from({ length: 20 }, (_, i) => `person-${i}`),
    momBehaviorDuringVisit: '',
    topThreeMomQuestions: '',
    momInquiriesFrequency: { الأسعار: 'دائمًا' },
    pricingSentiment: 'معقولة',
    customerServiceFeedback: 'العميلة أثنت على سرعة التجاوب',
    appWebsiteComplaints: '',
    extraToysInCarAskOutOfTen: 0,
    momsKnowTenMinLimit: 'لا',
    momsUnawareTenMinReaction: 'فوجئت',
    primaryConversationPartner: 'الأم والطفل',
    momRepeatPromise: '',
    bestTimingForOffers: '',
    bestTimingForOffersReason: '',
    momDiscomfortMoments: '',
    photoVideoRequests: '',
    siblingsInterest: '',
    momOvertime: {
      frequency: 12,
      requestedMinutes: 500,
      staffAction: 'أعرض تمديدًا مدفوعًا',
      delayedNextVisit: '',
      paidExtensionExperience: '',
      wishedCompanyGuidance: '',
    },
    situations: {},
    otherDifficultSituations: '',
    unleveragedMomChildComments: '',
    potentialServices: ['زيارة أطول'],
    upcomingEventsNoticed: '',
    websiteWhatsappInquiries: '',
    frictionInProposing: '',
    oneMessageAboutKidzy: '',
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
    bestVisitExperience: '',
    hardestVisitExperience: '',
    messageToLeadership: '',
    firstThingToChange: 'زيادة مدة الزيارة إلى 15 دقيقة',
    finalComments: '',
    voiceNotes: [],
  } as unknown as StaffSurveyResponse;

  const payload = buildStaffSurveyPayload(dirtySurvey);

  // 78 client fields + 1 server createdAt = 79 keys checked by firestore.rules
  assert.equal(Object.keys(payload).length, 78);
  assert.match(payload.id, /^[a-zA-Z0-9_-]{1,128}$/);
  assert.ok(payload.submittedAt.length >= 10 && payload.submittedAt.length <= 64);
  assert.equal(payload.dailyVisitsAvg, 100);
  assert.equal(payload.isTenMinutesEnough, 5);
  assert.equal(payload.overflowFrequency, 10);
  assert.equal(payload.overflowMinutesAvg, 120);
  assert.equal(payload.firstMinuteDesc.length, 3000);
  assert.equal(payload.isTenMinutesEnoughReason.length, 2000);

  // Nested maps match exact key counts
  assert.equal(Object.keys(payload.timeAllocation).length, 5);
  assert.equal(payload.timeAllocation.entrance, 0);
  assert.equal(payload.timeAllocation.play, 120);
  assert.equal(Object.keys(payload.childReactions).length, 4);
  assert.equal(payload.childReactions.shyness, 0);
  assert.equal(Object.keys(payload.momOvertime).length, 6);
  assert.equal(payload.momOvertime.frequency, 10);
  assert.equal(payload.momOvertime.requestedMinutes, 240);

  // Bounded lists respect firestore.rules caps
  assert.equal(payload.whoAttends.length, 15);
  assert.deepEqual(payload.potentialServices, ['زيارة أطول']);
});


