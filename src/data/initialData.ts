import {
  PostVisitLog,
  StaffSurveyResponse,
  MotherSurveyResponse,
  DriverSurveyResponse,
  CustomerServiceSurveyResponse,
  OperationsSurveyResponse,
} from '../types/survey';

/**
 * جميع البيانات الافتراضية مُزالة؛ يعتمد التطبيق حصريًا على الاستجابات الفعلية المحفوظة في قاعدة بيانات Firestore.
 */
export const INITIAL_POST_VISIT_LOGS: PostVisitLog[] = [];
export const INITIAL_STAFF_SURVEYS: StaffSurveyResponse[] = [];
export const INITIAL_MOTHER_SURVEYS: MotherSurveyResponse[] = [];
export const INITIAL_DRIVER_SURVEYS: DriverSurveyResponse[] = [];
export const INITIAL_CS_SURVEYS: CustomerServiceSurveyResponse[] = [];
export const INITIAL_OPS_SURVEYS: OperationsSurveyResponse[] = [];
