import React, { useState } from 'react';
import {
  PostVisitLog,
  StaffSurveyResponse,
  MotherSurveyResponse,
  DriverSurveyResponse,
  CustomerServiceSurveyResponse,
  OperationsSurveyResponse,
  SurveyTypeKey,
} from '../types/survey';
import { useLanguage } from '../context/LanguageContext';
import { KidzyMonogram, KidzyPatternDecor } from './KidzyBrandMark';
import { DIFFICULT_SITUATIONS, SURVEY_SECTIONS } from '../data/surveyQuestions';
import { calculateTimeAllocation, STAFF_REQUIRED_QUESTIONS } from '../utils/surveyLogic';
import {
  buildSurveySheetTable,
  countStaffRequiredAnswered,
  LEGACY_UNPUBLISHED_STAFF_KEYS,
  MOM_INQUIRY_TOPICS,
} from '../utils/sheetsSerializer';
import {
  FileText,
  FileSpreadsheet,
  ClipboardCheck,
  ClipboardList,
  Timer,
  HeartHandshake,
  Truck,
  Headphones,
  Compass,
  Search,
  Download,
  Eye,
  X,
  ChevronRight,
  ChevronLeft,
  Printer,
  Copy,
  Check,
  Clock,
  Trash2,
  LogIn,
  UserCheck,
} from 'lucide-react';

const FIELD_LABELS_AR: Record<string, string> = {
  // Common / Staff
  consent: 'الموافقة على المشاركة',
  workDuration: 'مدة العمل في الخدمة',
  dailyVisitsAvg: 'متوسط الزيارات اليومية',
  frequentCharacters: 'الشخصيات الأكثر ارتداءً',
  childAgeGroup: 'الفئة العمرية للطفل',
  frequentAreas: 'المناطق الأكثر زيارة',
  housingType: 'نوع المنزل غالبًا',
  doorOpener: 'من يفتح الباب غالبًا',
  firstMinuteDesc: 'وصف الدقيقة الأولى بعد الدخول',
  parentsReception: 'استقبال الأهل عادةً',
  prepTimeMinutes: 'وقت الدخول وتجهيز المكان',
  giftRecipient: 'من يستلم الهدية عادةً',
  seenCompetitorGifts: 'ملاحظة هدايا أو ألعاب من شركات أخرى',
  timeAllocation: 'توزيع الـ 10 دقائق (بالدقائق)',
  isTenMinutesEnough: 'كفاية الـ 10 دقائق (من 5)',
  isTenMinutesEnoughReason: 'سبب التقييم لكفاية الوقت',
  overflowFrequency: 'تكرار تجاوز الـ 10 دقائق (من 10)',
  overflowMinutesAvg: 'متوسط الدقائق الإضافية عند التجاوز',
  photoFrequencyOutOfTen: 'تصوير الشخصية مع الأطفال (من 10)',
  lateArrivalOutOfTen: 'معدل الوصول متأخرًا (من 10)',
  lateArrivalJustification: 'تبرير التأخير للعميل',
  lastTwoMinutesDesc: 'ماذا يحدث في آخر دقيقتين',
  bestMomentDesc: 'أجمل لحظة في الزيارة',
  worstMomentDesc: 'أكثر لحظة صعبة في الزيارة',
  childReactions: 'ردود فعل الطفل عند الدخول (من 10)',
  handlingScaredChild: 'التعامل مع الطفل الخائف أو الخجول',
  giftOpeningReaction: 'رد فعل الطفل عند فتح الهدية',
  childrenSpecialRequests: 'طلبات الأطفال الخاصة',
  otherChildrenGiftAskOutOfTen: 'سؤال بقية الأطفال عن هدايا لهم (من 10)',
  otherChildrenGiftReply: 'إجابة الموظفة على بقية الأطفال',
  observedInterests: 'اهتمامات الأطفال الملاحظة',
  handlingAttachmentOnLeave: 'التعامل مع تعلق الطفل عند المغادرة',
  childAskingToBuy: 'سؤال الطفل عن شراء أشياء أخرى',
  whoAttends: 'من يحضر الزيارة عادةً',
  momBehaviorDuringVisit: 'تصرف الأم أثناء الزيارة',
  topThreeMomQuestions: 'أكثر 3 أسئلة تسألها الأمهات',
  momInquiriesFrequency: 'تكرار أسئلة الأمهات حسب الموضوع',
  pricingSentiment: 'التعليقات الشائعة عن الأسعار',
  customerServiceFeedback: 'تعليقات العملاء عن خدمة العملاء',
  appWebsiteComplaints: 'شكاوى العملاء عن التطبيق أو الموقع',
  extraToysInCarAskOutOfTen: 'سؤال الأهل عن توفر ألعاب إضافية بالسيارة (من 10)',
  momsKnowTenMinLimit: 'هل تعلم الأمهات أن وقت الزيارة 10 دقائق؟',
  momsUnawareTenMinReaction: 'ردة فعل الأم عند عدم علمها بمدة الـ 10 دقائق',
  primaryConversationPartner: 'أكثر من يتبادل الحديث مع الشخصية',
  momRepeatPromise: 'تعبير الأم عن الرغبة بالتكرار',
  bestTimingForOffers: 'أفضل توقيت لاقتراح عروض جديدة',
  bestTimingForOffersReason: 'سبب اختيار هذا التوقيت',
  momDiscomfortMoments: 'لحظات انزعاج الأم',
  photoVideoRequests: 'طلبات التصوير والفيديو',
  siblingsInterest: 'اهتمام الإخوة بالزيارة',
  momOvertime: 'تفاصيل طلب الأم لوقت إضافي',
  situations: 'إجابات المواقف الصعبة',
  otherDifficultSituations: 'مواقف صعبة أخرى',
  unleveragedMomChildComments: 'ملاحظات غير مستغلة من الأم والطفل',
  potentialServices: 'ما يمكن تقديمه للأسرة حاليًا',
  upcomingEventsNoticed: 'مناسبات قادمة تم رصدها',
  websiteWhatsappInquiries: 'استفسارات الموقع والواتساب',
  frictionInProposing: 'صعوبات اقتراح خدمات جديدة',
  oneMessageAboutKidzy: 'رسالة قصيرة تختصر كيدزي',
  neighborsRelativesInterest: 'اهتمام الجيران والأقارب',
  trainingFeedback: 'ملاحظات التدريب',
  materialsNeeded: 'أدوات ومواد مطلوبة للميدان',
  costumeHoursDaily: 'ساعات ارتداء الزي يوميًا',
  costumeDifficulty: 'أصعب ما في ارتداء الزي',
  safetyFeeling: 'الشعور بالأمان الميداني',
  emergencyPreparedness: 'الاستعداد لحالات الطوارئ',
  costumeChangingSpace: 'مكان تبديل الزي',
  selfIntroduction: 'طريقة التعريف بالنفس',
  ideasEvaluation: 'تقييم الأفكار المقترحة',
  biggestRiskPerceived: 'أكبر مخاطرة متوقعة',
  bestVisitExperience: 'أفضل تجربة زيارة مرت بك',
  hardestVisitExperience: 'أصعب تجربة زيارة مرت بك',
  messageToLeadership: 'رسالة للإدارة',
  firstThingToChange: 'أول شيء تقترحين تغييره',
  finalComments: 'ملاحظات ختامية',
  voiceNotes: 'التسجيلات الصوتية',
  // Post-visit log
  characterName: 'اسم الشخصية',
  staffNameOrCode: 'الموظفة / الكود',
  actualDurationMinutes: 'المدة الفعلية (دقائق)',
  requestedExtraTime: 'هل طُلب وقت إضافي؟',
  extraTimeNotes: 'ملاحظات الوقت الإضافي',
  topMomQuestion: 'أبرز سؤال سألته الأم',
  missedOpportunities: 'فرص لم يُستفد منها',
  atmosphereRating: 'تقييم الأجواء (من 5)',
  // Mother survey
  experienceRating: 'تقييم تجربة الزيارة (من 5)',
  wasTenMinutesEnough: 'هل كانت الـ 10 دقائق كافية؟',
  interestedInPaidExtension: 'الاهتمام بتمديد مدفوع',
  pricingFeedback: 'انطباع الأم عن الأسعار',
  customerServiceSatisfaction: 'تقييم خدمة العملاء',
  appExperienceFeedback: 'تجربة التطبيق أو الموقع',
  missingWishes: 'أمنيات ومقترحات إضافية',
  whatsappOptIn: 'الموافقة على رسائل واتساب',
  whatsappPhone: 'رقم واتساب',
  // Driver survey
  driverNameOrCode: 'كود أو اسم السائق',
  experiencePeriod: 'مدة العمل في التوصيل',
  dailyDeliveriesAvg: 'متوسط الطلبات اليومية',
  vehicleType: 'نوع المركبة',
  commonDeliveryItems: 'نوع الطلبات الموصلة بدون شخصيات',
  lateArrivalReasons: 'أسباب التأخير الميدانية',
  clientRequiresEntry: 'هل يطلب العميل الدخول للمنزل؟',
  photoProofFrequencyOutOfTen: 'تصوير استلام الهدية/الطفل (من 10)',
  pricingCommentsHeard: 'انطباع العملاء عن الأسعار',
  appMapComplaints: 'شكاوى التطبيق والخرائط والموقع',
  customerServiceSupportRating: 'تقييم دعم خدمة العملاء للسائق (من 5)',
  biggestRoadblock: 'أكبر عائق في التوصيل',
  suggestionsForOps: 'مقترحات لإدارة العمليات',
  // Customer Service
  agentNameOrCode: 'اسم أو كود ممثل خدمة العملاء',
  shiftType: 'فترة الوردية',
  dailyTicketsCount: 'متوسط المحادثات اليومية',
  topInquiryTypes: 'الاستفسارات الأكثر تكرارًا',
  pricingCommentsReceived: 'انطباع العملاء عن الأسعار',
  commonClientComplaintsAboutCS: 'شكاوى العملاء عن خدمة العملاء',
  complaintsAboutCSDetails: 'تفاصيل شكاوى خدمة العملاء',
  appWebsiteComplaintsDetails: 'شكاوى العملاء من التطبيق والموقع بالتفصيل',
  cancellationReasons: 'أسباب الإلغاء الشائعة',
  unservedDemands: 'طلبات متكررة غير متوفرة',
  toolsNeededToImprove: 'أدوات وصلاحيات مطلوبة للتحسين',
  generalNotes: 'ملاحظات عامة',
  // Operations
  coordinatorNameOrCode: 'اسم أو كود مشرف التشغيل',
  dailyDispatchedVisits: 'الطلبات الموزعة في الوردية',
  scheduleAdherenceRating: 'تقييم الالتزام بالجدول (من 5)',
  driverLatenessRateOutOfTen: 'معدل تأخير السائقين (من 10)',
  mascotLatenessRateOutOfTen: 'معدل تأخير الشخصيات (من 10)',
  primaryDispatchBottlenecks: 'أبرز اختناقات التوجيه الميداني',
  costumeReadinessAndMaintenance: 'جاهزية وصيانة أزياء الشخصيات',
  appBookingIntegrationIssues: 'مشاكل تكامل التطبيق والتوجيه',
  pricingFeedbackFromOperations: 'رؤية التشغيل حول الأسعار',
  coordinationBetweenCSAndField: 'التنسيق بين خدمة العملاء والميدان',
  peakHoursStrategyFeedback: 'مقترحات التعامل مع أوقات الذروة',
  proposalsForLeadership: 'مقترحات للإدارة',
};

