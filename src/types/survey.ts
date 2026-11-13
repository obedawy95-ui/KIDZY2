export interface TimeAllocation {
  entrance: number; // دخول
  gift: number;     // فتح الهدية
  play: number;     // لعب
  photos: number;   // صور
  farewell: number; // وداع
}

export interface DifficultSituationAnswer {
  action: string;      // (أ) ما الذي تفعلينه عادةً؟
  phrase: string;      // (ب) ما الذي تقولينه بالنص تقريبًا؟
  guidance: 'نعم' | 'لا' | 'لست متأكدة' | ''; // (ج) هل لديك توجيه من الشركة؟
  outcome: string;     // (د) ما النتيجة غالبًا؟
}

export interface ProposedIdeaRating {
  ideaId: string;
  title: string;
  score: number; // 1-5
  feasibility: 'نعم' | 'بشروط' | 'لا' | '';
}

export interface VoiceNoteRecord {
  questionId: string;
  durationSeconds: number;
  transcription?: string;
  recordedAt: string;
}

export interface StaffSurveyResponse {
  id: string;
  submittedAt: string;
  // القسم 1: عنكِ
  consent: boolean;
  workDuration: string;
  dailyVisitsAvg: number;
  frequentCharacters: string;
  childAgeGroup: string;
  frequentAreas: string;
  housingType?: string;
  doorOpener?: string;

  // القسم 2: مجرى الزيارة
  firstMinuteDesc: string;
  parentsReception: string;
  prepTimeMinutes: string;
  giftRecipient?: string; // من الذي يستلم منكِ الهدية في العادة؟
  seenCompetitorGifts?: string; // هل تشاهدين هدايا أو ألعابًا من شركات أخرى قُدمت للطفل؟
  timeAllocation: TimeAllocation;
  isTenMinutesEnough: number; // 1 to 5
  isTenMinutesEnoughReason: string;
  overflowFrequency: number; // 0 to 10
  overflowMinutesAvg: number;
  photoFrequencyOutOfTen?: number; // كم من عشرة زيارات يتم فيها تصوير الشخصية مع الأطفال
  lateArrivalOutOfTen?: number;    // كم من عشر زيارات تصلين متأخرة
  lateArrivalJustification?: string; // وبماذا تبررين التأخير للعميل
  lastTwoMinutesDesc: string;
  bestMomentDesc: string;
  worstMomentDesc: string;

  // القسم 3: الطفل
  childReactions: {
    directJoy: number;
    shyness: number;
    fearOrCrying: number;
    extremeAttachment: number;
  };
  handlingScaredChild: string;
  giftOpeningReaction: string;
  childrenSpecialRequests: string;
  otherChildrenGiftAskOutOfTen?: number; // كم من عشرة زيارات سألكِ بقية الأطفال عن هدايا لهم؟
  otherChildrenGiftReply?: string;       // وبماذا تجيبين غالبًا؟
  observedInterests: string;
  handlingAttachmentOnLeave: string;
  childAskingToBuy: string;

  // القسم 4: الأم والأسرة
  whoAttends: string[];
  momBehaviorDuringVisit: string;
  topThreeMomQuestions: string;
  momInquiriesFrequency: Record<string, string>; // الأسعار، شخصيات أخرى، كيدزي ميديا، التطبيق أو الموقع، خدمة العملاء
  pricingSentiment?: 'غالية جدا' | 'غالية' | 'معقولة' | 'لا توجد تعليقات' | string; // ما هي التعليقات التي تسمعينها غالبًا عن الأسعار
  customerServiceFeedback?: string; // ما هي تعليقات العملاء عن خدمة العملاء
  appWebsiteComplaints?: string;    // شكوى أو انزعاج من العملاء بخصوص التطبيق أو الموقع
  extraToysInCarAskOutOfTen?: number; // كم عشرة زيارات سألكِ أولياء الأمور عن توفر ألعاب إضافية في السيارة
  momsKnowTenMinLimit?: string;       // هل تعلم الأمهات أن وقت الزيارة 10 دقائق
  momsUnawareTenMinReaction?: string; // إذا كانت الإجابة لا صفي ردة فعلها
  primaryConversationPartner?: string; // أثناء الزيارة من الذي يتبادل معك الحديث أكثر
  momRepeatPromise: string;
  bestTimingForOffers: string;
  bestTimingForOffersReason: string;
  momDiscomfortMoments: string;
  photoVideoRequests: string;
  siblingsInterest: string;

  // القسم 5: المواقف الصعبة
  momOvertime: {
    frequency: number; // من 10
    requestedMinutes: number;
    staffAction: string;
    delayedNextVisit: string;
    paidExtensionExperience: string;
    wishedCompanyGuidance: string;
  };
  situations: Record<string, DifficultSituationAnswer>;
  otherDifficultSituations: string;

