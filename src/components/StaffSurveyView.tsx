import React, { useState, useEffect, useRef } from 'react';
import {
  StaffSurveyResponse,
  TimeAllocation,
  DifficultSituationAnswer,
} from '../types/survey';
import { SURVEY_SECTIONS, DIFFICULT_SITUATIONS } from '../data/surveyQuestions';
import {
  calculateTimeAllocation,
  evaluateStaffSurveyRequiredProgress,
  isStaffRequiredQuestionComplete,
  StaffRequiredQuestionKey,
} from '../utils/surveyLogic';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';
import { getFriendlyFirestoreSubmitError } from '../services/surveyFirestore';
import { KidzyMonogram, KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';
import {
  CheckCircle2,
  Mic,
  Square,
  Play,
  Save,
  Send,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Filter,
} from 'lucide-react';

interface StaffSurveyViewProps {
  onSaveSurvey: (survey: StaffSurveyResponse) => Promise<void> | void;
  recentSurveysCount: number;
  isStandalone?: boolean;
}

const STAFF_DRAFT_KEY = 'kidzy_staff_survey_draft';

export const StaffSurveyView: React.FC<StaffSurveyViewProps> = ({
  onSaveSurvey,
  isStandalone = false,
}) => {
  const { lang, dir, t } = useLanguage();
  const totalSections = SURVEY_SECTIONS.length; // 7 published sections (Old Sec 7 & 8 unpublished)

  const [currentSection, setCurrentSection] = useState(1);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [onlyRequiredMode, setOnlyRequiredMode] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const formTopRef = useRef<HTMLFormElement>(null);

  // Section 1: About You
  const [consent, setConsent] = useState(true);
  const [workDuration, setWorkDuration] = useState('');
  const [dailyVisitsAvg, setDailyVisitsAvg] = useState(0);
  const [frequentCharacters, setFrequentCharacters] = useState('');
  const [childAgeGroup, setChildAgeGroup] = useState('');
  const [frequentAreas, setFrequentAreas] = useState('');
  const [housingType, setHousingType] = useState('');
  const [doorOpener, setDoorOpener] = useState('');

  // Section 2: Visit Flow
  const [firstMinuteDesc, setFirstMinuteDesc] = useState('');
  const [parentsReception, setParentsReception] = useState('');
  const [giftRecipient, setGiftRecipient] = useState('');
  const [seenCompetitorGifts, setSeenCompetitorGifts] = useState('');
  const [timeAllocation, setTimeAllocation] = useState<TimeAllocation>({
    entrance: 0,
    gift: 0,
    play: 0,
    photos: 0,
    farewell: 0,
  });
  const [isTenMinutesEnough, setIsTenMinutesEnough] = useState<number | null>(null);
  const [isTenMinutesEnoughReason, setIsTenMinutesEnoughReason] = useState('');
  const [overflowFrequency, setOverflowFrequency] = useState(0);
  const [overflowMinutesAvg, setOverflowMinutesAvg] = useState(0);
  const [photoFrequencyOutOfTen, setPhotoFrequencyOutOfTen] = useState<number | null>(null);
  const [lateArrivalOutOfTen, setLateArrivalOutOfTen] = useState<number | null>(null);
  const [lateArrivalJustification, setLateArrivalJustification] = useState('');
  const [lastTwoMinutesDesc, setLastTwoMinutesDesc] = useState('');
  const [bestMomentDesc, setBestMomentDesc] = useState('');
  const [worstMomentDesc, setWorstMomentDesc] = useState('');

  // Section 3: The Child
  const [childReactions, setChildReactions] = useState({
    directJoy: 0,
    shyness: 0,
    fearOrCrying: 0,
    extremeAttachment: 0,
  });
  const [handlingScaredChild, setHandlingScaredChild] = useState('');
  const [giftOpeningReaction, setGiftOpeningReaction] = useState('');
  const [childrenSpecialRequests, setChildrenSpecialRequests] = useState('');
  const [otherChildrenGiftAskOutOfTen, setOtherChildrenGiftAskOutOfTen] = useState<number | null>(null);
  const [otherChildrenGiftReply, setOtherChildrenGiftReply] = useState('');
  const [observedInterests, setObservedInterests] = useState('');
  const [handlingAttachmentOnLeave, setHandlingAttachmentOnLeave] = useState('');
  const [childAskingToBuy, setChildAskingToBuy] = useState('');

  // Section 4: Mom & Family
  const [whoAttends, setWhoAttends] = useState<string[]>([]);
  const [momBehaviorDuringVisit, setMomBehaviorDuringVisit] = useState('');
  const [topThreeMomQuestions, setTopThreeMomQuestions] = useState('');
  const [momInquiriesFrequency, setMomInquiriesFrequency] = useState<Record<string, string>>({});
  const [pricingSentiment, setPricingSentiment] = useState<
    'غالية جدا' | 'غالية' | 'معقولة' | 'لا توجد تعليقات' | string
  >('');
  const [customerServiceFeedback, setCustomerServiceFeedback] = useState('');
  const [otherCSFeedback, setOtherCSFeedback] = useState('');
  const [appWebsiteComplaints, setAppWebsiteComplaints] = useState('');
  const [extraToysInCarAskOutOfTen, setExtraToysInCarAskOutOfTen] = useState<number | null>(null);
  const [momsKnowTenMinLimit, setMomsKnowTenMinLimit] = useState('');
  const [momsUnawareTenMinReaction, setMomsUnawareTenMinReaction] = useState('');
  const [primaryConversationPartner, setPrimaryConversationPartner] = useState('');
  const [momRepeatPromise, setMomRepeatPromise] = useState('');
  const [bestTimingForOffers, setBestTimingForOffers] = useState('');
  const [bestTimingForOffersReason, setBestTimingForOffersReason] = useState('');
  const [momDiscomfortMoments, setMomDiscomfortMoments] = useState('');
  const [photoVideoRequests, setPhotoVideoRequests] = useState('');
  const [siblingsInterest, setSiblingsInterest] = useState('');

  // Section 5: Difficult Scenarios
  const [momOvertime, setMomOvertime] = useState({
    frequency: 0,
    requestedMinutes: 0,
    staffAction: '',
    delayedNextVisit: '',
    paidExtensionExperience: '',
    wishedCompanyGuidance: '',
  });
  const [situations, setSituations] = useState<Record<string, DifficultSituationAnswer>>({});
  const [otherDifficultSituations, setOtherDifficultSituations] = useState('');

  // Section 6: Untapped Opportunities
  const [unleveragedMomChildComments, setUnleveragedMomChildComments] = useState('');
  const [potentialServices, setPotentialServices] = useState<string[]>([]);
  const [upcomingEventsNoticed, setUpcomingEventsNoticed] = useState('');
  const [websiteWhatsappInquiries, setWebsiteWhatsappInquiries] = useState('');
  const [frictionInProposing, setFrictionInProposing] = useState('');
  const [oneMessageAboutKidzy, setOneMessageAboutKidzy] = useState('');
  const [neighborsRelativesInterest, setNeighborsRelativesInterest] = useState('');

  // Section 7 (Published Open Questions — previously Sec 9)
  const [bestVisitExperience, setBestVisitExperience] = useState('');
  const [hardestVisitExperience, setHardestVisitExperience] = useState('');
  const [messageToLeadership, setMessageToLeadership] = useState('');
  const [firstThingToChange, setFirstThingToChange] = useState('');
  const [finalComments, setFinalComments] = useState('');

  // Simulated Voice Note state for WhatsApp audio replies
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudios, setRecordedAudios] = useState<{ id: string; seconds: number }[]>([]);

  const allocationCalc = calculateTimeAllocation(timeAllocation);

  const requiredState = {
    workDuration,
    housingType,
    doorOpener,
    giftRecipient,
    seenCompetitorGifts,
    isTenMinutesEnough,
    photoFrequencyOutOfTen,
    lateArrivalOutOfTen,
    giftOpeningReaction,
    otherChildrenGiftAskOutOfTen,
    primaryConversationPartner,
    momsKnowTenMinLimit,
    extraToysInCarAskOutOfTen,
    pricingSentiment,
    customerServiceFeedback,
    otherCSFeedback,
    momOvertimeStaffAction: momOvertime.staffAction,
    potentialServices,
    firstThingToChange,
  };

  const requiredProgress = evaluateStaffSurveyRequiredProgress(requiredState);

  const isFieldMissing = (key: StaffRequiredQuestionKey) =>
    showValidationErrors && !isStaffRequiredQuestionComplete(key, requiredState);

  const requiredStar = (
    <span
      className="text-rose-600 font-black text-base leading-none ms-1 inline-block align-middle"
      title={t('سؤال إلزامي لإرسال الاستبيان', 'Required for submission')}
      aria-label={t('سؤال إلزامي', 'Required')}
    >
      *
    </span>
  );

  const renderMissingBadge = (key: StaffRequiredQuestionKey) =>
    isFieldMissing(key) ? (
      <span className="ms-2 inline-block text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
        {t('مطلوب للإرسال *', 'Required *')}
      </span>
    ) : null;

  // Restore saved browser draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STAFF_DRAFT_KEY);
      if (!saved) return;
      const p = JSON.parse(saved);
      const isV2Draft = p.draftVersion === 2;
      if (typeof p.consent === 'boolean') setConsent(p.consent);
      if (p.workDuration) setWorkDuration(p.workDuration);
      if (p.dailyVisitsAvg !== undefined) setDailyVisitsAvg(Number(p.dailyVisitsAvg) || 0);
      if (p.frequentCharacters) setFrequentCharacters(p.frequentCharacters);
      if (p.childAgeGroup) setChildAgeGroup(p.childAgeGroup);
      if (p.frequentAreas) setFrequentAreas(p.frequentAreas);
      if (p.housingType) setHousingType(p.housingType);
      if (p.doorOpener) setDoorOpener(p.doorOpener);
      if (p.firstMinuteDesc) setFirstMinuteDesc(p.firstMinuteDesc);
      if (p.parentsReception) setParentsReception(p.parentsReception);
      if (p.giftRecipient) setGiftRecipient(p.giftRecipient);
      if (p.seenCompetitorGifts) setSeenCompetitorGifts(p.seenCompetitorGifts);
      if (p.timeAllocation) setTimeAllocation(p.timeAllocation);
      if (isV2Draft) {
        setIsTenMinutesEnough(typeof p.isTenMinutesEnough === 'number' ? p.isTenMinutesEnough : null);
      }
      if (p.isTenMinutesEnoughReason) setIsTenMinutesEnoughReason(p.isTenMinutesEnoughReason);
      if (p.overflowFrequency !== undefined) setOverflowFrequency(Number(p.overflowFrequency) || 0);
      if (p.overflowMinutesAvg !== undefined) setOverflowMinutesAvg(Number(p.overflowMinutesAvg) || 0);
      if (isV2Draft) {
        setPhotoFrequencyOutOfTen(
          typeof p.photoFrequencyOutOfTen === 'number' ? p.photoFrequencyOutOfTen : null
        );
        setLateArrivalOutOfTen(
          typeof p.lateArrivalOutOfTen === 'number' ? p.lateArrivalOutOfTen : null
        );
      } else {
        if (typeof p.photoFrequencyOutOfTen === 'number' && p.photoFrequencyOutOfTen > 0) {
          setPhotoFrequencyOutOfTen(p.photoFrequencyOutOfTen);
        }
        if (typeof p.lateArrivalOutOfTen === 'number' && p.lateArrivalOutOfTen > 0) {
          setLateArrivalOutOfTen(p.lateArrivalOutOfTen);
        }
      }
      if (p.lateArrivalJustification) setLateArrivalJustification(p.lateArrivalJustification);
      if (p.lastTwoMinutesDesc) setLastTwoMinutesDesc(p.lastTwoMinutesDesc);
      if (p.childReactions) setChildReactions(p.childReactions);
      if (p.handlingScaredChild) setHandlingScaredChild(p.handlingScaredChild);
      if (p.giftOpeningReaction) setGiftOpeningReaction(p.giftOpeningReaction);
      if (p.childrenSpecialRequests) setChildrenSpecialRequests(p.childrenSpecialRequests);
      if (isV2Draft) {
        setOtherChildrenGiftAskOutOfTen(
          typeof p.otherChildrenGiftAskOutOfTen === 'number' ? p.otherChildrenGiftAskOutOfTen : null
        );
      } else if (typeof p.otherChildrenGiftAskOutOfTen === 'number' && p.otherChildrenGiftAskOutOfTen > 0) {
        setOtherChildrenGiftAskOutOfTen(p.otherChildrenGiftAskOutOfTen);
      }
      if (p.otherChildrenGiftReply) setOtherChildrenGiftReply(p.otherChildrenGiftReply);
      if (p.handlingAttachmentOnLeave) setHandlingAttachmentOnLeave(p.handlingAttachmentOnLeave);
      if (Array.isArray(p.whoAttends)) setWhoAttends(p.whoAttends);
      if (p.momBehaviorDuringVisit) setMomBehaviorDuringVisit(p.momBehaviorDuringVisit);
      if (p.topThreeMomQuestions) setTopThreeMomQuestions(p.topThreeMomQuestions);
      if (p.momInquiriesFrequency) setMomInquiriesFrequency(p.momInquiriesFrequency);
      if (p.pricingSentiment) setPricingSentiment(p.pricingSentiment);
      if (p.customerServiceFeedback) setCustomerServiceFeedback(p.customerServiceFeedback);
      if (p.otherCSFeedback) setOtherCSFeedback(p.otherCSFeedback);
      if (p.appWebsiteComplaints) setAppWebsiteComplaints(p.appWebsiteComplaints);
      if (isV2Draft) {
        setExtraToysInCarAskOutOfTen(
          typeof p.extraToysInCarAskOutOfTen === 'number' ? p.extraToysInCarAskOutOfTen : null
        );
      } else if (typeof p.extraToysInCarAskOutOfTen === 'number' && p.extraToysInCarAskOutOfTen > 0) {
        setExtraToysInCarAskOutOfTen(p.extraToysInCarAskOutOfTen);
      }
      if (p.momsKnowTenMinLimit) setMomsKnowTenMinLimit(p.momsKnowTenMinLimit);
      if (p.momsUnawareTenMinReaction) setMomsUnawareTenMinReaction(p.momsUnawareTenMinReaction);
      if (p.primaryConversationPartner) setPrimaryConversationPartner(p.primaryConversationPartner);
      if (p.bestTimingForOffers) setBestTimingForOffers(p.bestTimingForOffers);
      if (p.momOvertime) setMomOvertime(p.momOvertime);
      if (p.situations) setSituations(p.situations);
      if (p.otherDifficultSituations) setOtherDifficultSituations(p.otherDifficultSituations);
      if (p.unleveragedMomChildComments) setUnleveragedMomChildComments(p.unleveragedMomChildComments);
      if (Array.isArray(p.potentialServices)) setPotentialServices(p.potentialServices);
      if (p.frictionInProposing) setFrictionInProposing(p.frictionInProposing);
      if (p.oneMessageAboutKidzy) setOneMessageAboutKidzy(p.oneMessageAboutKidzy);
      if (p.bestVisitExperience) setBestVisitExperience(p.bestVisitExperience);
      if (p.hardestVisitExperience) setHardestVisitExperience(p.hardestVisitExperience);
      if (p.messageToLeadership) setMessageToLeadership(p.messageToLeadership);
      if (p.firstThingToChange) setFirstThingToChange(p.firstThingToChange);
      if (p.finalComments) setFinalComments(p.finalComments);
    } catch {
      // ignore corrupted draft
    }
  }, []);

  // Voice recording timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecording) {
      timer = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleSaveDraft = () => {
    const draft = {
      draftVersion: 2,
      consent,
      workDuration,
      dailyVisitsAvg,
      frequentCharacters,
      childAgeGroup,
      frequentAreas,
      housingType,
      doorOpener,
      firstMinuteDesc,
      parentsReception,
      giftRecipient,
      seenCompetitorGifts,
      timeAllocation,
      isTenMinutesEnough,
      isTenMinutesEnoughReason,
      overflowFrequency,
      overflowMinutesAvg,
      photoFrequencyOutOfTen,
      lateArrivalOutOfTen,
      lateArrivalJustification,
      lastTwoMinutesDesc,
      childReactions,
      handlingScaredChild,
      giftOpeningReaction,
      childrenSpecialRequests,
      otherChildrenGiftAskOutOfTen,
      otherChildrenGiftReply,
      handlingAttachmentOnLeave,
      whoAttends,
      momBehaviorDuringVisit,
      topThreeMomQuestions,
      momInquiriesFrequency,
      pricingSentiment,
      customerServiceFeedback,
      otherCSFeedback,
      appWebsiteComplaints,
      extraToysInCarAskOutOfTen,
      momsKnowTenMinLimit,
      momsUnawareTenMinReaction,
      primaryConversationPartner,
      bestTimingForOffers,
      momOvertime,
      situations,
      otherDifficultSituations,
      unleveragedMomChildComments,
      potentialServices,
      frictionInProposing,
      oneMessageAboutKidzy,
      bestVisitExperience,
      hardestVisitExperience,
      messageToLeadership,
      firstThingToChange,
      finalComments,
    };
    try {
      localStorage.setItem(STAFF_DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 2500);
    } catch {
      // ignore storage errors in private/restricted browsers
    }
  };

  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordedAudios([
        ...recordedAudios,
        { id: 'rec-' + Date.now(), seconds: recordSeconds || 1 },
      ]);
      setRecordSeconds(0);
    } else {
      setRecordSeconds(0);
      setIsRecording(true);
    }
  };

  const handleSituationChange = (
    sitId: string,
    field: keyof DifficultSituationAnswer,
    value: string
  ) => {
    setSituations((prev) => ({
      ...prev,
      [sitId]: {
        action: prev[sitId]?.action || '',
        phrase: prev[sitId]?.phrase || '',
        guidance: (prev[sitId]?.guidance as DifficultSituationAnswer['guidance']) || '',
        outcome: prev[sitId]?.outcome || '',
        [field]: value,
      },
    }));
  };

  const resetForm = () => {
    setSubmittedSuccess(false);
    setCurrentSection(1);
    setConsent(true);
    setWorkDuration('');
    setDailyVisitsAvg(0);
    setFrequentCharacters('');
    setChildAgeGroup('');
    setFrequentAreas('');
    setHousingType('');
    setDoorOpener('');
    setFirstMinuteDesc('');
    setParentsReception('');
    setGiftRecipient('');
    setSeenCompetitorGifts('');
    setTimeAllocation({ entrance: 0, gift: 0, play: 0, photos: 0, farewell: 0 });
    setIsTenMinutesEnough(null);
    setIsTenMinutesEnoughReason('');
    setOverflowFrequency(0);
    setOverflowMinutesAvg(0);
    setPhotoFrequencyOutOfTen(null);
    setLateArrivalOutOfTen(null);
    setLateArrivalJustification('');
    setLastTwoMinutesDesc('');
    setBestMomentDesc('');
    setWorstMomentDesc('');
    setChildReactions({ directJoy: 0, shyness: 0, fearOrCrying: 0, extremeAttachment: 0 });
    setHandlingScaredChild('');
    setGiftOpeningReaction('');
    setChildrenSpecialRequests('');
    setOtherChildrenGiftAskOutOfTen(null);
    setOtherChildrenGiftReply('');
    setObservedInterests('');
    setHandlingAttachmentOnLeave('');
    setChildAskingToBuy('');
    setWhoAttends([]);
    setMomBehaviorDuringVisit('');
    setTopThreeMomQuestions('');
    setMomInquiriesFrequency({});
    setPricingSentiment('');
    setCustomerServiceFeedback('');
    setOtherCSFeedback('');
    setAppWebsiteComplaints('');
    setExtraToysInCarAskOutOfTen(null);
    setMomsKnowTenMinLimit('');
    setMomsUnawareTenMinReaction('');
    setPrimaryConversationPartner('');
    setMomRepeatPromise('');
    setBestTimingForOffers('');
    setBestTimingForOffersReason('');
    setMomDiscomfortMoments('');
    setPhotoVideoRequests('');
    setSiblingsInterest('');
    setMomOvertime({
      frequency: 0,
      requestedMinutes: 0,
      staffAction: '',
      delayedNextVisit: '',
      paidExtensionExperience: '',
      wishedCompanyGuidance: '',
    });
    setSituations({});
    setOtherDifficultSituations('');
    setUnleveragedMomChildComments('');
    setPotentialServices([]);
    setUpcomingEventsNoticed('');
    setWebsiteWhatsappInquiries('');
    setFrictionInProposing('');
    setOneMessageAboutKidzy('');
    setNeighborsRelativesInterest('');
    setBestVisitExperience('');
    setHardestVisitExperience('');
    setMessageToLeadership('');
    setFirstThingToChange('');
    setFinalComments('');
    setRecordedAudios([]);
    setSubmitError(null);
    setShowValidationErrors(false);
  };

  const submitSurveyNow = async () => {
    setSubmitError(null);

    if (!consent) {
      setShowValidationErrors(true);
      setSubmitError(
        t(
          'يرجى التأشير على موافقة المشاركة في القسم (1) قبل الإرسال.',
          'Please confirm participation consent in Section (1) before submitting.'
        )
      );
      setCurrentSection(1);
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!requiredProgress.isComplete) {
      setShowValidationErrors(true);
      const firstMissing = requiredProgress.missingQuestions[0];
      setSubmitError(
        t(
          `يرجى استكمال الأسئلة الإلزامية المميزة بالنجمة (*) قبل الإرسال — متبقٍ ${requiredProgress.missingQuestions.length} من ${requiredProgress.requiredCount} سؤالًا (تم الانتقال إلى القسم ${firstMissing.section}: ${firstMissing.labelAr}).`,
          `Please answer the required questions marked with (*) before submitting — ${requiredProgress.missingQuestions.length} of ${requiredProgress.requiredCount} remaining (jumped to Section ${firstMissing.section}: ${firstMissing.labelEn}).`
        )
      );
      if (requiredProgress.firstIncompleteSection) {
        setCurrentSection(requiredProgress.firstIncompleteSection);
      }
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const csCombined =
      customerServiceFeedback && otherCSFeedback.trim()
        ? `${customerServiceFeedback} (${otherCSFeedback.trim()})`
        : otherCSFeedback.trim() || customerServiceFeedback;

    // Pass complete 79-key schema object (unpublished Sec 7 Tools & Sec 8 Ideas sent cleanly as empty/[])
    const response: StaffSurveyResponse = {
      id: `staff-resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      submittedAt: new Date().toISOString(),
      consent,
      workDuration,
      dailyVisitsAvg,
      frequentCharacters,
      childAgeGroup,
      frequentAreas,
      housingType,
      doorOpener,
      firstMinuteDesc,
      parentsReception,
      prepTimeMinutes: '',
      giftRecipient,
      seenCompetitorGifts,
      timeAllocation,
      isTenMinutesEnough: isTenMinutesEnough ?? 3,
      isTenMinutesEnoughReason,
      overflowFrequency,
      overflowMinutesAvg,
      photoFrequencyOutOfTen: photoFrequencyOutOfTen ?? 0,
      lateArrivalOutOfTen: lateArrivalOutOfTen ?? 0,
      lateArrivalJustification: lateArrivalJustification.trim(),
      lastTwoMinutesDesc,
      bestMomentDesc,
      worstMomentDesc,
      childReactions,
      handlingScaredChild,
      giftOpeningReaction,
      childrenSpecialRequests,
      otherChildrenGiftAskOutOfTen: otherChildrenGiftAskOutOfTen ?? 0,
      otherChildrenGiftReply: otherChildrenGiftReply.trim(),
      observedInterests,
      handlingAttachmentOnLeave,
      childAskingToBuy,
      whoAttends,
      momBehaviorDuringVisit,
      topThreeMomQuestions,
      momInquiriesFrequency,
      pricingSentiment,
      customerServiceFeedback: csCombined,
      appWebsiteComplaints: appWebsiteComplaints.trim(),
      extraToysInCarAskOutOfTen: extraToysInCarAskOutOfTen ?? 0,
      momsKnowTenMinLimit,
      momsUnawareTenMinReaction:
        momsKnowTenMinLimit === 'لا' ? momsUnawareTenMinReaction.trim() : '',
      primaryConversationPartner,
      momRepeatPromise,
      bestTimingForOffers,
      bestTimingForOffersReason,
      momDiscomfortMoments,
      photoVideoRequests,
      siblingsInterest,
      momOvertime,
      situations,
      otherDifficultSituations,
      unleveragedMomChildComments,
      potentialServices,
      upcomingEventsNoticed,
      websiteWhatsappInquiries,
      frictionInProposing,
      oneMessageAboutKidzy,
      neighborsRelativesInterest,
      // Unpublished sections 7 & 8 kept empty for strict Firestore 79-key schema compatibility
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
      // Published Section 7 (Open Questions)
      bestVisitExperience,
      hardestVisitExperience,
      messageToLeadership,
      firstThingToChange,
      finalComments,
      voiceNotes: recordedAudios.map((aud, idx) => ({
        questionId: `voice-${idx + 1}`,
        durationSeconds: aud.seconds,
        recordedAt: new Date().toISOString(),
      })),
    };

    setIsSubmitting(true);
    try {
      await onSaveSurvey(response);
      try {
        localStorage.removeItem(STAFF_DRAFT_KEY);
      } catch {
        // ignore storage restrictions after successful save
      }
      setSubmittedSuccess(true);
    } catch (error) {
      setSubmitError(
        getFriendlyFirestoreSubmitError(
          error,
          lang,
          'تعذر إرسال الاستبيان لقاعدة البيانات حاليًا. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
          'Unable to submit the survey right now. Please check your connection and try again.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (currentSection < totalSections) {
      setCurrentSection((c) => Math.min(totalSections, c + 1));
      return;
    }

    await submitSurveyNow();
  };

  const renderOutOfTenSelector = (
    value: number | null,
    onSelect: (v: number) => void,
    neutralBg = 'bg-white'
  ) => (
    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 pt-1">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
        const selected = value === num;
        return (
          <button
            type="button"
            key={num}
            onClick={() => onSelect(num)}
            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer tabular-nums font-mono ${
              selected
                ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                : `${neutralBg} text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/30 hover:border-[#01AFC5]`
            }`}
          >
            {num}
          </button>
        );
      })}
    </div>
  );

  if (submittedSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" dir={dir}>
        <div className="bg-white rounded-3xl border border-[#BAEBF1] shadow-xl p-8 sm:p-12 animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <KidzyPatternDecor variant="cream-card" />
          <div className="relative z-10 flex flex-col items-center">
            <KidzyWordmark
              variant="teal"
              className="h-9 w-auto mb-5"
              showTagline
              taglineBilingual={t('اصنع يومهم.. على طريقة كيدزي', 'MAKE THEIR DAY. THE KIDZY WAY.')}
            />
            <div className="w-16 h-16 bg-[#BAEBF1]/50 text-[#007C8D] rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-[#063B44] mb-2">
              {t('شكرًا لكِ على وقتكِ وصراحتكِ!', 'Thank You for Your Honesty!')}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {t(
                'تم استلام إجاباتكِ كاملة وبشكل سري وحفظها في منظومة kidzy kpi,s. تجربتكِ الميدانية تصنع فارقًا حقيقيًا في تطوير الخدمة وتحسين بيئة عمل موظفات الشخصيات.',
                'Your responses have been submitted confidentially and recorded in kidzy kpi,s. Your real field experience helps improve both the service and your daily work.'
              )}
            </p>

            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 bg-[#007C8D] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {t('تعبئة استبيان جديد', 'Fill Out Another Survey')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeSectionMeta = SURVEY_SECTIONS[currentSection - 1] || SURVEY_SECTIONS[0];

  const getTimeStatusBadge = () => {
    if (allocationCalc.isExact) {
      return t('متطابق تمامًا (10 دقائق)', 'Exact match (10 mins)');
    }
    if (allocationCalc.isOver) {
      return t(
        `يتجاوز الوقت المحدد بـ ${allocationCalc.difference} دقيقة`,
        `${allocationCalc.difference} mins over target`
      );
    }
    return t(
      `أقل من الوقت المحدد بـ ${Math.abs(allocationCalc.difference)} دقيقة`,
      `${Math.abs(allocationCalc.difference)} mins under target`
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir={dir}>
      {/* Standalone direct link banner */}
      {isStandalone && (
        <div className="mb-6 p-4 bg-[#FEF4E3] border border-[#FEC448]/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <KidzyMonogram variant="tile-teal" size={34} />
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#063B44]">
                {t(
                  'أنتِ الآن في الرابط المباشر المخصص لاستبيان موظفات الشخصيات الكرتونية — ',
                  'You are viewing the direct link for the Character Staff Survey — '
                )}
                <span dir="ltr" className="font-extrabold font-['Nunito',sans-serif]">
                  kidzy kpi,s
                </span>
              </p>
              <span className="text-[11px] font-bold text-[#007C8D] block mt-0.5">
                {t(
                  'استجابة زائر مباشرة · لا يلزم بريد إلكتروني أو كلمة مرور للإرسال',
                  'Guest response · No email or password required to submit'
                )}
              </span>
            </div>
          </div>
          <LanguageSwitcher variant="light" />
        </div>
      )}

      {/* Intro Header */}
      <div className="bg-gradient-to-br from-[#063B44] via-[#005866] to-[#007C8D] text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <KidzyWordmark variant="cream" className="h-8 w-auto mb-1" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#01AFC5]/25 text-[#BAEBF1] text-xs font-bold px-3 py-1 rounded-full border border-[#BAEBF1]/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FEC448]" />
                {t('استبيان سري ومجهول بالكامل', '100% Anonymous & Confidential')}
              </span>
              <span className="text-[#BAEBF1] text-xs font-semibold tabular-nums">
                {t(`${totalSections} أقسام مركزة ومحدثة`, `${totalSections} Focused Sections`)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {t('استبيان موظفات الشخصيات – ', 'Character Staff Survey – ')}
              <span dir="ltr" className="font-['Nunito',sans-serif]">
                kidzy kpi,s
              </span>
            </h1>
            <p className="text-slate-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {t(
                'هدفنا أن نفهم ما يدور فعلًا في العشر دقائق لنساعدكنّ ونحسّن الخدمة. ليس هذا تقييمًا لأدائكنّ. لا توجد إجابة صحيحة أو خاطئة؛ نريد تجربتكنّ الحقيقية بكل صراحة.',
                'Our goal is to understand what truly happens during the 10-minute visit so we can support you and improve the experience. This is not an evaluation — there are no right or wrong answers.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <LanguageSwitcher variant="glass" />
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#FEC448]" />
              <span>
                {draftSavedToast
                  ? t('تم حفظ المسودة!', 'Draft Saved!')
                  : t('حفظ مسودة', 'Save Draft')}
              </span>
            </button>
          </div>
        </div>

        {/* WhatsApp Voice Memo Assistant Banner */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#063B44]/60 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2 text-[#BAEBF1]">
            <Mic className="w-4 h-4 text-[#FEC448] shrink-0" />
            <span>
              <strong>{t('تفضيل الإجابة الصوتية:', 'Voice Reply Option:')}</strong>{' '}
              {t(
                'يمكنكِ استخدام مسجل الملاحظات الصوتية للإجابات الطويلة كما هو متاح عبر واتساب.',
                'You can record quick voice memos for longer reflections instead of typing everything.'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleVoiceRecord}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isRecording
                  ? 'bg-red-600 text-white ring-2 ring-red-300'
                  : 'bg-[#01AFC5] hover:bg-[#019DB2] text-white'
              }`}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="tabular-nums">
                {isRecording
                  ? t(`جاري التسجيل (${recordSeconds}ث)`, `Recording (${recordSeconds}s)`)
                  : t('تسجيل ملاحظة صوتية', 'Record Voice Note')}
              </span>
            </button>
          </div>
        </div>

        {recordedAudios.length > 0 && (
          <div className="relative z-10 mt-3 flex flex-wrap gap-2 text-xs">
            <span className="text-[#BAEBF1] self-center">
              {t('المقاطع الصوتية المسجلة:', 'Recorded Clips:')}
            </span>
            {recordedAudios.map((aud, idx) => (
              <span
                key={aud.id}
                className="bg-[#005866] text-white border border-white/15 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[11px] font-mono tabular-nums"
              >
                <span>
                  {t(`مقطع ${idx + 1} (${aud.seconds}ث)`, `Clip ${idx + 1} (${aud.seconds}s)`)}
                </span>
                <Play className="w-3 h-3 text-[#FEC448]" />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stepper Tabs (Sections 1..7) */}
      <div className="bg-white rounded-2xl border border-[#BAEBF1] p-3 shadow-xs mb-6 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {SURVEY_SECTIONS.map((sec) => {
            const isCurrent = currentSection === sec.id;
            const secTotal = requiredProgress.totalBySection[sec.id] || 0;
            const secDone = requiredProgress.completedBySection[sec.id] || 0;
            const secMissing = (requiredProgress.missingBySection[sec.id] || []).length;
            const isSecComplete = secTotal > 0 && secDone === secTotal;
            return (
              <button
                type="button"
                key={sec.id}
                onClick={() => setCurrentSection(sec.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#007C8D] text-white shadow-sm'
                    : showValidationErrors && secMissing > 0
                    ? 'bg-rose-50/70 text-[#063B44] ring-2 ring-rose-400 hover:bg-rose-50'
                    : 'text-[#063B44] hover:bg-[#BAEBF1]/30'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] tabular-nums ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-[#BAEBF1]/50 text-[#063B44]'
                  }`}
                >
                  {sec.id}
                </span>
                <span>{lang === 'en' ? sec.titleEn : sec.title}</span>
                {secTotal > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums ${
                      isSecComplete
                        ? isCurrent
                          ? 'bg-emerald-400/25 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                        : showValidationErrors && secMissing > 0 && !isCurrent
                        ? 'bg-rose-100 text-rose-700'
                        : isCurrent
                        ? 'bg-white/20 text-[#FEC448]'
                        : 'bg-[#FEF4E3] text-[#9A5B00]'
                    }`}
                  >
                    {isSecComplete ? '✓' : `${secDone}/${secTotal}*`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content Form */}
      <form
        ref={formTopRef}
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-[#BAEBF1] shadow-sm p-6 sm:p-10 space-y-8"
      >
        {/* 1/3 Required Questions Tracker & Filter Bar */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-colors ${
            requiredProgress.isComplete
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-[#F7FAFB] border-[#BAEBF1]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-[#063B44]">
                  {t(
                    'الأسئلة الإلزامية المميزة بالنجمة',
                    'Required Questions Marked with'
                  )}{' '}
                  <span className="text-rose-600 font-black">(*)</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold tabular-nums ${
                    requiredProgress.isComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#007C8D] text-white'
                  }`}
                >
                  {requiredProgress.completedCount} / {requiredProgress.requiredCount}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600">
                {t(
                  `يقتصر إرسال الاستبيان على ثلث الأسئلة فقط (${requiredProgress.requiredCount} من أصل ${requiredProgress.totalQuestionsCount} سؤالًا) المميزة بـ *، وبقية الأسئلة اختيارية.`,
                  `Submission only requires one-third of the survey (${requiredProgress.requiredCount} of ${requiredProgress.totalQuestionsCount} questions) marked with *; all other questions are optional.`
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOnlyRequiredMode((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                onlyRequiredMode
                  ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                  : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/30'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {onlyRequiredMode
                  ? t(
                      `عرض جميع الأسئلة (${requiredProgress.totalQuestionsCount})`,
                      `Show all questions (${requiredProgress.totalQuestionsCount})`
                    )
                  : t('عرض الأسئلة الإلزامية فقط (*)', 'Show required only (*)')}
              </span>
            </button>
          </div>

          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                requiredProgress.isComplete ? 'bg-emerald-600' : 'bg-[#007C8D]'
              }`}
              style={{
                width: `${Math.round(
                  (requiredProgress.completedCount / requiredProgress.requiredCount) * 100
                )}%`,
              }}
            />
          </div>

          {showValidationErrors &&
            !requiredProgress.isComplete &&
            requiredProgress.firstIncompleteSection && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <span className="font-bold text-rose-700">
                  {t(
                    `متبقٍ ${requiredProgress.missingQuestions.length} سؤال إلزامي (*) — يرجى إكمال الحقول المظللة باللون الأحمر.`,
                    `${requiredProgress.missingQuestions.length} required (*) questions remaining — please complete the highlighted fields.`
                  )}
                </span>
                {requiredProgress.firstIncompleteSection !== currentSection && (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSection(requiredProgress.firstIncompleteSection!)
                    }
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {t(
                      `الانتقال للقسم (${requiredProgress.firstIncompleteSection})`,
                      `Jump to Section (${requiredProgress.firstIncompleteSection})`
                    )}
                  </button>
                )}
              </div>
            )}
        </div>

        {/* Section Header */}
        <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#007C8D] mb-1 tabular-nums">
              <span>
                {t(`القسم ${currentSection} من ${totalSections}`, `Section ${currentSection} of ${totalSections}`)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#063B44]">
              {lang === 'en' ? activeSectionMeta.titleEn : activeSectionMeta.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'en' ? activeSectionMeta.subtitleEn : activeSectionMeta.subtitle}
            </p>
          </div>
          {(requiredProgress.totalBySection[currentSection] || 0) > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FEF4E3] border border-[#FEC448]/60 text-[11px] font-bold text-[#063B44] shrink-0 tabular-nums">
              <span className="text-rose-600 font-black">*</span>
              {t(
                `إلزامي في هذا القسم: ${requiredProgress.completedBySection[currentSection] || 0} من ${requiredProgress.totalBySection[currentSection]}`,
                `Required here: ${requiredProgress.completedBySection[currentSection] || 0} of ${requiredProgress.totalBySection[currentSection]}`
              )}
            </span>
          )}
        </div>

        {/* SECTION 1: ABOUT YOU */}
        {currentSection === 1 && (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
                showValidationErrors && !consent
                  ? 'bg-rose-50/70 border-rose-400'
                  : 'bg-[#FEF4E3]/80 border-[#FEC448]/70'
              }`}
            >
              <input
                type="checkbox"
                id="consent-check"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-5 h-5 rounded accent-[#007C8D] focus:ring-[#01AFC5] cursor-pointer"
              />
              <label htmlFor="consent-check" className="text-xs sm:text-sm font-bold text-[#063B44] cursor-pointer">
                {t(
                  'قرأتُ التعليمات أعلاه وأوافق على المشاركة طوعًا وبصراحة تامة.',
                  'I have read the instructions above and voluntarily agree to participate candidly.'
                )}
                {requiredStar}
              </label>
            </div>

            <div
              className={
                isFieldMissing('workDuration')
                  ? 'p-4 rounded-2xl border border-rose-300 bg-rose-50/40'
                  : ''
              }
            >
              <label className="block text-sm font-bold text-[#063B44] mb-2">
                {t('1. مدة عملك في خدمة الشخصيات', '1. How long have you worked as a character performer?')}
                {requiredStar}
                {renderMissingBadge('workDuration')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { value: 'أقل من 3 أشهر', label: t('أقل من 3 أشهر', 'Less than 3 months') },
                  { value: '3–6 أشهر', label: t('3–6 أشهر', '3–6 months') },
                  { value: '6–12 شهرًا', label: t('6–12 شهرًا', '6–12 months') },
                  { value: 'أكثر من سنة', label: t('أكثر من سنة', 'More than 1 year') },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setWorkDuration(opt.value)}
                    className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      workDuration === opt.value
                        ? 'bg-[#007C8D] text-white border-[#007C8D]'
                        : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!onlyRequiredMode && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-[#063B44]">
                      {t('2. متوسط عدد زياراتك اليومية', '2. Average daily visits')}
                    </label>
                    <span className="text-xs font-mono font-bold bg-[#BAEBF1]/45 px-2.5 py-1 rounded text-[#063B44] tabular-nums">
                      {t(`${dailyVisitsAvg} زيارات يوميًا`, `${dailyVisitsAvg} visits/day`)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={dailyVisitsAvg}
                    onChange={(e) => setDailyVisitsAvg(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#007C8D]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-2">
                    {t(
                      '3. الفئة العمرية الأغلب لدى الأطفال الذين تزورينهم',
                      '3. Most frequent child age group you visit'
                    )}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { value: 'أقل من 3', label: t('عمر أقل من 3', 'Under 3 yrs') },
                      { value: '3–5', label: t('عمر 3–5', '3–5 yrs') },
                      { value: '6–9', label: t('عمر 6–9', '6–9 yrs') },
                      { value: '10 فأكثر', label: t('عمر 10 فأكثر', '10+ yrs') },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setChildAgeGroup(opt.value)}
                        className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                          childAgeGroup === opt.value
                            ? 'bg-[#007C8D] text-white border-[#007C8D]'
                            : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1.5">
                    {t('4. المناطق والأحياء الأكثر زيارة', '4. Most visited neighborhoods & areas')}
                  </label>
                  <input
                    type="text"
                    value={frequentAreas}
                    onChange={(e) => setFrequentAreas(e.target.value)}
                    placeholder={t('مثال: شمال الرياض، العليا، شرق الرياض...', 'e.g., North district, downtown...')}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              </>
            )}

            <div
              className={
                isFieldMissing('housingType')
                  ? 'p-4 rounded-2xl border border-rose-300 bg-rose-50/40'
                  : ''
              }
            >
              <label className="block text-sm font-bold text-[#063B44] mb-2">
                {t('5. نوع المنزل غالبًا', '5. Usual home / venue type')}
                {requiredStar}
                {renderMissingBadge('housingType')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { value: 'فيلا كبيرة', label: t('فيلا كبيرة', 'Large Villa') },
                  { value: 'فيلا داخل مجمع', label: t('فيلا داخل مجمع', 'Compound Villa') },
                  { value: 'شقة', label: t('شقة', 'Apartment') },
                  { value: 'فندق', label: t('فندق', 'Hotel') },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setHousingType(opt.value)}
                    className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      housingType === opt.value
                        ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                        : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={
                isFieldMissing('doorOpener')
                  ? 'p-4 rounded-2xl border border-rose-300 bg-rose-50/40'
                  : ''
              }
            >
              <label className="block text-sm font-bold text-[#063B44] mb-2">
                {t('6. من يفتح لكِ الباب غالبًا؟', '6. Who usually opens the door for you?')}
                {requiredStar}
                {renderMissingBadge('doorOpener')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { value: 'الأم', label: t('الأم', 'The Mother') },
                  { value: 'الخادمة', label: t('الخادمة', 'The Nanny / Helper') },
                  { value: 'الحارس', label: t('الحارس', 'Security / Guard') },
                  { value: 'أحد أفراد الأسرة', label: t('أحد أفراد الأسرة', 'A Family Member') },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setDoorOpener(opt.value)}
                    className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      doorOpener === opt.value
                        ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                        : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: VISIT PROGRESSION & 10-MINUTES BREAKDOWN */}
        {currentSection === 2 && (
          <div className="space-y-7">
            {!onlyRequiredMode && (
              <div>
                <label className="block text-sm font-bold text-[#063B44] mb-1.5">
                  {t(
                    '7. صفي أول دقيقة بعد دخولك: ماذا يحدث؟ ماذا ترين وتسمعين؟',
                    '7. Describe the first minute after walking in: what happens, what do you see and hear?'
                  )}
                </label>
                <textarea
                  rows={3}
                  value={firstMinuteDesc}
                  onChange={(e) => setFirstMinuteDesc(e.target.value)}
                  placeholder={t(
                    'صفي ردة فعل الطفل، أصوات البيت، نظرات الأهل في اللحظة الأولى...',
                    'Describe the child’s reaction, household energy, and family welcome...'
                  )}
                  className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                />
              </div>
            )}

            <div className={`grid grid-cols-1 ${onlyRequiredMode ? '' : 'sm:grid-cols-2'} gap-4`}>
              {!onlyRequiredMode && (
                <div>
                  <label className="block text-xs font-bold text-[#063B44] mb-2">
                    {t('7-ب. كيف يستقبلك الأهل عادةً؟', '7-B. How do parents usually welcome you?')}
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { value: 'بترحاب كبير ومكان مجهز', label: t('بترحاب كبير ومكان مجهز', 'Warm welcome & prepared space') },
                      { value: 'باستعداد بسيط', label: t('باستعداد بسيط', 'Minimal preparation') },
                      { value: 'بانشغال أو استعجال', label: t('بانشغال أو استعجال', 'Busy or rushed') },
                      { value: 'بتردد أو توتر', label: t('بتردد أو توتر', 'Hesitant or tense') },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setParentsReception(opt.value)}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          dir === 'rtl' ? 'text-right' : 'text-left'
                        } ${
                          parentsReception === opt.value
                            ? 'bg-[#BAEBF1]/35 text-[#063B44] border-[#01AFC5]'
                            : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Replaced Q8: Who usually receives the gift? (3.3) */}
              <div
                className={
                  isFieldMissing('giftRecipient')
                    ? 'p-4 rounded-2xl border border-rose-300 bg-rose-50/40'
                    : ''
                }
              >
                <label className="block text-xs font-bold text-[#063B44] mb-2">
                  {t('8. من الذي يستلم منكِ الهدية في العادة؟', '8. Who usually receives the gift from you?')}
                  {requiredStar}
                  {renderMissingBadge('giftRecipient')}
                </label>
                <div className="space-y-1.5">
                  {[
                    { value: 'الأم', label: t('الأم', 'The Mother') },
                    { value: 'الطفل', label: t('الطفل', 'The Child') },
                    { value: 'الخادمة', label: t('الخادمة', 'The Nanny / Helper') },
                    { value: 'آخرون', label: t('آخرون', 'Others') },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setGiftRecipient(opt.value)}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        dir === 'rtl' ? 'text-right' : 'text-left'
                      } ${
                        giftRecipient === opt.value
                          ? 'bg-[#BAEBF1]/35 text-[#063B44] border-[#01AFC5]'
                          : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* New Question (3.9): Competitor gifts/toys observed */}
            <div
              className={`rounded-2xl p-5 border ${
                isFieldMissing('seenCompetitorGifts')
                  ? 'bg-rose-50/40 border-rose-300'
                  : 'bg-[#F7FAFB] border-[#BAEBF1]'
              }`}
            >
              <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-2.5">
                {t(
                  'هل تشاهدين هدايا أو ألعابًا من شركات أخرى قُدمت للطفل؟',
                  'Do you notice gifts or toys from other companies given to the child?'
                )}
                {requiredStar}
                {renderMissingBadge('seenCompetitorGifts')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'نعم دائمًا', label: t('نعم دائمًا', 'Yes, always') },
                  { value: 'أحيانًا', label: t('أحيانًا', 'Sometimes') },
                  { value: 'لا أذكر', label: t('لا أذكر', 'I do not recall') },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setSeenCompetitorGifts(opt.value)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      seenCompetitorGifts === opt.value
                        ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                        : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!onlyRequiredMode && (
              /* Question 9: 10-Minute Allocation Interactive Tool */
              <div className="bg-[#F7FAFB] border border-[#BAEBF1] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#063B44] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#007C8D]" />
                      <span>
                        {t(
                          '9. كيف توزعين العشر دقائق عادةً في الزيارة؟',
                          '9. How do you usually allocate the 10-minute visit?'
                        )}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t(
                        'اكتبي الدقائق التقريبية لكل مرحلة (المجموع المستهدف: 10 دقائق)',
                        'Enter approximate minutes per stage (target total: 10 minutes)'
                      )}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 tabular-nums ${
                      allocationCalc.isExact
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : allocationCalc.isOver
                        ? 'bg-[#FEC448]/35 text-[#063B44] border border-[#FEC448]'
                        : 'bg-[#BAEBF1]/50 text-[#063B44] border border-[#01AFC5]'
                    }`}
                  >
                    {t('مجموعك:', 'Total:')} {allocationCalc.total} / 10{' '}
                    {t('دقائق', 'mins')} ({getTimeStatusBadge()})
                  </div>
                </div>

                {/* Visual timeline bar */}
                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${(timeAllocation.entrance / Math.max(allocationCalc.total, 10)) * 100}%` }}
                    className="bg-[#063B44] h-full transition-all"
                    title={t('الدخول', 'Entrance')}
                  />
                  <div
                    style={{ width: `${(timeAllocation.gift / Math.max(allocationCalc.total, 10)) * 100}%` }}
                    className="bg-[#FEC448] h-full transition-all"
                    title={t('فتح الهدية', 'Gift Opening')}
                  />
                  <div
                    style={{ width: `${(timeAllocation.play / Math.max(allocationCalc.total, 10)) * 100}%` }}
                    className="bg-[#007C8D] h-full transition-all"
                    title={t('اللعب', 'Play')}
                  />
                  <div
                    style={{ width: `${(timeAllocation.photos / Math.max(allocationCalc.total, 10)) * 100}%` }}
                    className="bg-[#01AFC5] h-full transition-all"
                    title={t('الصور', 'Photos')}
                  />
                  <div
                    style={{ width: `${(timeAllocation.farewell / Math.max(allocationCalc.total, 10)) * 100}%` }}
                    className="bg-[#48CBD9] h-full transition-all"
                    title={t('الوداع', 'Farewell')}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {[
                    { key: 'entrance', label: t('دخول', 'Entrance'), color: 'text-[#063B44]' },
                    { key: 'gift', label: t('فتح الهدية', 'Gift'), color: 'text-[#b47b00]' },
                    { key: 'play', label: t('لعب', 'Play'), color: 'text-[#007C8D]' },
                    { key: 'photos', label: t('صور', 'Photos'), color: 'text-[#019DB2]' },
                    { key: 'farewell', label: t('وداع', 'Farewell'), color: 'text-[#005866]' },
                  ].map((item) => (
                    <div key={item.key} className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <label className={`block text-xs font-bold ${item.color} mb-1`}>
                        {item.label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={(timeAllocation as unknown as Record<string, number>)[item.key]}
                        onChange={(e) =>
                          setTimeAllocation({
                            ...timeAllocation,
                            [item.key]: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full text-center font-mono font-bold text-sm bg-[#F7FAFB] border border-slate-200 rounded-lg py-1 text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] tabular-nums"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {t('دقائق', 'mins')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Q10: Is 10 mins enough? */}
            <div className={`grid grid-cols-1 ${onlyRequiredMode ? '' : 'sm:grid-cols-2'} gap-4`}>
              <div
                className={
                  isFieldMissing('isTenMinutesEnough')
                    ? 'p-4 rounded-2xl border border-rose-300 bg-rose-50/40'
                    : ''
                }
              >
                <label className="block text-xs font-bold text-[#063B44] mb-2">
                  {t('10. هل العشر دقائق كافية؟ (من 1 إلى 5)', '10. Are 10 minutes enough? (1 to 5)')}
                  {requiredStar}
                  {renderMissingBadge('isTenMinutesEnough')}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setIsTenMinutesEnough(val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer tabular-nums ${
                        isTenMinutesEnough === val
                          ? 'bg-[#007C8D] text-white border-[#007C8D]'
                          : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                  <span>{t('1 (غير كافية)', '1 (Not enough)')}</span>
                  <span>{t('5 (كافية جدًا)', '5 (More than enough)')}</span>
                </div>
              </div>

              {!onlyRequiredMode && (
                <div>
                  <label className="block text-xs font-bold text-[#063B44] mb-2">
                    {t('10-ب. لماذا؟ (وضحي السبب)', '10-B. Why? (Please explain)')}
                  </label>
                  <input
                    type="text"
                    value={isTenMinutesEnoughReason}
                    onChange={(e) => setIsTenMinutesEnoughReason(e.target.value)}
                    placeholder={t(
                      'مثال: الأطفال يحتاجون وقتًا لكسر حاجز الخوف...',
                      'e.g., Kids need an extra minute to warm up...'
                    )}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              )}
            </div>

            {!onlyRequiredMode && (
              /* Q11: Overtime Frequency */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#063B44] mb-1">
                    {t(
                      '11. من كل 10 زيارات، كم مرة يتجاوز الوقت العشر دقائق؟',
                      '11. Out of 10 visits, how often does it go past 10 minutes?'
                    )}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={overflowFrequency}
                    onChange={(e) => setOverflowFrequency(Number(e.target.value))}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2 text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#063B44] mb-1">
                    {t('11-ب. بكم دقيقة تقريبًا يتجاوز الوقت عادةً؟', '11-B. By how many minutes on average?')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={overflowMinutesAvg}
                    onChange={(e) => setOverflowMinutesAvg(Number(e.target.value))}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2 text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-mono tabular-nums"
                  />
                </div>
              </div>
            )}

            {/* Photo frequency & late arrival */}
            <div className="bg-[#FEF4E3]/70 border border-[#FEC448]/60 rounded-2xl p-5 space-y-5">
              <div
                className={
                  isFieldMissing('photoFrequencyOutOfTen')
                    ? 'p-3.5 rounded-xl border border-rose-300 bg-rose-50/50'
                    : ''
                }
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                  <label className="text-xs sm:text-sm font-bold text-[#063B44]">
                    {t(
                      'كم من كل عشر زيارات يتم فيها تصوير الشخصية مع الأطفال؟',
                      'Out of 10 visits, how often is the character photographed with the children?'
                    )}
                    {requiredStar}
                    {renderMissingBadge('photoFrequencyOutOfTen')}
                  </label>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-lg tabular-nums ${
                      photoFrequencyOutOfTen === null
                        ? 'bg-white text-slate-600 border border-slate-200'
                        : 'bg-[#007C8D] text-white'
                    }`}
                  >
                    {photoFrequencyOutOfTen === null
                      ? t('لم يُحدد بعد (اختاري 0–10)', 'Select 0–10')
                      : t(`${photoFrequencyOutOfTen} من 10 زيارات`, `${photoFrequencyOutOfTen} / 10 visits`)}
                  </span>
                </div>
                {renderOutOfTenSelector(photoFrequencyOutOfTen, setPhotoFrequencyOutOfTen)}
              </div>

              <div className="pt-4 border-t border-[#FEC448]/40 space-y-4">
                <div
                  className={
                    isFieldMissing('lateArrivalOutOfTen')
                      ? 'p-3.5 rounded-xl border border-rose-300 bg-rose-50/50'
                      : ''
                  }
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                    <label className="text-xs sm:text-sm font-bold text-[#063B44]">
                      {t('كم من كل عشر زيارات تصلين متأخرة؟', 'Out of 10 visits, how often do you arrive late?')}
                      {requiredStar}
                      {renderMissingBadge('lateArrivalOutOfTen')}
                    </label>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg tabular-nums ${
                        lateArrivalOutOfTen === null
                          ? 'bg-white text-slate-600 border border-slate-200'
                          : 'bg-[#007C8D] text-white'
                      }`}
                    >
                      {lateArrivalOutOfTen === null
                        ? t('لم يُحدد بعد (اختاري 0–10)', 'Select 0–10')
                        : t(`${lateArrivalOutOfTen} من 10 زيارات`, `${lateArrivalOutOfTen} / 10 visits`)}
                    </span>
                  </div>
                  {renderOutOfTenSelector(lateArrivalOutOfTen, setLateArrivalOutOfTen)}
                </div>

                {!onlyRequiredMode && (
                  <div>
                    <label className="block text-xs font-bold text-[#063B44] mb-1">
                      {t('وبماذا تبررين التأخير للعميل؟', 'How do you justify the delay to the client?')}
                    </label>
                    <input
                      type="text"
                      value={lateArrivalJustification}
                      onChange={(e) => setLateArrivalJustification(e.target.value)}
                      placeholder={t(
                        'مثال: زحام الطريق، خطأ اللوكيشن، أو تأخر الزيارة السابقة...',
                        'e.g., traffic, inaccurate pin location, previous visit delay...'
                      )}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                    />
                  </div>
                )}
              </div>
            </div>

            {!onlyRequiredMode && (
              <div>
                <label className="block text-sm font-bold text-[#063B44] mb-1">
                  {t(
                    '12. ماذا يحدث في آخر دقيقتين؟ كيف تنتهي الزيارة غالبًا؟',
                    '12. What happens in the last 2 minutes? How does the visit usually end?'
                  )}
                </label>
                <textarea
                  rows={2}
                  value={lastTwoMinutesDesc}
                  onChange={(e) => setLastTwoMinutesDesc(e.target.value)}
                  placeholder={t('صفي لحظة الوداع وطلب الصور الأخيرة...', 'Describe the goodbye moment and last photos...')}
                  className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                />
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: THE CHILD */}
        {currentSection === 3 && (
          <div className="space-y-6">
            {!onlyRequiredMode && (
              <>
                <div className="bg-[#F7FAFB] border border-[#BAEBF1] rounded-2xl p-5">
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t(
                      '15. من كل 10 زيارات، كم مرة يكون رد فعل الطفل عند دخولك:',
                      '15. Out of 10 visits, how often is the child’s reaction on arrival:'
                    )}
                  </label>
                  <p className="text-xs text-slate-500 mb-4">
                    {t('اكتبي رقمًا من 0 إلى 10 لكل رد فعل:', 'Enter a number from 0 to 10 for each reaction:')}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    {[
                      { key: 'directJoy', label: t('فرح مباشر', 'Immediate Joy') },
                      { key: 'shyness', label: t('خجل أو ترقب', 'Shyness / Caution') },
                      { key: 'fearOrCrying', label: t('خوف أو بكاء', 'Fear or Crying') },
                      { key: 'extremeAttachment', label: t('تعلّق شديد', 'Strong Attachment') },
                    ].map((item) => (
                      <div key={item.key} className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-[#063B44] block mb-1">{item.label}</span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={(childReactions as unknown as Record<string, number>)[item.key]}
                          onChange={(e) =>
                            setChildReactions({
                              ...childReactions,
                              [item.key]: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full text-center font-mono font-bold text-sm bg-[#F7FAFB] border border-slate-200 rounded-lg py-1 text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] tabular-nums"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t('16. كيف تتعاملين مع الطفل الخائف أو الخجول؟', '16. How do you handle a scared or shy child?')}
                  </label>
                  <textarea
                    rows={2}
                    value={handlingScaredChild}
                    onChange={(e) => setHandlingScaredChild(e.target.value)}
                    placeholder={t('حركاتك، المسافة، مشاركة الأم...', 'Movements, keeping distance, engaging Mom...')}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              </>
            )}

            <div
              className={
                isFieldMissing('giftOpeningReaction')
                  ? 'p-4 rounded-2xl border border-rose-300 bg-rose-50/40'
                  : ''
              }
            >
              <label className="block text-sm font-bold text-[#063B44] mb-2">
                {t('17. ماذا يفعل الطفل أول ما يفتح الهدية؟', '17. What does the child do right after opening the gift?')}
                {requiredStar}
                {renderMissingBadge('giftOpeningReaction')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: 'يلعب بها فورًا', label: t('يلعب بها فورًا', 'Plays with it right away') },
                  { value: 'ينظر إليك ويطلب منك أن تلعبي', label: t('ينظر إليك ويطلب منك أن تلعبي', 'Asks you to play along') },
                  { value: 'يطلب مساعدة أمه', label: t('يطلب مساعدة أمه', 'Asks Mom for help') },
                  { value: 'يتركها ويلعب معك', label: t('يتركها ويلعب معك', 'Leaves it and plays with the character') },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setGiftOpeningReaction(opt.value)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      dir === 'rtl' ? 'text-right' : 'text-left'
                    } ${
                      giftOpeningReaction === opt.value
                        ? 'bg-[#007C8D] text-white border-[#007C8D]'
                        : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!onlyRequiredMode && (
              <div>
                <label className="block text-sm font-bold text-[#063B44] mb-1">
                  {t(
                    '18. هل يسأل الأطفال عن أشياء أخرى (شخصيات أخرى، كيك، سيارات)؟ ما أكثر ما يطلبونه؟',
                    '18. Do children ask for other things (characters, cake, cars)? What do they ask for most?'
                  )}
                </label>
                <input
                  type="text"
                  value={childrenSpecialRequests}
                  onChange={(e) => setChildrenSpecialRequests(e.target.value)}
                  placeholder={t('اكتبي أكثر الأشياء التي يطلبها الأطفال منكِ...', 'List common child requests...')}
                  className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                />
              </div>
            )}

            {/* New Question (3.1): Other children asking for gifts for themselves & how staff reply */}
            <div
              className={`border rounded-2xl p-5 space-y-4 ${
                isFieldMissing('otherChildrenGiftAskOutOfTen')
                  ? 'bg-rose-50/40 border-rose-300'
                  : 'bg-[#BAEBF1]/25 border-[#BAEBF1]'
              }`}
            >
              <div>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                  <label className="text-xs sm:text-sm font-bold text-[#063B44]">
                    {t(
                      'كم من كل عشرة زيارات سألكِ بقية الأطفال عن هدايا لهم؟',
                      'Out of 10 visits, how often do other children ask you for gifts for themselves?'
                    )}
                    {requiredStar}
                    {renderMissingBadge('otherChildrenGiftAskOutOfTen')}
                  </label>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-lg tabular-nums ${
                      otherChildrenGiftAskOutOfTen === null
                        ? 'bg-white text-slate-600 border border-slate-200'
                        : 'bg-[#007C8D] text-white'
                    }`}
                  >
                    {otherChildrenGiftAskOutOfTen === null
                      ? t('لم يُحدد بعد (اختاري 0–10)', 'Select 0–10')
                      : t(`${otherChildrenGiftAskOutOfTen} من 10 زيارات`, `${otherChildrenGiftAskOutOfTen} / 10 visits`)}
                  </span>
                </div>
                {renderOutOfTenSelector(otherChildrenGiftAskOutOfTen, setOtherChildrenGiftAskOutOfTen)}
              </div>

              {!onlyRequiredMode && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-1.5">
                    {t('وبماذا تجيبين غالبًا على بقية الأطفال؟', 'And how do you usually respond to the other children?')}
                  </label>
                  <textarea
                    rows={2}
                    value={otherChildrenGiftReply}
                    onChange={(e) => setOtherChildrenGiftReply(e.target.value)}
                    placeholder={t(
                      'اكتبي ما تقولينه أو تفعلينه عند سؤال الإخوة أو بقية الأطفال عن هدايا لهم...',
                      'Write what you usually say or do when siblings or other children ask for a gift...'
                    )}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              )}
            </div>

            {!onlyRequiredMode && (
              <div>
                <label className="block text-sm font-bold text-[#063B44] mb-1">
                  {t(
                    '20. هل يتعلق الطفل بالشخصية ويرفض أن تغادري؟ كيف تتصرفين؟',
                    '20. Does the child become attached and refuse to let you leave? How do you handle it?'
                  )}
                </label>
                <textarea
                  rows={2}
                  value={handlingAttachmentOnLeave}
                  onChange={(e) => setHandlingAttachmentOnLeave(e.target.value)}
                  placeholder={t('طريقتكِ في الوداع دون إحداث بكاء...', 'Your gentle exit routine without tears...')}
                  className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                />
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: MOM & FAMILY */}
        {currentSection === 4 && (
          <div className="space-y-6">
            {!onlyRequiredMode && (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-2">
                    {t(
                      '22. من يحضر عادةً الزيارة؟ (يمكن اختيار أكثر من إجابة)',
                      '22. Who usually attends the visit? (Select all that apply)'
                    )}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'الأم', label: t('الأم', 'Mother') },
                      { value: 'الأب', label: t('الأب', 'Father') },
                      { value: 'الجدة', label: t('الجدة', 'Grandmother') },
                      { value: 'إخوة', label: t('إخوة', 'Siblings') },
                      { value: 'أقارب', label: t('أقارب', 'Relatives') },
                      { value: 'مربية أو خادمة', label: t('مربية أو خادمة', 'Nanny / Helper') },
                      { value: 'ضيوف', label: t('ضيوف', 'Guests') },
                    ].map((person) => {
                      const isChecked = whoAttends.includes(person.value);
                      return (
                        <button
                          type="button"
                          key={person.value}
                          onClick={() => {
                            if (isChecked) setWhoAttends(whoAttends.filter((p) => p !== person.value));
                            else setWhoAttends([...whoAttends, person.value]);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                            isChecked
                              ? 'bg-[#BAEBF1]/35 text-[#063B44] border-[#01AFC5]'
                              : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/20'
                          }`}
                        >
                          <span>{person.label}</span>
                          {isChecked && <CheckCircle2 className="w-4 h-4 text-[#007C8D] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t(
                      '23. ماذا تفعل الأم أثناء الزيارة؟ (تصوّر، تشارك باللعب، تراقب، تغادر الغرفة...)',
                      '23. What does the mother usually do during the visit? (films, joins in, observes, steps away...)'
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={momBehaviorDuringVisit}
                    onChange={(e) => setMomBehaviorDuringVisit(e.target.value)}
                    placeholder={t('صفي سلوك الأم الأكثر تكرارًا...', 'Describe the most common maternal behavior...')}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              </>
            )}

            {/* New Question (3.8): Who converses with the character the most? */}
            <div
              className={`border rounded-2xl p-5 ${
                isFieldMissing('primaryConversationPartner')
                  ? 'bg-rose-50/40 border-rose-300'
                  : 'bg-[#F7FAFB] border-[#BAEBF1]'
              }`}
            >
              <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-2.5">
                {t(
                  'أثناء الزيارة، من الذي يتبادل معكِ الحديث أكثر؟',
                  'During the visit, who engages with you in conversation the most?'
                )}
                {requiredStar}
                {renderMissingBadge('primaryConversationPartner')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'الأم', label: t('الأم', 'The Mother') },
                  { value: 'الطفل', label: t('الطفل', 'The Child') },
                  { value: 'الأم والطفل', label: t('الأم والطفل', 'Mother & Child') },
                  { value: 'ضيوف آخرون', label: t('ضيوف آخرون', 'Other Guests') },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setPrimaryConversationPartner(opt.value)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      primaryConversationPartner === opt.value
                        ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                        : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!onlyRequiredMode && (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t('24. اكتبي ثلاثة أسئلة تسألها الأمهات أكثر من غيرها', '24. List the top three questions mothers ask most')}
                  </label>
                  <input
                    type="text"
                    value={topThreeMomQuestions}
                    onChange={(e) => setTopThreeMomQuestions(e.target.value)}
                    placeholder="1- ... 2- ... 3- ..."
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>

                {/* Updated Q25 (3.4): Restricted to the 5 requested topics */}
                <div className="bg-[#F7FAFB] border border-[#BAEBF1] rounded-2xl p-5">
                  <label className="block text-sm font-bold text-[#063B44] mb-3">
                    {t(
                      '25. كم مرة تسأل الأمهات عن كل موضوع من كل 10 زيارات؟',
                      '25. Out of 10 visits, how often do mothers ask about each topic?'
                    )}
                  </label>
                  <div className="space-y-2.5">
                    {[
                      { value: 'الأسعار', label: t('الأسعار', 'Pricing') },
                      { value: 'شخصيات أخرى', label: t('شخصيات أخرى', 'Other Characters') },
                      {
                        value: 'كيدزي ميديا (إنستا / سناب)',
                        label: t('كيدزي ميديا (إنستا / سناب)', 'Kidzy Media (Insta / Snap)'),
                      },
                      { value: 'التطبيق أو الموقع', label: t('التطبيق أو الموقع', 'App or Website') },
                      { value: 'خدمة العملاء', label: t('خدمة العملاء', 'Customer Service') },
                    ].map((topic) => (
                      <div
                        key={topic.value}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200"
                      >
                        <span className="text-xs font-bold text-[#063B44] min-w-[160px]">{topic.label}</span>
                        <div className="flex flex-wrap gap-1.5 flex-1 justify-end">
                          {[
                            { value: 'لا يحدث', label: t('لا يحدث', 'Never') },
                            { value: '1–3 مرات', label: t('1–3 مرات', '1–3 times') },
                            { value: '4–6 مرات', label: t('4–6 مرات', '4–6 times') },
                            { value: '7–10 مرات', label: t('7–10 مرات', '7–10 times') },
                          ].map((opt) => (
                            <button
                              type="button"
                              key={opt.value}
                              onClick={() =>
                                setMomInquiriesFrequency({
                                  ...momInquiriesFrequency,
                                  [topic.value]: opt.value,
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                                momInquiriesFrequency[topic.value] === opt.value
                                  ? 'bg-[#007C8D] text-white border-[#007C8D]'
                                  : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* New Question (3.6a): Do moms know the visit is 10 mins + conditional reaction */}
            <div
              className={`border rounded-2xl p-5 space-y-4 ${
                isFieldMissing('momsKnowTenMinLimit')
                  ? 'bg-rose-50/40 border-rose-300'
                  : 'bg-[#FEF4E3]/80 border-[#FEC448]/70'
              }`}
            >
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-2">
                  {t(
                    'هل تعلم الأمهات أن وقت الزيارة 10 دقائق؟',
                    'Do mothers know that the visit lasts 10 minutes?'
                  )}
                  {requiredStar}
                  {renderMissingBadge('momsKnowTenMinLimit')}
                </label>
                <div className="grid grid-cols-2 gap-2.5 max-w-sm">
                  {[
                    { value: 'نعم', label: t('نعم', 'Yes') },
                    { value: 'لا', label: t('لا', 'No') },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setMomsKnowTenMinLimit(opt.value)}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        momsKnowTenMinLimit === opt.value
                          ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                          : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {!onlyRequiredMode && momsKnowTenMinLimit === 'لا' && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-1.5">
                    {t('إذا كانت الإجابة لا، صفي ردة فعلها:', 'If the answer is No, describe her reaction:')}
                  </label>
                  <textarea
                    rows={2}
                    value={momsUnawareTenMinReaction}
                    onChange={(e) => setMomsUnawareTenMinReaction(e.target.value)}
                    placeholder={t(
                      'صفي ردة فعل الأم عندما تفاجأ بأن مدة الزيارة 10 دقائق فقط...',
                      'Describe how the mother reacts upon learning the visit is only 10 minutes...'
                    )}
                    className="w-full bg-white border border-[#FEC448] rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              )}
            </div>

            {/* New Question (3.2): Extra toys in car ask frequency */}
            <div
              className={`border rounded-2xl p-5 ${
                isFieldMissing('extraToysInCarAskOutOfTen')
                  ? 'bg-rose-50/40 border-rose-300'
                  : 'bg-[#F7FAFB] border-[#BAEBF1]'
              }`}
            >
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <label className="text-xs sm:text-sm font-bold text-[#063B44]">
                  {t(
                    'كم من كل عشرة زيارات سألكِ أولياء الأمور عن توفر ألعاب إضافية في السيارة؟',
                    'Out of 10 visits, how often do parents ask if extra toys are available in the car?'
                  )}
                  {requiredStar}
                  {renderMissingBadge('extraToysInCarAskOutOfTen')}
                </label>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-lg tabular-nums ${
                    extraToysInCarAskOutOfTen === null
                      ? 'bg-white text-slate-600 border border-slate-200'
                      : 'bg-[#007C8D] text-white'
                  }`}
                >
                  {extraToysInCarAskOutOfTen === null
                    ? t('لم يُحدد بعد (اختاري 0–10)', 'Select 0–10')
                    : t(`${extraToysInCarAskOutOfTen} من 10 زيارات`, `${extraToysInCarAskOutOfTen} / 10 visits`)}
                </span>
              </div>
              {renderOutOfTenSelector(extraToysInCarAskOutOfTen, setExtraToysInCarAskOutOfTen)}
            </div>

            {/* Updated Q26 (3.5) + CS feedback + App complaints */}
            <div className="bg-[#FEF4E3]/60 border border-[#FEC448]/60 rounded-2xl p-5 space-y-4">
              <div
                className={
                  isFieldMissing('pricingSentiment')
                    ? 'p-3.5 rounded-xl border border-rose-300 bg-rose-50/50'
                    : ''
                }
              >
                <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-1.5">
                  {t(
                    '26. ما هي التعليقات التي تسمعينها غالبًا عن الأسعار؟',
                    '26. What comments do you usually hear about pricing?'
                  )}
                  {requiredStar}
                  {renderMissingBadge('pricingSentiment')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'غالية جدا', label: t('غالية جدا', 'Very Expensive') },
                    { value: 'غالية', label: t('غالية', 'Expensive') },
                    { value: 'معقولة', label: t('معقولة', 'Reasonable') },
                    { value: 'لا توجد تعليقات', label: t('لا توجد تعليقات', 'No Comments') },
                  ].map((sent) => (
                    <button
                      type="button"
                      key={sent.value}
                      onClick={() => setPricingSentiment(sent.value)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        pricingSentiment === sent.value
                          ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                          : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                      }`}
                    >
                      {sent.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`pt-3 border-t border-[#FEC448]/40 ${
                  isFieldMissing('customerServiceFeedback')
                    ? 'p-3.5 rounded-xl border border-rose-300 bg-rose-50/50'
                    : ''
                }`}
              >
                <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-1.5">
                  {t('ما هي تعليقات العملاء عن خدمة العملاء؟', 'What do clients say about Customer Service?')}
                  {requiredStar}
                  {renderMissingBadge('customerServiceFeedback')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  {[
                    { value: 'تأخر في الرد', label: t('تأخر في الرد', 'Delayed response') },
                    { value: 'عدم الاستجابة', label: t('عدم الاستجابة', 'Unresponsive') },
                    { value: 'استجابة ممتازة وسريعة', label: t('استجابة ممتازة وسريعة', 'Fast & helpful support') },
                  ].map((csOpt) => (
                    <button
                      type="button"
                      key={csOpt.value}
                      onClick={() => setCustomerServiceFeedback(csOpt.value)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        customerServiceFeedback === csOpt.value
                          ? 'bg-[#007C8D] text-white border-[#007C8D]'
                          : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                      }`}
                    >
                      {csOpt.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder={t('أخرى (اذكريها إن وجدت)...', 'Other comments (if any)...')}
                  value={otherCSFeedback}
                  onChange={(e) => setOtherCSFeedback(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                />
              </div>

              {!onlyRequiredMode && (
                <div className="pt-3 border-t border-[#FEC448]/40">
                  <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-1">
                    {t(
                      'سؤال عن شكوى أو انزعاج من العملاء بخصوص التطبيق أو الموقع: عن ماذا يشتكون بالضبط؟',
                      'Are there any client complaints about the app or website? What exactly do they complain about?'
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={appWebsiteComplaints}
                    onChange={(e) => setAppWebsiteComplaints(e.target.value)}
                    placeholder={t(
                      'صفي أي شكاوى سمعتها من الأمهات تخص التطبيق أو الموقع (طريقة الحجز، الدفع، الخريطة، صور الشخصيات)...',
                      'Describe specific app/website issues reported by mothers (booking flow, payment, map pin, character photos)...'
                    )}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              )}
            </div>

            {!onlyRequiredMode && (
              <div>
                <label className="block text-sm font-bold text-[#063B44] mb-2">
                  {t(
                    '27. متى تكون الأم أكثر انفتاحًا لاقتراح أو عرض جديد؟',
                    '27. When is the mother most open to hearing a new suggestion or offer?'
                  )}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'قبل اللعب', label: t('قبل اللعب', 'Before Play') },
                    { value: 'أثناء اللعب', label: t('أثناء اللعب', 'During Play') },
                    { value: 'عند الوداع', label: t('عند الوداع', 'At Farewell') },
                    { value: 'لا أعرف', label: t('لا أعرف', 'Not sure') },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setBestTimingForOffers(opt.value)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                        bestTimingForOffers === opt.value
                          ? 'bg-[#007C8D] text-white border-[#007C8D]'
                          : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 5: DIFFICULT SCENARIOS */}
        {currentSection === 5 && (
          <div className="space-y-6">
            {!onlyRequiredMode && (
              <div className="bg-[#FEF4E3]/80 border border-[#FEC448]/70 rounded-2xl p-4 text-xs text-[#063B44] leading-relaxed">
                <strong>{t('توجيه الإجابة:', 'How to answer:')}</strong>{' '}
                {t(
                  'لكل موقف أجيبي باختصار عما تفعلينه عادةً، وما تقولينه بالنص تقريبًا.',
                  'For each situation, briefly share what you usually do and what you roughly say.'
                )}
              </div>
            )}

            {/* Overtime Situation */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#BAEBF1]/50 text-[#063B44] text-xs font-bold flex items-center justify-center tabular-nums">
                  1
                </span>
                <h3 className="text-sm font-bold text-[#063B44]">
                  {t('الموقف 1: الأم تطلب مزيدًا من الوقت', 'Situation 1: Mother asks for extra time')}
                </h3>
              </div>

              {!onlyRequiredMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#063B44] mb-1">
                      {t('31. كم مرة يحدث هذا من كل 10 زيارات؟', '31. How often does this happen out of 10 visits?')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={momOvertime.frequency}
                      onChange={(e) => setMomOvertime({ ...momOvertime, frequency: Number(e.target.value) })}
                      className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#063B44] mb-1">
                      {t('32. كم دقيقة تطلب الأم عادةً؟', '32. How many extra minutes do mothers usually ask for?')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={momOvertime.requestedMinutes}
                      onChange={(e) => setMomOvertime({ ...momOvertime, requestedMinutes: Number(e.target.value) })}
                      className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-mono tabular-nums"
                    />
                  </div>
                </div>
              )}

              <div
                className={
                  isFieldMissing('momOvertimeStaffAction')
                    ? 'p-3.5 rounded-xl border border-rose-300 bg-rose-50/40'
                    : ''
                }
              >
                <label className="block text-xs font-bold text-[#063B44] mb-1.5">
                  {t('33. ما الذي تفعلينه عادةً؟', '33. What do you usually do?')}
                  {requiredStar}
                  {renderMissingBadge('momOvertimeStaffAction')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    { value: 'أوافق فورًا دون مقابل', label: t('أوافق فورًا دون مقابل', 'Agree immediately for free') },
                    { value: 'أوافق بعد إذن المشرفة', label: t('أوافق بعد إذن المشرفة', 'Agree after supervisor approval') },
                    { value: 'أعرض تمديدًا مدفوعًا', label: t('أعرض تمديدًا مدفوعًا', 'Offer a paid extension') },
                    { value: 'أقترح موعدًا آخر لزيارة أطول', label: t('أقترح موعدًا آخر لزيارة أطول', 'Suggest booking a longer future visit') },
                    { value: 'أعتذر بسبب موعد الزيارة التالية', label: t('أعتذر بسبب موعد الزيارة التالية', 'Polite decline due to next visit') },
                  ].map((act) => (
                    <button
                      type="button"
                      key={act.value}
                      onClick={() => setMomOvertime({ ...momOvertime, staffAction: act.value })}
                      className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                        dir === 'rtl' ? 'text-right' : 'text-left'
                      } ${
                        momOvertime.staffAction === act.value
                          ? 'bg-[#BAEBF1]/35 text-[#063B44] border-[#01AFC5]'
                          : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/15'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {!onlyRequiredMode && (
                <div>
                  <label className="block text-xs font-bold text-[#063B44] mb-1">
                    {t(
                      '36. ما الذي تتمنين أن تقوله الإدارة لكِ في هذا الموقف؟',
                      '36. What guidance would you like from management for this situation?'
                    )}
                  </label>
                  <input
                    type="text"
                    value={momOvertime.wishedCompanyGuidance}
                    onChange={(e) => setMomOvertime({ ...momOvertime, wishedCompanyGuidance: e.target.value })}
                    placeholder={t(
                      'مثال: وضع خيار دفع إلكتروني إضافي فوري...',
                      'e.g., an instant digital paid-extension option...'
                    )}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              )}
            </div>

            {!onlyRequiredMode && (
              <>
                {/* Situations 37, 38, 39, 40 — Part (ج) guidance removed per request (3.6b) */}
                {DIFFICULT_SITUATIONS.slice(0, 4).map((sit) => {
                  const currentAns = situations[sit.id] || { action: '', phrase: '', guidance: '', outcome: '' };
                  return (
                    <div key={sit.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#BAEBF1]/40 text-[#063B44] text-xs font-bold flex items-center justify-center font-mono tabular-nums">
                          {sit.number}
                        </span>
                        <h3 className="text-sm font-bold text-[#063B44]">
                          {lang === 'en' ? sit.titleEn : sit.title}
                        </h3>
                      </div>
                      {(sit.contextHint || sit.contextHintEn) && (
                        <p className="text-xs text-slate-500">
                          {lang === 'en' ? sit.contextHintEn || sit.contextHint : sit.contextHint}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-[#063B44] mb-1">
                            {t('(أ) ما الذي تفعلينه عادةً؟', '(A) What do you usually do?')}
                          </label>
                          <input
                            type="text"
                            value={currentAns.action}
                            onChange={(e) => handleSituationChange(sit.id, 'action', e.target.value)}
                            placeholder={t('تصرفكِ العملي...', 'Your practical action...')}
                            className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#063B44] mb-1">
                            {t('(ب) ماذا تقولين بالنص تقريبًا؟', '(B) What do you roughly say?')}
                          </label>
                          <input
                            type="text"
                            value={currentAns.phrase}
                            onChange={(e) => handleSituationChange(sit.id, 'phrase', e.target.value)}
                            placeholder={t('الجملة التي توجهينها للأهل أو الطفل...', 'The exact phrase you use...')}
                            className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t(
                      '49. أي موقف آخر صعب مررتِ به ولم نذكره، وكيف تصرفتِ؟',
                      '49. Any other difficult situation we didn’t mention, and how did you handle it?'
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={otherDifficultSituations}
                    onChange={(e) => setOtherDifficultSituations(e.target.value)}
                    placeholder={t(
                      'مواقف في الممرات، المصاعد، الحيوانات الأليفة...',
                      'Hallway situations, elevators, pets...'
                    )}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* SECTION 6: UNTAPPED OPPORTUNITIES */}
        {currentSection === 6 && (
          <div className="space-y-6">
            {!onlyRequiredMode && (
              <div>
                <label className="block text-sm font-bold text-[#063B44] mb-1">
                  {t(
                    '50. ما الأشياء التي تقولها الأمهات أو الأطفال وتشعرين أننا لا نستفيد منها؟',
                    '50. What comments from mothers or children feel like untapped opportunities?'
                  )}
                </label>
                <textarea
                  rows={3}
                  value={unleveragedMomChildComments}
                  onChange={(e) => setUnleveragedMomChildComments(e.target.value)}
                  placeholder={t(
                    'أفكار، رغبات، منتجات يسألون عنها...',
                    'Ideas, wishes, products they keep asking for...'
                  )}
                  className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                />
              </div>
            )}

            {/* Updated Q51 (3.7): exact wording + 3 exact options */}
            <div
              className={
                isFieldMissing('potentialServices')
                  ? 'p-4 rounded-2xl border border-rose-300 bg-rose-50/40'
                  : ''
              }
            >
              <label className="block text-sm font-bold text-[#063B44] mb-2">
                {t(
                  '51. ما الذي يمكن أن نقدمه للأسرة ولا نقدمه الآن؟ (يمكن اختيار أكثر من خيار)',
                  '51. What could we offer the family that we do not currently offer? (Multi-select)'
                )}
                {requiredStar}
                {renderMissingBadge('potentialServices')}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    value: 'زيارة أطول',
                    label: t('زيارة أطول', 'Longer visit duration'),
                  },
                  {
                    value: 'ألعاب إضافية في السيارة للشراء المباشر لبقية الأطفال',
                    label: t(
                      'ألعاب إضافية في السيارة للشراء المباشر لبقية الأطفال',
                      'Extra toys in the car for direct purchase for other children'
                    ),
                  },
                  {
                    value: 'بطاقة أو ذكرى تبقى في المنزل',
                    label: t(
                      'بطاقة أو ذكرى تبقى في المنزل',
                      'A keepsake card or memento that stays at home'
                    ),
                  },
                ].map((serv) => {
                  const isChecked = potentialServices.includes(serv.value);
                  return (
                    <button
                      type="button"
                      key={serv.value}
                      onClick={() => {
                        if (isChecked) {
                          setPotentialServices(potentialServices.filter((s) => s !== serv.value));
                        } else {
                          setPotentialServices([...potentialServices, serv.value]);
                        }
                      }}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between cursor-pointer ${
                        dir === 'rtl' ? 'text-right' : 'text-left'
                      } ${
                        isChecked
                          ? 'bg-[#BAEBF1]/35 text-[#063B44] border-[#01AFC5]'
                          : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/20'
                      }`}
                    >
                      <span>{serv.label}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-[#007C8D] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {!onlyRequiredMode && (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t('54. ما الذي يمنعكِ من اقتراح أي شيء على الأم؟', '54. What holds you back from suggesting extra services to the mother?')}
                  </label>
                  <input
                    type="text"
                    value={frictionInProposing}
                    onChange={(e) => setFrictionInProposing(e.target.value)}
                    placeholder={t(
                      'الوقت، الحرج، عدم وجود تعليمات، الخوف من إزعاج الأسرة...',
                      'Short time, awkwardness, lack of guidelines...'
                    )}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t('55. ما الرسالة الواحدة التي تتمنين أن تصل إلى الأم عن كيدزي؟', '55. What is one message you wish every mother knew about us?')}
                  </label>
                  <input
                    type="text"
                    value={oneMessageAboutKidzy}
                    onChange={(e) => setOneMessageAboutKidzy(e.target.value)}
                    placeholder={t('رسالة معنوية أو قيمة واضحة...', 'Clear brand value or reassurance message...')}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* SECTION 7: OPEN QUESTIONS (Published Section 7 — Old Sec 7 & 8 Unpublished per 3.10) */}
        {currentSection === 7 && (
          <div className="space-y-6">
            {!onlyRequiredMode && (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t('أجمل زيارة مررتِ بها، وماذا جعلها كذلك؟', 'Best visit you have ever had, and what made it special?')}
                  </label>
                  <textarea
                    rows={2}
                    value={bestVisitExperience}
                    onChange={(e) => setBestVisitExperience(e.target.value)}
                    placeholder={t('موقف مؤثر، فرحة استثنائية...', 'Heartwarming moment, unforgettable reaction...')}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t('أصعب زيارة مررتِ بها، وماذا تعلمتِ منها؟', 'Hardest visit you had, and what did you learn from it?')}
                  </label>
                  <textarea
                    rows={2}
                    value={hardestVisitExperience}
                    onChange={(e) => setHardestVisitExperience(e.target.value)}
                    placeholder={t('تحدي صعب، درس ميداني...', 'Tough challenge, field lesson...')}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#063B44] mb-1">
                    {t(
                      'ما الذي يجب أن يعرفه المسؤولون عن هذه الخدمة ولا يعرفونه؟',
                      'What should leadership know about the field reality that reports miss?'
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={messageToLeadership}
                    onChange={(e) => setMessageToLeadership(e.target.value)}
                    placeholder={t('حقيقة من الميدان لا تظهر في التقارير الرقمية...', 'A field truth not visible in numbers...')}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>
              </>
            )}

            <div
              className={
                isFieldMissing('firstThingToChange')
                  ? 'p-4 rounded-2xl border border-rose-300 bg-rose-50/40'
                  : ''
              }
            >
              <label className="block text-sm font-bold text-[#063B44] mb-1">
                {t('لو كان القرار بيدكِ، ما أول شيء تغيّرينه في الزيارة؟', 'If you could change one thing immediately, what would it be?')}
                {requiredStar}
                {renderMissingBadge('firstThingToChange')}
              </label>
              <input
                type="text"
                value={firstThingToChange}
                onChange={(e) => setFirstThingToChange(e.target.value)}
                placeholder={t('تغيير فوري في الوقت أو الهدايا أو الزي...', 'Immediate change to timing, gifts, or logistics...')}
                className={`w-full bg-[#F7FAFB] border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] ${
                  isFieldMissing('firstThingToChange') ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
            </div>

            {!onlyRequiredMode && (
              <div>
                <label className="block text-sm font-bold text-[#063B44] mb-1">
                  {t('هل هناك شيء آخر تودين قوله؟', 'Is there anything else you would like to add?')}
                </label>
                <textarea
                  rows={2}
                  value={finalComments}
                  onChange={(e) => setFinalComments(e.target.value)}
                  placeholder={t('أي ملاحظة أو كلمة ختامية...', 'Any closing thoughts or suggestions...')}
                  className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                />
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Section Navigation Buttons */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentSection === 1}
            onClick={() => setCurrentSection((c) => Math.max(1, c - 1))}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#063B44] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{t('القسم السابق', 'Previous')}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#063B44] hover:bg-[#BAEBF1]/20 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#007C8D]" />
              <span>
                {draftSavedToast ? t('حُفظت!', 'Saved!') : t('حفظ مسودة', 'Save Draft')}
              </span>
            </button>

            {currentSection < totalSections && requiredProgress.isComplete && consent && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void submitSurveyNow()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer tabular-nums"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? t('جاري الإرسال...', 'Submitting...')
                    : t(
                        `إرسال الآن (${requiredProgress.completedCount}/${requiredProgress.requiredCount})`,
                        `Submit Now (${requiredProgress.completedCount}/${requiredProgress.requiredCount})`
                      )}
                </span>
              </button>
            )}

            {currentSection < totalSections ? (
              <button
                type="button"
                onClick={() => setCurrentSection((c) => Math.min(totalSections, c + 1))}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[#007C8D] hover:bg-[#005866] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer tabular-nums"
              >
                <span>{t(`القسم التالي (${currentSection + 1})`, `Next (${currentSection + 1})`)}</span>
                {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-[#007C8D] hover:bg-[#005866] disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? t('جاري الإرسال...', 'Submitting...')
                    : t('إرسال الاستبيان الآن', 'Submit Survey Now')}
                </span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