const FIELD_LABELS_EN: Record<string, string> = {
  consent: 'Participation Consent',
  workDuration: 'Tenure',
  dailyVisitsAvg: 'Avg Daily Visits',
  frequentCharacters: 'Most Worn Characters',
  childAgeGroup: 'Child Age Group',
  frequentAreas: 'Frequent Areas',
  housingType: 'Home / Venue Type',
  doorOpener: 'Who Usually Opens the Door',
  firstMinuteDesc: 'First Minute Description',
  parentsReception: 'Parents Welcome',
  prepTimeMinutes: 'Prep Time',
  giftRecipient: 'Usual Gift Recipient',
  seenCompetitorGifts: 'Competitor Gifts Observed',
  timeAllocation: '10-Min Breakdown (mins)',
  isTenMinutesEnough: '10-Min Sufficiency (out of 5)',
  isTenMinutesEnoughReason: 'Reason for Time Rating',
  overflowFrequency: 'Overtime Frequency (out of 10)',
  overflowMinutesAvg: 'Avg Overtime Minutes',
  photoFrequencyOutOfTen: 'Character Photo Frequency (out of 10)',
  lateArrivalOutOfTen: 'Late Arrival Rate (out of 10)',
  lateArrivalJustification: 'Delay Justification',
  lastTwoMinutesDesc: 'Last 2 Minutes Description',
  bestMomentDesc: 'Best Moment',
  worstMomentDesc: 'Hardest Moment',
  childReactions: 'Child Arrival Reactions (out of 10)',
  handlingScaredChild: 'Handling Scared / Shy Child',
  giftOpeningReaction: 'Gift Opening Reaction',
  childrenSpecialRequests: 'Children Special Requests',
  otherChildrenGiftAskOutOfTen: 'Other Kids Asking for Gifts (out of 10)',
  otherChildrenGiftReply: 'Reply to Other Children',
  observedInterests: 'Observed Child Interests',
  handlingAttachmentOnLeave: 'Handling Attachment on Exit',
  childAskingToBuy: 'Child Asking to Buy Items',
  whoAttends: 'Who Attends',
  momBehaviorDuringVisit: 'Mom Behavior During Visit',
  topThreeMomQuestions: 'Top 3 Mother Questions',
  momInquiriesFrequency: 'Topic Inquiry Frequency',
  pricingSentiment: 'Common Pricing Comments',
  customerServiceFeedback: 'Customer Service Feedback',
  appWebsiteComplaints: 'App / Website Complaints',
  extraToysInCarAskOutOfTen: 'Extra Toys in Car Asks (out of 10)',
  momsKnowTenMinLimit: 'Do Mothers Know 10-Min Limit?',
  momsUnawareTenMinReaction: 'Reaction If Unaware of 10-Min Limit',
  primaryConversationPartner: 'Primary Conversation Partner',
  momRepeatPromise: 'Mother Repeat Intent',
  bestTimingForOffers: 'Best Timing for Offers',
  bestTimingForOffersReason: 'Reason for Offer Timing',
  momDiscomfortMoments: 'Mom Discomfort Moments',
  photoVideoRequests: 'Photo & Video Requests',
  siblingsInterest: 'Siblings Interest',
  momOvertime: 'Mom Overtime Details',
  situations: 'Difficult Situations Answers',
  otherDifficultSituations: 'Other Difficult Situations',
  unleveragedMomChildComments: 'Untapped Family Comments',
  potentialServices: 'Potential Services to Offer',
  upcomingEventsNoticed: 'Upcoming Events Noticed',
  websiteWhatsappInquiries: 'Website / WhatsApp Inquiries',
  frictionInProposing: 'Friction in Proposing Extras',
  oneMessageAboutKidzy: 'One Message for Mothers',
  neighborsRelativesInterest: 'Neighbors & Relatives Interest',
  trainingFeedback: 'Training Feedback',
  materialsNeeded: 'Materials Needed',
  costumeHoursDaily: 'Costume Hours Daily',
  costumeDifficulty: 'Costume Challenges',
  safetyFeeling: 'Safety Feeling',
  emergencyPreparedness: 'Emergency Preparedness',
  costumeChangingSpace: 'Costume Changing Space',
  selfIntroduction: 'Self Introduction',
  ideasEvaluation: 'Ideas Evaluation',
  biggestRiskPerceived: 'Biggest Perceived Risk',
  bestVisitExperience: 'Best Visit Experience',
  hardestVisitExperience: 'Hardest Visit Experience',
  messageToLeadership: 'Message to Leadership',
  firstThingToChange: 'First Thing to Change',
  finalComments: 'Final Comments',
  voiceNotes: 'Voice Notes',
  characterName: 'Character Name',
  staffNameOrCode: 'Staff Name / Code',
  actualDurationMinutes: 'Actual Duration (mins)',
  requestedExtraTime: 'Requested Extra Time?',
  extraTimeNotes: 'Extra Time Notes',
  topMomQuestion: 'Top Mom Question',
  missedOpportunities: 'Missed Opportunities',
  atmosphereRating: 'Atmosphere Rating (1-5)',
  experienceRating: 'Experience Rating (1-5)',
  wasTenMinutesEnough: 'Were 10 Mins Enough?',
  interestedInPaidExtension: 'Paid Extension Interest',
  pricingFeedback: 'Mother Pricing Impression',
  customerServiceSatisfaction: 'Customer Service Satisfaction',
  appExperienceFeedback: 'App / Website Experience',
  missingWishes: 'Missing Wishes / Suggestions',
  whatsappOptIn: 'WhatsApp Opt-In',
  whatsappPhone: 'WhatsApp Number',
  driverNameOrCode: 'Driver Name / Code',
  experiencePeriod: 'Delivery Tenure',
  dailyDeliveriesAvg: 'Avg Daily Deliveries',
  vehicleType: 'Vehicle Type',
  commonDeliveryItems: 'Common Non-Character Items',
  lateArrivalReasons: 'Field Delay Reasons',
  clientRequiresEntry: 'Client Requests Home Entry?',
  photoProofFrequencyOutOfTen: 'Delivery Photo Rate (out of 10)',
  pricingCommentsHeard: 'Pricing Comments Heard',
  appMapComplaints: 'App & Map Complaints',
  customerServiceSupportRating: 'CS Support for Driver (1-5)',
  biggestRoadblock: 'Biggest Roadblock',
  suggestionsForOps: 'Suggestions for Ops',
  agentNameOrCode: 'Agent Name / Code',
  shiftType: 'Shift Type',
  dailyTicketsCount: 'Daily Tickets / Chats',
  topInquiryTypes: 'Top Inquiry Types',
  pricingCommentsReceived: 'Pricing Comments Received',
  commonClientComplaintsAboutCS: 'Common CS Complaints',
  complaintsAboutCSDetails: 'CS Complaints Details',
  appWebsiteComplaintsDetails: 'App & Website Complaints Details',
  cancellationReasons: 'Cancellation Reasons',
  unservedDemands: 'Unserved Demands',
  toolsNeededToImprove: 'Tools Needed to Improve',
  generalNotes: 'General Notes',
  coordinatorNameOrCode: 'Coordinator Name / Code',
  dailyDispatchedVisits: 'Daily Dispatched Orders',
  scheduleAdherenceRating: 'Schedule Adherence (1-5)',
  driverLatenessRateOutOfTen: 'Driver Lateness Rate (out of 10)',
  mascotLatenessRateOutOfTen: 'Character Lateness Rate (out of 10)',
  primaryDispatchBottlenecks: 'Primary Dispatch Bottlenecks',
  costumeReadinessAndMaintenance: 'Costume Readiness & Maintenance',
  appBookingIntegrationIssues: 'App Dispatch Integration Issues',
  pricingFeedbackFromOperations: 'Ops Pricing Perspective',
  coordinationBetweenCSAndField: 'CS & Field Coordination',
  peakHoursStrategyFeedback: 'Peak Hours Feedback',
  proposalsForLeadership: 'Proposals for Leadership',
};