  // القسم 6: الفرص غير المستغلة
  unleveragedMomChildComments: string;
  potentialServices: string[];
  upcomingEventsNoticed: string;
  websiteWhatsappInquiries: string;
  frictionInProposing: string;
  oneMessageAboutKidzy: string;
  neighborsRelativesInterest: string;

  // القسم 7: الأدوات والتدريب والسلامة
  trainingFeedback: string;
  materialsNeeded: string;
  costumeHoursDaily: string;
  costumeDifficulty: string;
  safetyFeeling: string;
  emergencyPreparedness: string;
  costumeChangingSpace: string;
  selfIntroduction: string;

  // القسم 8: تقييم أفكار مقترحة
  ideasEvaluation: ProposedIdeaRating[];
  biggestRiskPerceived: string;

  // القسم 9: أسئلة مفتوحة
  bestVisitExperience: string;
  hardestVisitExperience: string;
  messageToLeadership: string;
  firstThingToChange: string;
  finalComments: string;

  // تسجيلات صوتية مسجلة
  voiceNotes?: VoiceNoteRecord[];
}

export interface PostVisitLog {
  id: string;
  timestamp: string;
  childAgeGroup: string;
  actualDurationMinutes: number;
  requestedExtraTime: boolean;
  extraTimeNotes?: string;
  topMomQuestion: string;
  pricingSentiment?: string;
  missedOpportunities: string[];
  atmosphereRating: number; // 1 to 5
  characterName?: string;
  staffNameOrCode?: string;
}

export interface MotherSurveyResponse {
  id: string;
  timestamp: string;
  experienceRating: number; // 1 to 5
  wasTenMinutesEnough: string;
  interestedInPaidExtension: string;
  pricingFeedback?: string;
  customerServiceSatisfaction?: string;
  appExperienceFeedback?: string;
  missingWishes: string;
  whatsappOptIn: boolean;
  whatsappPhone?: string;
}

// استبيان السائقين والتوصيل
export interface DriverSurveyResponse {
  id: string;
  submittedAt: string;
  driverNameOrCode: string;
  experiencePeriod: string;
  dailyDeliveriesAvg: number;
  vehicleType: string;
  commonDeliveryItems: string[]; // هدايا وصناديق, بالونات, كيك, باقات
  lateArrivalOutOfTen: number;
  lateArrivalReasons: string[];
  lateArrivalJustification: string;
  doorOpener: string; // من يفتح الباب
  clientRequiresEntry: string; // هل يطلب العميل الدخول للمنزل
  photoProofFrequencyOutOfTen: number; // كم من 10 يتم تصوير الاستلام
  pricingCommentsHeard: 'غالية جدا' | 'غالية' | 'معقولة' | 'لا توجد تعليقات' | string;
  appMapComplaints: string; // شكاوى التطبيق والموقع والخريطة
  customerServiceFeedback?: string; // تعليقات العملاء عن خدمة العملاء
  customerServiceSupportRating: number; // 1-5
  biggestRoadblock: string;
  suggestionsForOps: string;
}

// استبيان خدمة العملاء
export interface CustomerServiceSurveyResponse {
  id: string;
  submittedAt: string;
  agentNameOrCode: string;
  shiftType: string;
  dailyTicketsCount: number;
  topInquiryTypes: string[];
  pricingCommentsReceived: 'غالية جدا' | 'غالية' | 'معقولة' | 'لا توجد تعليقات' | string;
  commonClientComplaintsAboutCS: string[]; // تأخر في الرد, عدم الاستجابة, غيرها
  complaintsAboutCSDetails: string;
  appWebsiteComplaintsDetails: string; // عن ماذا يشتكون بالضبط في التطبيق
  cancellationReasons: string[];
  unservedDemands: string[]; // كيك مخصص, حفلات كاملة, إلخ
  toolsNeededToImprove: string;
  generalNotes: string;
}

// استبيان العمليات والتشغيل
export interface OperationsSurveyResponse {
  id: string;
  submittedAt: string;
  coordinatorNameOrCode: string;
  shiftType: string;
  dailyDispatchedVisits: number;
  scheduleAdherenceRating: number; // 1-5
  driverLatenessRateOutOfTen: number;
  mascotLatenessRateOutOfTen: number;
  primaryDispatchBottlenecks: string[]; // مسافات بين الأحياء, تأخر استلام الهدايا, تعديل مواعيد العملاء
  costumeReadinessAndMaintenance: string;
  appBookingIntegrationIssues: string;
  pricingFeedbackFromOperations: string;
  coordinationBetweenCSAndField: string;
  peakHoursStrategyFeedback: string;
  proposalsForLeadership: string;
}

export type SurveyTypeKey = 
  | 'post-visit-log'
  | 'staff-survey'
  | 'mother-survey'
  | 'drivers-survey'
  | 'customer-service-survey'
  | 'operations-survey';

export type ActiveAppTab = 
  | SurveyTypeKey
  | 'analytics'
  | 'digital-kpi'
  | 'ux-kpi'
  | 'media-kpi'
  | 'gas-studio';
