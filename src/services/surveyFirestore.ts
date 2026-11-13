import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { ADMIN_EMAIL, db, handleFirestoreError, OperationType } from '../firebase';
import {
  CustomerServiceSurveyResponse,
  DriverSurveyResponse,
  MotherSurveyResponse,
  OperationsSurveyResponse,
  PostVisitLog,
  StaffSurveyResponse,
  SurveyTypeKey,
} from '../types/survey';
import {
  buildStaffSurveyPayload,
  clampNum,
  safeId,
  safeIsoTimestamp,
  safeStr,
  safeStrArray,
} from '../utils/surveyLogic';

export const COLLECTION_BY_SURVEY: Record<SurveyTypeKey, string> = {
  'post-visit-log': 'post_visit_logs',
  'staff-survey': 'staff_surveys',
  'mother-survey': 'mother_surveys',
  'drivers-survey': 'driver_surveys',
  'customer-service-survey': 'cs_surveys',
  'operations-survey': 'ops_surveys',
};

export async function verifyAdminAccess(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email === ADMIN_EMAIL) return true;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function submitPostVisitLog(log: PostVisitLog): Promise<void> {
  const id = safeId(log.id, 'pvl');
  const path = `post_visit_logs/${id}`;
  const payload = {
    id,
    timestamp: safeIsoTimestamp(log.timestamp),
    createdAt: serverTimestamp(),
    childAgeGroup: safeStr(log.childAgeGroup, 64),
    actualDurationMinutes: clampNum(log.actualDurationMinutes, 1, 180, 10),
    requestedExtraTime: Boolean(log.requestedExtraTime),
    extraTimeNotes: safeStr(log.extraTimeNotes, 2000),
    topMomQuestion: safeStr(log.topMomQuestion, 1000),
    pricingSentiment: safeStr(log.pricingSentiment, 100),
    missedOpportunities: safeStrArray(log.missedOpportunities, 20),
    atmosphereRating: clampNum(log.atmosphereRating, 1, 5, 5),
    characterName: safeStr(log.characterName, 128),
    staffNameOrCode: safeStr(log.staffNameOrCode, 128),
  };

  try {
    await setDoc(doc(db, 'post_visit_logs', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitStaffSurvey(survey: StaffSurveyResponse): Promise<void> {
  const sanitized = buildStaffSurveyPayload(survey);
  const path = `staff_surveys/${sanitized.id}`;
  const payload = {
    ...sanitized,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'staff_surveys', sanitized.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitMotherSurvey(survey: MotherSurveyResponse): Promise<void> {
  const id = safeId(survey.id, 'm');
  const path = `mother_surveys/${id}`;
  const payload = {
    id,
    timestamp: safeIsoTimestamp(survey.timestamp),
    createdAt: serverTimestamp(),
    experienceRating: clampNum(survey.experienceRating, 1, 5, 5),
    wasTenMinutesEnough: safeStr(survey.wasTenMinutesEnough, 100),
    interestedInPaidExtension: safeStr(survey.interestedInPaidExtension, 100),
    pricingFeedback: safeStr(survey.pricingFeedback, 100),
    customerServiceSatisfaction: safeStr(survey.customerServiceSatisfaction, 200),
    appExperienceFeedback: safeStr(survey.appExperienceFeedback, 2000),
    missingWishes: safeStr(survey.missingWishes, 2000),
    whatsappOptIn: Boolean(survey.whatsappOptIn),
    whatsappPhone: survey.whatsappOptIn ? safeStr(survey.whatsappPhone, 32) : '',
  };

  try {
    await setDoc(doc(db, 'mother_surveys', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitDriverSurvey(survey: DriverSurveyResponse): Promise<void> {
  const id = safeId(survey.id, 'driver-resp');
  const path = `driver_surveys/${id}`;
  const payload = {
    id,
    submittedAt: safeIsoTimestamp(survey.submittedAt),
    createdAt: serverTimestamp(),
    driverNameOrCode: safeStr(survey.driverNameOrCode, 128),
    experiencePeriod: safeStr(survey.experiencePeriod, 100),
    dailyDeliveriesAvg: clampNum(survey.dailyDeliveriesAvg, 0, 100, 0),
    vehicleType: safeStr(survey.vehicleType, 128),
    commonDeliveryItems: safeStrArray(survey.commonDeliveryItems, 20),
    lateArrivalOutOfTen: clampNum(survey.lateArrivalOutOfTen, 0, 10, 0),
    lateArrivalReasons: safeStrArray(survey.lateArrivalReasons, 20),
    lateArrivalJustification: safeStr(survey.lateArrivalJustification, 2000),
    doorOpener: safeStr(survey.doorOpener, 100),
    clientRequiresEntry: safeStr(survey.clientRequiresEntry, 200),
    photoProofFrequencyOutOfTen: clampNum(survey.photoProofFrequencyOutOfTen, 0, 10, 0),
    pricingCommentsHeard: safeStr(survey.pricingCommentsHeard, 100),
    appMapComplaints: safeStr(survey.appMapComplaints, 2000),
    customerServiceFeedback: safeStr(survey.customerServiceFeedback, 500),
    customerServiceSupportRating: clampNum(survey.customerServiceSupportRating, 1, 5, 4),
    biggestRoadblock: safeStr(survey.biggestRoadblock, 1000),
    suggestionsForOps: safeStr(survey.suggestionsForOps, 2000),
  };

  try {
    await setDoc(doc(db, 'driver_surveys', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitCsSurvey(survey: CustomerServiceSurveyResponse): Promise<void> {
  const id = safeId(survey.id, 'cs');
  const path = `cs_surveys/${id}`;
  const payload = {
    id,
    submittedAt: safeIsoTimestamp(survey.submittedAt),
    createdAt: serverTimestamp(),
    agentNameOrCode: safeStr(survey.agentNameOrCode, 128),
    shiftType: safeStr(survey.shiftType, 128),
    dailyTicketsCount: clampNum(survey.dailyTicketsCount, 0, 500, 0),
    topInquiryTypes: safeStrArray(survey.topInquiryTypes, 20),
    pricingCommentsReceived: safeStr(survey.pricingCommentsReceived, 100),
    commonClientComplaintsAboutCS: safeStrArray(survey.commonClientComplaintsAboutCS, 20),
    complaintsAboutCSDetails: safeStr(survey.complaintsAboutCSDetails, 2000),
    appWebsiteComplaintsDetails: safeStr(survey.appWebsiteComplaintsDetails, 3000),
    cancellationReasons: safeStrArray(survey.cancellationReasons, 20),
    unservedDemands: safeStrArray(survey.unservedDemands, 20),
    toolsNeededToImprove: safeStr(survey.toolsNeededToImprove, 2000),
    generalNotes: safeStr(survey.generalNotes, 2000),
  };

  try {
    await setDoc(doc(db, 'cs_surveys', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitOpsSurvey(survey: OperationsSurveyResponse): Promise<void> {
  const id = safeId(survey.id, 'ops');
  const path = `ops_surveys/${id}`;
  const payload = {
    id,
    submittedAt: safeIsoTimestamp(survey.submittedAt),
    createdAt: serverTimestamp(),
    coordinatorNameOrCode: safeStr(survey.coordinatorNameOrCode, 128),
    shiftType: safeStr(survey.shiftType, 128),
    dailyDispatchedVisits: clampNum(survey.dailyDispatchedVisits, 0, 500, 0),
    scheduleAdherenceRating: clampNum(survey.scheduleAdherenceRating, 1, 5, 4),
    driverLatenessRateOutOfTen: clampNum(survey.driverLatenessRateOutOfTen, 0, 10, 0),
    mascotLatenessRateOutOfTen: clampNum(survey.mascotLatenessRateOutOfTen, 0, 10, 0),
    primaryDispatchBottlenecks: safeStrArray(survey.primaryDispatchBottlenecks, 20),
    costumeReadinessAndMaintenance: safeStr(survey.costumeReadinessAndMaintenance, 2000),
    appBookingIntegrationIssues: safeStr(survey.appBookingIntegrationIssues, 2000),
    pricingFeedbackFromOperations: safeStr(survey.pricingFeedbackFromOperations, 1000),
    coordinationBetweenCSAndField: safeStr(survey.coordinationBetweenCSAndField, 2000),
    peakHoursStrategyFeedback: safeStr(survey.peakHoursStrategyFeedback, 2000),
    proposalsForLeadership: safeStr(survey.proposalsForLeadership, 3000),
  };

  try {
    await setDoc(doc(db, 'ops_surveys', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSurveyResponse(surveyType: SurveyTypeKey, id: string): Promise<void> {
  const collectionName = COLLECTION_BY_SURVEY[surveyType];
  const path = `${collectionName}/${id}`;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function stripServerMeta<T extends Record<string, any>>(docData: Record<string, any>): T {
  const { createdAt: _createdAt, ...rest } = docData;
  return rest as T;
}

export interface AdminSurveyCallbacks {
  onPostVisitLogs: (items: PostVisitLog[]) => void;
  onStaffSurveys: (items: StaffSurveyResponse[]) => void;
  onMotherSurveys: (items: MotherSurveyResponse[]) => void;
  onDriverSurveys: (items: DriverSurveyResponse[]) => void;
  onCsSurveys: (items: CustomerServiceSurveyResponse[]) => void;
  onOpsSurveys: (items: OperationsSurveyResponse[]) => void;
  onError?: (err: Error) => void;
}

export function subscribeAdminSurveys(callbacks: AdminSurveyCallbacks): () => void {
  const unsubscribes: Unsubscribe[] = [];

  const attach = <T extends Record<string, any>>(
    collectionName: string,
    setter: (items: T[]) => void
  ) => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => stripServerMeta<T>({ id: d.id, ...d.data() }));
        setter(items);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, collectionName);
        } catch (wrappedErr) {
          if (callbacks.onError && wrappedErr instanceof Error) {
            callbacks.onError(wrappedErr);
          }
        }
      }
    );
    unsubscribes.push(unsub);
  };

  attach<PostVisitLog>('post_visit_logs', callbacks.onPostVisitLogs);
  attach<StaffSurveyResponse>('staff_surveys', callbacks.onStaffSurveys);
  attach<MotherSurveyResponse>('mother_surveys', callbacks.onMotherSurveys);
  attach<DriverSurveyResponse>('driver_surveys', callbacks.onDriverSurveys);
  attach<CustomerServiceSurveyResponse>('cs_surveys', callbacks.onCsSurveys);
  attach<OperationsSurveyResponse>('ops_surveys', callbacks.onOpsSurveys);

  return () => {
    unsubscribes.forEach((u) => u());
  };
}

export function getFriendlyFirestoreSubmitError(
  error: unknown,
  lang: 'ar' | 'en',
  fallbackAr = 'تعذر إرسال الاستبيان لقاعدة البيانات حاليًا. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
  fallbackEn = 'Unable to submit the survey right now. Please check your connection and try again.'
): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const lower = raw.toLowerCase();

  if (lower.includes('quota exceeded') || lower.includes('resource-exhausted')) {
    return lang === 'en'
      ? 'Daily database quota has been exceeded and will reset tomorrow. Please try again later.'
      : 'تم تجاوز الحصة اليومية لقاعدة البيانات حاليًا (تتجدد في اليوم التالي). يرجى المحاولة لاحقًا.';
  }

  if (
    lower.includes('permission') ||
    lower.includes('permission_denied') ||
    lower.includes('evaluation error') ||
    lower.includes('maximum of')
  ) {
    return lang === 'en'
      ? 'Submission was rejected by database security rules. Please refresh the page and try again.'
      : 'تم رفض الحفظ بسبب صلاحيات أو قواعد التحقق في قاعدة البيانات. يرجى تحديث الصفحة والمحاولة مجددًا.';
  }

  if (lower.includes('offline') || lower.includes('unavailable') || lower.includes('network')) {
    return lang === 'en'
      ? 'You appear to be offline or the database is temporarily unreachable. Please check your internet connection.'
      : 'تعذر الوصول إلى قاعدة البيانات بسبب ضعف أو انقطاع الاتصال بالإنترنت. يرجى التأكد من الاتصال والمحاولة مجددًا.';
  }

  return lang === 'en' ? fallbackEn : fallbackAr;
}