interface IndividualResponsesExplorerProps {
  postVisitLogs: PostVisitLog[];
  staffSurveys: StaffSurveyResponse[];
  motherSurveys: MotherSurveyResponse[];
  driverSurveys?: DriverSurveyResponse[];
  csSurveys?: CustomerServiceSurveyResponse[];
  opsSurveys?: OperationsSurveyResponse[];
  isAdminAuthenticated?: boolean;
  onOpenAdminLogin?: () => void;
  onDeleteResponse?: (surveyType: SurveyTypeKey, id: string) => Promise<void>;
  onSyncToSheets?: (surveyType: SurveyTypeKey) => void;
  onOpenStaffReview?: () => void;
}

export const IndividualResponsesExplorer: React.FC<IndividualResponsesExplorerProps> = ({
  postVisitLogs,
  staffSurveys,
  motherSurveys,
  driverSurveys = [],
  csSurveys = [],
  opsSurveys = [],
  isAdminAuthenticated = false,
  onOpenAdminLogin,
  onDeleteResponse,
  onSyncToSheets,
  onOpenStaffReview,
}) => {
  const { lang, dir, t } = useLanguage();
  const [selectedSurveyType, setSelectedSurveyType] = useState<SurveyTypeKey>('staff-survey');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const labelMap = lang === 'en' ? FIELD_LABELS_EN : FIELD_LABELS_AR;

  const formatValue = (val: unknown): string => {
    if (val === true) return t('نعم', 'Yes');
    if (val === false) return t('لا', 'No');
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  const surveyTabs: {
    key: SurveyTypeKey;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: 'staff-survey', label: t('استبيان الشخصيات', 'Staff Survey'), count: staffSurveys.length, icon: ClipboardList },
    { key: 'post-visit-log', label: t('مذكرات الزيارة (30ث)', 'Post-Visit Logs'), count: postVisitLogs.length, icon: Timer },
    { key: 'mother-survey', label: t('استبيان الأمهات', 'Mothers Survey'), count: motherSurveys.length, icon: HeartHandshake },
    { key: 'drivers-survey', label: t('استبيان السائقين', 'Drivers Survey'), count: driverSurveys.length, icon: Truck },
    { key: 'customer-service-survey', label: t('خدمة العملاء', 'Customer Service'), count: csSurveys.length, icon: Headphones },
    { key: 'operations-survey', label: t('العمليات والتشغيل', 'Operations'), count: opsSurveys.length, icon: Compass },
  ];

  const getCurrentDataset = () => {
    switch (selectedSurveyType) {
      case 'staff-survey':
        return staffSurveys;
      case 'post-visit-log':
        return postVisitLogs;
      case 'mother-survey':
        return motherSurveys;
      case 'drivers-survey':
        return driverSurveys;
      case 'customer-service-survey':
        return csSurveys;
      case 'operations-survey':
        return opsSurveys;
      default:
        return [];
    }
  };

  const currentDataset = getCurrentDataset();

  const filteredDataset = currentDataset.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return JSON.stringify(item).toLowerCase().includes(q);
  });

  const exportToCSV = () => {
    if (filteredDataset.length === 0) return;
    const { headers, rows } = buildSurveySheetTable(selectedSurveyType, filteredDataset, lang);
    const escapeCell = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvRows = [
      headers.map(escapeCell).join(','),
      ...rows.map((r) => r.map(escapeCell).join(',')),
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kidzy_kpis_${selectedSurveyType}_Responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(filteredDataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kidzy_kpis_${selectedSurveyType}_Responses.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeDetailItem: any =
    selectedResponseIndex !== null ? filteredDataset[selectedResponseIndex] : null;

  const handleCopyDetails = () => {
    if (!activeDetailItem) return;
    navigator.clipboard.writeText(JSON.stringify(activeDetailItem, null, 2));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={dir}>
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#063B44] via-[#005866] to-[#007C8D] text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-[#FEC448] text-[#063B44] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <FileText className="w-3.5 h-3.5" />
                {t('مستكشف الاستجابات الفردية', 'Individual Responses Explorer')}
              </span>
              <span className="text-[#BAEBF1] text-xs">
                {t(
                  'مطالعة ردود كل موظفة وسائق وأم وممثل خدمة عملاء بشكل مفصل',
                  'Review individual submissions across all roles in full detail'
                )}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {t('سجل الاستجابات الفردية الكاملة', 'Complete Response Registry')}
            </h2>
            <p className="text-slate-100/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {t(
                'من هنا يمكنك تصفح كل استبيان تم إرساله بشكل فردي، مراجعة الإجابات بالتفصيل، أو تصدير البيانات إلى CSV / JSON.',
                'Browse every submitted response individually, inspect all answers, and export records to Excel CSV or JSON.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {selectedSurveyType === 'staff-survey' && onOpenStaffReview && (
              <button
                type="button"
                onClick={onOpenStaffReview}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white text-[#063B44] hover:bg-[#FEF4E3] rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4 text-[#007C8D]" />
                <span>{t('مراجعة استبيان الشخصيات', 'Staff Survey Review')}</span>
              </button>
            )}

            {onSyncToSheets && (
              <button
                type="button"
                onClick={() => onSyncToSheets(selectedSurveyType)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#FEC448] hover:bg-[#f5b62f] text-[#063B44] rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{t('مزامنة Google Sheets', 'Sync Google Sheets')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={exportToCSV}
              disabled={filteredDataset.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#BAEBF1]" />
              <span>{t('تصدير Excel (CSV)', 'Export CSV')}</span>
            </button>

            <button
              type="button"
              onClick={exportToJSON}
              disabled={filteredDataset.length === 0}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#FEC448]" />
              <span>{t('تصدير JSON', 'Export JSON')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Survey Category Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {surveyTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedSurveyType === tab.key;
          return (
            <button
              type="button"
              key={tab.key}
              onClick={() => {
                setSelectedSurveyType(tab.key);
                setSelectedResponseIndex(null);
              }}
              className={`p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                dir === 'rtl' ? 'text-right' : 'text-left'
              } ${
                isSelected
                  ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-md scale-[1.02]'
                  : 'bg-white text-[#063B44] border-[#BAEBF1] hover:bg-[#BAEBF1]/25'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FEC448]' : 'text-[#007C8D]'}`} />
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#BAEBF1]/45 text-[#063B44]'
                  }`}
                >
                  {tab.count}
                </span>
              </div>
              <span className="text-xs font-bold leading-tight line-clamp-1">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar & Result Count */}
      <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#063B44]">
            {t('عدد الاستجابات المتوفرة:', 'Matching Responses:')}
          </span>
          <span className="text-xs font-mono font-bold bg-[#BAEBF1]/50 text-[#063B44] px-2 py-0.5 rounded-md tabular-nums">
            {t(`${filteredDataset.length} استجابة`, `${filteredDataset.length} responses`)}
          </span>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search
            className={`w-4 h-4 text-[#007C8D]/70 absolute top-1/2 -translate-y-1/2 ${
              dir === 'rtl' ? 'right-3.5' : 'left-3.5'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'بحث في الإجابات أو أسماء الشخصيات أو التبريرات...',
              'Search inside responses, characters, or comments...'
            )}
            className={`w-full py-2 text-xs bg-[#F7FAFB] border border-slate-300 text-[#063B44] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01AFC5] ${
              dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
        </div>
      </div>

      {/* Guest Mode Explorer Banner */}
      {!isAdminAuthenticated && (
        <div className="bg-[#FEF4E3] border border-[#FEC448]/70 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#063B44]">
            <UserCheck className="w-4 h-4 text-[#007C8D] shrink-0" />
            <span>
              {t(
                'استعراض الاستجابات كزائر نشط — الاستجابات المعروضة حية ومباشرة من السحابة بدون تسجيل دخول.',
                'Active Guest Response Explorer — Live cloud submissions are loaded directly without sign-in.'
              )}
            </span>
          </div>
          {onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-xs font-bold text-[#007C8D] hover:text-[#063B44] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('دخول المشرف للحذف والإدارة', 'Admin Login')}</span>
            </button>
          )}
        </div>
      )}

      {/* Responses List / Grid */}
      {filteredDataset.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#BAEBF1] p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 mx-auto text-[#01AFC5]/40 mb-3" />
          <p className="font-bold text-sm text-[#063B44]">
            {searchQuery.trim()
              ? t('لا توجد استجابات تطابق عبارة البحث الحالية.', 'No responses match your current search.')
              : t('لا توجد استجابات فعلية مسجلة في هذا القسم حتى الآن.', 'No live submissions in this category yet.')}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery.trim()
              ? t('جرّب مسح نص البحث أو اختيار فئة استبيان أخرى.', 'Try clearing your search or selecting another survey.')
              : t(
                  'فور إرسال أي مشارك للرد عبر الرابط المخصص له، سيظهر هنا تلقائيًا في الوقت الفعلي.',
                  'New submissions sent through shared links will appear here automatically in real time.'
                )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {filteredDataset.map((item: any, index: number) => {
            const dateStr = item.submittedAt || item.timestamp || '';
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleString(lang === 'en' ? 'en-US' : 'ar-SA', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : t('اليوم', 'Today');

            let primaryTitle = t(`استجابة رقم #${index + 1}`, `Response #${index + 1}`);
            let badgeText = item.id || `ID-${index + 1}`;
            let highlights: { label: string; val: string }[] = [];

            if (selectedSurveyType === 'staff-survey') {
              const typedStaff = item as StaffSurveyResponse;
              const reqDone = countStaffRequiredAnswered(typedStaff);
              primaryTitle =
                typedStaff.frequentAreas?.trim() ||
                typedStaff.housingType?.trim() ||
                t('استجابة موظفة شخصيات', 'Character Staff Response');
              badgeText = `${reqDone}/${STAFF_REQUIRED_QUESTIONS.length} * · ${
                typedStaff.workDuration || t('موظفة', 'Staff')
              }`;
              highlights = [
                {
                  label: t('كفاية الـ10 دقائق · الزيارات', '10m Rating · Visits'),
                  val: `${typedStaff.isTenMinutesEnough ?? '—'}/5 · ${typedStaff.dailyVisitsAvg ?? 0}/d`,
                },
                {
                  label: t('التصوير · التأخير', 'Photo · Late'),
                  val: `${typedStaff.photoFrequencyOutOfTen ?? '—'}/10 · ${typedStaff.lateArrivalOutOfTen ?? '—'}/10`,
                },
                {
                  label: t('وعي الـ10د · الأسعار', '10m Aware · Price'),
                  val: `${typedStaff.momsKnowTenMinLimit || '—'} · ${typedStaff.pricingSentiment || '—'}`,
                },
              ];
            } else if (selectedSurveyType === 'post-visit-log') {
              primaryTitle = item.characterName || t('مذكرة زيارة', 'Visit Log');
              badgeText = item.staffNameOrCode || t('موظفة', 'Staff');
              highlights = [
                {
                  label: t('المدة الفعلية', 'Actual Duration'),
                  val: t(`${item.actualDurationMinutes} دقائق`, `${item.actualDurationMinutes}m`),
                },
                {
                  label: t('طلب وقت إضافي', 'Extra Time Asked'),
                  val: item.requestedExtraTime ? t('نعم طلبت الأم', 'Yes') : t('لا', 'No'),
                },
                { label: t('الأجواء', 'Atmosphere'), val: `★ ${item.atmosphereRating}/5` },
              ];
            } else if (selectedSurveyType === 'mother-survey') {
              primaryTitle = t('أم لزيارة كيدزي', 'Family Visit Feedback');
              badgeText = item.whatsappPhone ? `${item.whatsappPhone}` : t('زيارة عائلية', 'Home Visit');
              highlights = [
                { label: t('التقييم العام', 'Overall Rating'), val: `★ ${item.experienceRating}/5` },
                { label: t('كفاية الوقت', 'Time Enough'), val: item.wasTenMinutesEnough || '—' },
                { label: t('تمديد مدفوع', 'Paid Extension'), val: item.interestedInPaidExtension || '—' },
              ];
            } else if (selectedSurveyType === 'drivers-survey') {
              primaryTitle = item.driverNameOrCode || t('كابتن توصيل', 'Delivery Driver');
              badgeText = item.vehicleType || t('سائق', 'Driver');
              highlights = [
                { label: t('الطلبات اليومية', 'Daily Orders'), val: `${item.dailyDeliveriesAvg}` },
                { label: t('معدل التأخير', 'Late Rate'), val: `${item.lateArrivalOutOfTen}/10` },
                { label: t('توثيق الصور', 'Photo Proof'), val: `${item.photoProofFrequencyOutOfTen}/10` },
              ];
            } else if (selectedSurveyType === 'customer-service-survey') {
              primaryTitle = item.agentNameOrCode || t('ممثل خدمة عملاء', 'CS Agent');
              badgeText = item.shiftType || t('دعم عملاء', 'Support');
              highlights = [
                { label: t('التذاكر اليومية', 'Daily Tickets'), val: `${item.dailyTicketsCount}` },
                { label: t('انطباع الأسعار', 'Pricing'), val: item.pricingCommentsReceived || '—' },
                {
                  label: t('أبرز الشكاوى', 'Top Complaint'),
                  val: item.commonClientComplaintsAboutCS?.[0] || '—',
                },
              ];
            } else if (selectedSurveyType === 'operations-survey') {
              primaryTitle = item.coordinatorNameOrCode || t('منسق العمليات', 'Ops Coordinator');
              badgeText = item.shiftType || t('تشغيل', 'Operations');
              highlights = [
                { label: t('الطلبات الموزعة', 'Dispatched'), val: `${item.dailyDispatchedVisits}` },
                { label: t('تأخير السائقين', 'Driver Late'), val: `${item.driverLatenessRateOutOfTen}/10` },
                { label: t('تأخير الشخصيات', 'Staff Late'), val: `${item.mascotLatenessRateOutOfTen}/10` },
              ];
            }

            return (
              <div
                key={item.id || index}
                className="bg-white rounded-3xl border border-[#BAEBF1] p-5 shadow-xs hover:shadow-md hover:border-[#01AFC5] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold bg-[#BAEBF1]/40 text-[#063B44] px-2.5 py-0.5 rounded-full border border-[#BAEBF1]">
                      {badgeText}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3" />
                      {formattedDate}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#063B44] mb-3">{primaryTitle}</h3>

                  <div className="space-y-1.5 p-3 bg-[#F7FAFB] rounded-2xl mb-4 border border-[#BAEBF1]/60">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex justify-between items-center text-xs gap-2">
                        <span className="text-slate-500 font-medium">{h.label}:</span>
                        <span className="font-bold text-[#063B44] font-mono tabular-nums truncate">{h.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedResponseIndex(index)}
                  className="w-full py-2.5 px-3 bg-[#BAEBF1]/35 hover:bg-[#BAEBF1]/60 text-[#063B44] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#007C8D]" />
                  <span>{t('مطالعة الاستجابة بالكامل', 'Inspect Full Response')}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL RESPONSE MODAL */}
      {selectedResponseIndex !== null && activeDetailItem && (
        <div className="fixed inset-0 z-50 bg-[#063B44]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className={`bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#BAEBF1] overflow-hidden ${
              dir === 'rtl' ? 'text-right' : 'text-left'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#063B44] text-white flex items-center justify-between border-b border-[#005866]">
              <div className="flex items-center gap-3">
                <KidzyMonogram variant="tile-teal" size={40} />
                <div>
                  <h3 className="text-base font-bold">
                    {t('تفاصيل الاستجابة الفردية الكاملة', 'Full Response Details')}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#BAEBF1] tabular-nums">
                    <span>
                      {t(
                        `الاستجابة ${selectedResponseIndex + 1} من ${filteredDataset.length}`,
                        `Response ${selectedResponseIndex + 1} of ${filteredDataset.length}`
                      )}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{activeDetailItem.id || 'auto'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
                  title={t('طباعة الاستجابة', 'Print Response')}
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyDetails}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
                  title={t('نسخ تفاصيل الرد', 'Copy JSON')}
                >
                  {copiedText ? <Check className="w-4 h-4 text-[#FEC448]" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedResponseIndex(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
                  aria-label={t('إغلاق', 'Close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Bar between responses */}
            <div className="bg-[#F7FAFB] px-6 py-2.5 flex items-center justify-between text-xs border-b border-[#BAEBF1]">
              <button
                type="button"
                disabled={selectedResponseIndex === 0}
                onClick={() => setSelectedResponseIndex(selectedResponseIndex - 1)}
                className="flex items-center gap-1 font-bold text-[#063B44] hover:text-[#007C8D] disabled:opacity-30 cursor-pointer"
              >
                {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{t('الاستجابة السابقة', 'Previous')}</span>
              </button>

              <span className="text-xs text-[#007C8D] font-bold font-mono tabular-nums">
                {selectedResponseIndex + 1} / {filteredDataset.length}
              </span>

              <button
                type="button"
                disabled={selectedResponseIndex === filteredDataset.length - 1}
                onClick={() => setSelectedResponseIndex(selectedResponseIndex + 1)}
                className="flex items-center gap-1 font-bold text-[#063B44] hover:text-[#007C8D] disabled:opacity-30 cursor-pointer"
              >
                <span>{t('الاستجابة التالية', 'Next')}</span>
                {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-[#BAEBF1]/70 text-xs">
                <div className="p-3 bg-[#FEF4E3]/80 rounded-xl border border-[#FEC448]/60">
                  <span className="text-[#007C8D] block mb-0.5 font-medium">
                    {t('تاريخ وتوقيت الإرسال:', 'Submitted At:')}
                  </span>
                  <span className="font-bold text-[#063B44] font-mono">
                    {activeDetailItem.submittedAt || activeDetailItem.timestamp || '—'}
                  </span>
                </div>
                <div className="p-3 bg-[#FEF4E3]/80 rounded-xl border border-[#FEC448]/60">
                  <span className="text-[#007C8D] block mb-0.5 font-medium">
                    {t('المعرف أو الكود:', 'ID / Code:')}
                  </span>
                  <span className="font-bold text-[#063B44] font-mono">
                    {activeDetailItem.id ||
                      activeDetailItem.staffNameOrCode ||
                      activeDetailItem.driverNameOrCode ||
                      '—'}
                  </span>
                </div>
              </div>

              {selectedSurveyType === 'staff-survey' ? (() => {
                const staff = activeDetailItem as StaffSurveyResponse;
                const reqDone = countStaffRequiredAnswered(staff);
                const alloc = calculateTimeAllocation(
                  staff.timeAllocation || { entrance: 0, gift: 0, play: 0, photos: 0, farewell: 0 }
                );
                const secMeta = (num: number) => SURVEY_SECTIONS.find((s) => s.id === num);
                const renderRow = (fieldKey: string, rawVal: unknown) => (
                  <div
                    key={fieldKey}
                    className="p-3 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-[#007C8D] min-w-[210px]">
                      {labelMap[fieldKey] || fieldKey}:
                    </span>
                    <span
                      className={`text-xs font-semibold text-[#063B44] bg-white px-3 py-1.5 rounded-lg border border-[#BAEBF1] flex-1 ${
                        dir === 'rtl' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatValue(rawVal)}
                    </span>
                  </div>
                );
                const renderChips = (fieldKey: string, itemsList?: string[]) => (
                  <div key={fieldKey} className="p-3.5 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/80">
                    <span className="text-xs font-bold text-[#007C8D] block mb-2">
                      {labelMap[fieldKey] || fieldKey}:
                    </span>
                    {!itemsList || itemsList.length === 0 ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {itemsList.map((entry, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-semibold bg-white text-[#063B44] px-2.5 py-1 rounded-lg border border-[#BAEBF1]"
                          >
                            {entry}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
                const renderSectionHeader = (num: number) => {
                  const sec = secMeta(num);
                  return (
                    <div className="pt-2 pb-1 border-b border-[#BAEBF1] flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-black text-[#063B44]">
                        {lang === 'en' ? sec?.titleEn : sec?.title}
                      </h4>
                    </div>
                  );
                };

                const legacyNonEmptyEntries = Array.from(LEGACY_UNPUBLISHED_STAFF_KEYS)
                  .map((k) => [k, (staff as unknown as Record<string, unknown>)[k]] as const)
                  .filter(([, v]) => {
                    if (Array.isArray(v)) return v.length > 0;
                    return v !== undefined && v !== null && String(v).trim() !== '';
                  });

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-3 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1] flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">{t('الأسئلة الإلزامية (*)', 'Required (*)')}</span>
                        <span className="font-mono font-black text-[#063B44] tabular-nums">
                          {reqDone}/{STAFF_REQUIRED_QUESTIONS.length}
                        </span>
                      </div>
                      <div className="p-3 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1] flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">{t('توزيع الـ 10 دقائق', '10m Breakdown')}</span>
                        <span className="font-mono font-black text-[#007C8D] tabular-nums">
                          {alloc.total} / 10 {t('د', 'm')}
                        </span>
                      </div>
                      <div className="p-3 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1] flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">{t('الموافقة', 'Consent')}</span>
                        <span className="font-bold text-[#063B44]">{formatValue(staff.consent)}</span>
                      </div>
                    </div>

                    {/* Section 1 */}
                    {renderSectionHeader(1)}
                    <div className="space-y-2">
                      {renderRow('workDuration', staff.workDuration)}
                      {renderRow('dailyVisitsAvg', staff.dailyVisitsAvg)}
                      {renderRow('childAgeGroup', staff.childAgeGroup)}
                      {renderRow('frequentAreas', staff.frequentAreas)}
                      {renderRow('housingType', staff.housingType)}
                      {renderRow('doorOpener', staff.doorOpener)}
                    </div>

                    {/* Section 2 */}
                    {renderSectionHeader(2)}
                    <div className="space-y-2">
                      {renderRow('firstMinuteDesc', staff.firstMinuteDesc)}
                      {renderRow('parentsReception', staff.parentsReception)}
                      {renderRow('giftRecipient', staff.giftRecipient)}
                      {renderRow('seenCompetitorGifts', staff.seenCompetitorGifts)}
                      <div className="p-3.5 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#007C8D]">{labelMap.timeAllocation}:</span>
                          <span className="font-mono font-bold text-[#063B44] tabular-nums">
                            {alloc.total} / 10 {t('دقائق', 'mins')}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {[
                            { l: t('دخول', 'Enter'), v: staff.timeAllocation?.entrance ?? 0 },
                            { l: t('هدية', 'Gift'), v: staff.timeAllocation?.gift ?? 0 },
                            { l: t('لعب', 'Play'), v: staff.timeAllocation?.play ?? 0 },
                            { l: t('صور', 'Photo'), v: staff.timeAllocation?.photos ?? 0 },
                            { l: t('وداع', 'Exit'), v: staff.timeAllocation?.farewell ?? 0 },
                          ].map((cell) => (
                            <div key={cell.l} className="p-2 bg-white rounded-lg border border-[#BAEBF1]">
                              <span className="text-[11px] text-slate-500 block">{cell.l}</span>
                              <span className="text-sm font-black text-[#063B44] font-mono tabular-nums">{cell.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {renderRow('isTenMinutesEnough', staff.isTenMinutesEnough)}
                      {renderRow('isTenMinutesEnoughReason', staff.isTenMinutesEnoughReason)}
                      {renderRow('overflowFrequency', staff.overflowFrequency)}
                      {renderRow('overflowMinutesAvg', staff.overflowMinutesAvg)}
                      {renderRow('photoFrequencyOutOfTen', staff.photoFrequencyOutOfTen)}
                      {renderRow('lateArrivalOutOfTen', staff.lateArrivalOutOfTen)}
                      {renderRow('lateArrivalJustification', staff.lateArrivalJustification)}
                      {renderRow('lastTwoMinutesDesc', staff.lastTwoMinutesDesc)}
                    </div>

                    {/* Section 3 */}
                    {renderSectionHeader(3)}
                    <div className="space-y-2">
                      <div className="p-3.5 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/80 space-y-2">
                        <span className="text-xs font-bold text-[#007C8D] block">{labelMap.childReactions}:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          {[
                            { l: t('فرح مباشر', 'Direct Joy'), v: staff.childReactions?.directJoy ?? 0 },
                            { l: t('خجل / ترقب', 'Shyness'), v: staff.childReactions?.shyness ?? 0 },
                            { l: t('خوف / بكاء', 'Fear/Cry'), v: staff.childReactions?.fearOrCrying ?? 0 },
                            { l: t('تعلق شديد', 'Attached'), v: staff.childReactions?.extremeAttachment ?? 0 },
                          ].map((c) => (
                            <div key={c.l} className="p-2 bg-white rounded-lg border border-[#BAEBF1]">
                              <span className="text-[11px] text-slate-500 block">{c.l}</span>
                              <span className="text-sm font-black text-[#063B44] font-mono tabular-nums">{c.v}/10</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {renderRow('handlingScaredChild', staff.handlingScaredChild)}
                      {renderRow('giftOpeningReaction', staff.giftOpeningReaction)}
                      {renderRow('childrenSpecialRequests', staff.childrenSpecialRequests)}
                      {renderRow('otherChildrenGiftAskOutOfTen', staff.otherChildrenGiftAskOutOfTen)}
                      {renderRow('otherChildrenGiftReply', staff.otherChildrenGiftReply)}
                      {renderRow('handlingAttachmentOnLeave', staff.handlingAttachmentOnLeave)}
                    </div>

                    {/* Section 4 */}
                    {renderSectionHeader(4)}
                    <div className="space-y-2">
                      {renderChips('whoAttends', staff.whoAttends)}
                      {renderRow('momBehaviorDuringVisit', staff.momBehaviorDuringVisit)}
                      {renderRow('primaryConversationPartner', staff.primaryConversationPartner)}
                      {renderRow('topThreeMomQuestions', staff.topThreeMomQuestions)}
                      <div className="p-3.5 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/80 space-y-2">
                        <span className="text-xs font-bold text-[#007C8D] block">{labelMap.momInquiriesFrequency}:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {MOM_INQUIRY_TOPICS.map((tp) => (
                            <div
                              key={tp.key}
                              className="p-2.5 bg-white rounded-lg border border-[#BAEBF1] flex items-center justify-between gap-2"
                            >
                              <span className="font-semibold text-[#063B44]">
                                {lang === 'en' ? tp.labelEn : tp.labelAr}
                              </span>
                              <span className="font-bold text-[#007C8D]">
                                {staff.momInquiriesFrequency?.[tp.key] || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {renderRow('momsKnowTenMinLimit', staff.momsKnowTenMinLimit)}
                      {renderRow('momsUnawareTenMinReaction', staff.momsUnawareTenMinReaction)}
                      {renderRow('extraToysInCarAskOutOfTen', staff.extraToysInCarAskOutOfTen)}
                      {renderRow('pricingSentiment', staff.pricingSentiment)}
                      {renderRow('customerServiceFeedback', staff.customerServiceFeedback)}
                      {renderRow('appWebsiteComplaints', staff.appWebsiteComplaints)}
                      {renderRow('bestTimingForOffers', staff.bestTimingForOffers)}
                    </div>

                    {/* Section 5 */}
                    {renderSectionHeader(5)}
                    <div className="space-y-2">
                      <div className="p-3.5 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/80 space-y-2">
                        <span className="text-xs font-bold text-[#007C8D] block">{labelMap.momOvertime}:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-white rounded-lg border border-[#BAEBF1] flex justify-between">
                            <span className="text-slate-500">{t('تكرار الطلب (/10)', 'Freq (/10)')}:</span>
                            <span className="font-mono font-bold text-[#063B44] tabular-nums">
                              {staff.momOvertime?.frequency ?? 0}/10
                            </span>
                          </div>
                          <div className="p-2.5 bg-white rounded-lg border border-[#BAEBF1] flex justify-between">
                            <span className="text-slate-500">{t('الدقائق المطلوبة', 'Mins Requested')}:</span>
                            <span className="font-mono font-bold text-[#063B44] tabular-nums">
                              {staff.momOvertime?.requestedMinutes ?? 0} {t('د', 'm')}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white rounded-lg border border-[#BAEBF1] sm:col-span-2">
                            <span className="text-slate-500 block mb-0.5">{t('33. تصرف الموظفة:', '33. Staff Action:')}</span>
                            <span className="font-bold text-[#063B44]">{staff.momOvertime?.staffAction || '—'}</span>
                          </div>
                          <div className="p-2.5 bg-white rounded-lg border border-[#BAEBF1] sm:col-span-2">
                            <span className="text-slate-500 block mb-0.5">{t('36. ما تتمناه من الإدارة:', '36. Guidance Wished:')}</span>
                            <span className="font-semibold text-[#063B44]">{staff.momOvertime?.wishedCompanyGuidance || '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/80 space-y-2.5">
                        <span className="text-xs font-bold text-[#007C8D] block">{labelMap.situations} (37–40):</span>
                        {DIFFICULT_SITUATIONS.slice(0, 4).map((sit) => {
                          const ans = staff.situations?.[sit.id];
                          return (
                            <div key={sit.id} className="p-3 bg-white rounded-xl border border-[#BAEBF1] space-y-1.5 text-xs">
                              <div className="font-bold text-[#063B44]">
                                {sit.number}. {lang === 'en' ? sit.titleEn : sit.title}
                              </div>
                              <div>
                                <span className="font-bold text-[#007C8D]">{t('(أ) التصرف: ', '(A) Action: ')}</span>
                                <span className="text-[#063B44]">{ans?.action || '—'}</span>
                              </div>
                              <div>
                                <span className="font-bold text-[#007C8D]">{t('(ب) العبارة: ', '(B) Phrase: ')}</span>
                                <span className="text-[#063B44]">{ans?.phrase || '—'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {renderRow('otherDifficultSituations', staff.otherDifficultSituations)}
                    </div>

                    {/* Section 6 */}
                    {renderSectionHeader(6)}
                    <div className="space-y-2">
                      {renderRow('unleveragedMomChildComments', staff.unleveragedMomChildComments)}
                      {renderChips('potentialServices', staff.potentialServices)}
                      {renderRow('frictionInProposing', staff.frictionInProposing)}
                      {renderRow('oneMessageAboutKidzy', staff.oneMessageAboutKidzy)}
                    </div>

                    {/* Section 7 */}
                    {renderSectionHeader(7)}
                    <div className="space-y-2">
                      {renderRow('bestVisitExperience', staff.bestVisitExperience)}
                      {renderRow('hardestVisitExperience', staff.hardestVisitExperience)}
                      {renderRow('messageToLeadership', staff.messageToLeadership)}
                      {renderRow('firstThingToChange', staff.firstThingToChange)}
                      {renderRow('finalComments', staff.finalComments)}
                      {staff.voiceNotes && staff.voiceNotes.length > 0 && (
                        <div className="p-3.5 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/80">
                          <span className="text-xs font-bold text-[#007C8D] block mb-2">{labelMap.voiceNotes}:</span>
                          <div className="flex flex-wrap gap-2">
                            {staff.voiceNotes.map((vn, i) => (
                              <span
                                key={i}
                                className="text-xs font-mono bg-white border border-[#BAEBF1] px-2.5 py-1 rounded-lg text-[#063B44] tabular-nums"
                              >
                                {vn.questionId}: {vn.durationSeconds}s
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {legacyNonEmptyEntries.length > 0 && (
                      <>
                        <div className="pt-2 pb-1 border-b border-slate-200">
                          <h4 className="text-xs font-bold text-slate-500">
                            {t('حقول تاريخية سابقة (قبل التحديث)', 'Archived Legacy Fields (Pre-Update)')}
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {legacyNonEmptyEntries.map(([k, v]) =>
                            Array.isArray(v)
                              ? renderChips(k, v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))))
                              : renderRow(k, v)
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })() : (
                <div className="space-y-3">
                  {Object.entries(activeDetailItem).map(([key, val]) => {
                    if (key === 'id' || key === 'submittedAt' || key === 'timestamp') return null;
                    const fieldLabel = labelMap[key] || key;

                    if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
                      return (
                        <div key={key} className="p-4 bg-[#F7FAFB] rounded-2xl border border-[#BAEBF1]/80">
                          <span className="text-xs font-bold text-[#007C8D] block mb-2">{fieldLabel}:</span>
                          {val.length === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {val.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs font-medium bg-white text-[#063B44] px-2.5 py-1 rounded-lg border border-[#BAEBF1]"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (typeof val === 'object' && val !== null) {
                      return (
                        <div key={key} className="p-4 bg-[#F7FAFB] rounded-2xl border border-[#BAEBF1]/80">
                          <span className="text-xs font-bold text-[#007C8D] block mb-2">{fieldLabel}:</span>
                          <pre
                            dir="ltr"
                            className="text-xs font-mono bg-white p-3 rounded-xl border border-[#BAEBF1] overflow-x-auto text-[#063B44] leading-relaxed text-left"
                          >
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={key}
                        className="p-3.5 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <span className="text-xs font-bold text-[#007C8D] min-w-[220px]">{fieldLabel}:</span>
                        <span
                          className={`text-xs font-bold text-[#063B44] bg-white px-3 py-1.5 rounded-lg border border-[#BAEBF1] flex-1 ${
                            dir === 'rtl' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatValue(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F7FAFB] border-t border-[#BAEBF1] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteId(null);
                    setSelectedResponseIndex(null);
                  }}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-[#063B44] text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {t('إغلاق', 'Close')}
                </button>

                {onDeleteResponse &&
                  activeDetailItem.id &&
                  (confirmDeleteId === activeDetailItem.id ? (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl">
                      <span className="text-[11px] font-bold text-red-800">
                        {t('تأكيد الحذف نهائيًا؟', 'Delete permanently?')}
                      </span>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={async () => {
                          setIsDeleting(true);
                          try {
                            await onDeleteResponse(selectedSurveyType, activeDetailItem.id);
                            setConfirmDeleteId(null);
                            setSelectedResponseIndex(null);
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                      >
                        {isDeleting ? t('جاري الحذف...', 'Deleting...') : t('نعم، احذف', 'Confirm Delete')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 bg-white text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                      >
                        {t('إلغاء', 'Cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(activeDetailItem.id)}
                      className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('حذف الاستجابة', 'Delete Response')}</span>
                    </button>
                  ))}
              </div>

              <button
                type="button"
                onClick={handleCopyDetails}
                className="px-4 py-2.5 bg-[#007C8D] hover:bg-[#005866] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? t('تم النسخ!', 'Copied!') : t('نسخ الاستجابة', 'Copy JSON')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
