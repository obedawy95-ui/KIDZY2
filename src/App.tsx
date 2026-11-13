/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { LanguageSwitcher, useLanguage } from './context/LanguageContext';
import {
  deleteSurveyResponse,
  submitCsSurvey,
  submitDriverSurvey,
  submitMotherSurvey,
  submitOpsSurvey,
  submitPostVisitLog,
  submitStaffSurvey,
  subscribeAdminSurveys,
  verifyAdminAccess,
} from './services/surveyFirestore';
import { clearWorkspaceAccessToken } from './services/googleWorkspace';
import { Navbar } from './components/Navbar';
import { PostVisitLogView } from './components/PostVisitLogView';
import { StaffSurveyView } from './components/StaffSurveyView';
import { MotherSurveyView } from './components/MotherSurveyView';
import { DriversSurveyView } from './components/DriversSurveyView';
import { CustomerServiceSurveyView } from './components/CustomerServiceSurveyView';
import { OperationsSurveyView } from './components/OperationsSurveyView';
import { AnalyticsView } from './components/AnalyticsView';
import { DigitalPerformanceView } from './components/DigitalPerformanceView';
import { UserExperienceKpiView } from './components/UserExperienceKpiView';
import { MediaKpiView } from './components/MediaKpiView';
import { GoogleAppsScriptStudio } from './components/GoogleAppsScriptStudio';
import { ShareLinkModal } from './components/ShareLinkModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { KidzyMonogram, KidzyWordmark } from './components/KidzyBrandMark';
import {
  saveUxPropertyAudit,
  subscribeMediaTelemetry,
} from './services/mediaFirestore';
import {
  KidzyPropertyAuditResult,
  MediaAdAccount,
  MediaCampaignSnapshot,
  MediaRetentionLog,
} from './types/analyticsTools';
import {
  ActiveAppTab,
  SurveyTypeKey,
  PostVisitLog,
  StaffSurveyResponse,
  MotherSurveyResponse,
  DriverSurveyResponse,
  CustomerServiceSurveyResponse,
  OperationsSurveyResponse,
} from './types/survey';
import { AlertCircle, Lock, ShieldCheck, UserCheck } from 'lucide-react';

const VALID_SURVEYS: SurveyTypeKey[] = [
  'post-visit-log',
  'staff-survey',
  'mother-survey',
  'drivers-survey',
  'customer-service-survey',
  'operations-survey',
];

export default function App() {
  const { dir, t } = useLanguage();

  const [sharedSurveyKey] = useState<SurveyTypeKey | null>(() => {
    try {
      const surveyParam = new URLSearchParams(window.location.search).get('survey') as SurveyTypeKey | null;
      if (surveyParam && VALID_SURVEYS.includes(surveyParam)) {
        return surveyParam;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [isLockedGuestLink] = useState<boolean>(() => {
    try {
      return new URLSearchParams(window.location.search).get('guest') === '1';
    } catch {
      return false;
    }
  });

  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      return new URLSearchParams(window.location.search).get('guest') === '1';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveAppTab>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const surveyParam = params.get('survey') as SurveyTypeKey | null;
      const tabParam = params.get('tab') as ActiveAppTab | null;
      const viewParam = params.get('view');
      const isGuestParam = params.get('guest') === '1';

      if (viewParam === 'responses' || tabParam === 'analytics') {
        return 'analytics';
      }
      if (tabParam === 'digital-kpi' || tabParam === 'ux-kpi' || tabParam === 'media-kpi') {
        return tabParam;
      }
      if (surveyParam && VALID_SURVEYS.includes(surveyParam)) return surveyParam;
      if (isGuestParam && (!tabParam || tabParam === 'gas-studio')) {
        return 'staff-survey';
      }
      if (
        tabParam &&
        ([...VALID_SURVEYS, 'analytics', 'digital-kpi', 'ux-kpi', 'media-kpi', 'gas-studio'] as ActiveAppTab[]).includes(tabParam)
      ) {
        return tabParam;
      }
    } catch {
      // fallback
    }
    return 'post-visit-log';
  });

  // Strict recipient isolation: shared links (?survey=...) stay locked to single survey unless Admin unlocks via Google login
  const [unlockedFromStandalone, setUnlockedFromStandalone] = useState(false);

  // Real Firebase Auth state for Owner/Admin reads
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseAdminSignedIn, setIsFirebaseAdminSignedIn] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Real survey datasets loaded strictly from Firestore (no mock/seed fallbacks)
  const [postVisitLogs, setPostVisitLogs] = useState<PostVisitLog[]>([]);
  const [staffSurveys, setStaffSurveys] = useState<StaffSurveyResponse[]>([]);
  const [motherSurveys, setMotherSurveys] = useState<MotherSurveyResponse[]>([]);
  const [driverSurveys, setDriverSurveys] = useState<DriverSurveyResponse[]>([]);
  const [csSurveys, setCsSurveys] = useState<CustomerServiceSurveyResponse[]>([]);
  const [opsSurveys, setOpsSurveys] = useState<OperationsSurveyResponse[]>([]);

  // Media KPIs, retention logs & live UX property audits loaded from Firestore
  const [mediaAccounts, setMediaAccounts] = useState<MediaAdAccount[]>([]);
  const [mediaSnapshots, setMediaSnapshots] = useState<MediaCampaignSnapshot[]>([]);
  const [mediaRetentionLogs, setMediaRetentionLogs] = useState<MediaRetentionLog[]>([]);
  const [uxPropertyAudits, setUxPropertyAudits] = useState<KidzyPropertyAuditResult[]>([]);
  const [latestAuditFallback, setLatestAuditFallback] = useState<KidzyPropertyAuditResult | null>(null);

  // Monitor Firebase Auth status and verify owner/admin claim
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        clearWorkspaceAccessToken();
        setIsFirebaseAdminSignedIn(false);
        return;
      }
      const allowed = await verifyAdminAccess(user);
      setIsFirebaseAdminSignedIn(allowed);
      if (!allowed) {
        clearWorkspaceAccessToken();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Subscribe to live Firestore collections in real-time (both for guests and verified admins)
  useEffect(() => {
    setSyncError(null);
    const unsubscribeData = subscribeAdminSurveys({
      onPostVisitLogs: setPostVisitLogs,
      onStaffSurveys: setStaffSurveys,
      onMotherSurveys: setMotherSurveys,
      onDriverSurveys: setDriverSurveys,
      onCsSurveys: setCsSurveys,
      onOpsSurveys: setOpsSurveys,
      onError: () => {
        setSyncError(
          t(
            'تعذر مزامنة بعض الاستجابات من قاعدة البيانات. يرجى التحقق من اتصال الإنترنت.',
            'Failed to sync some responses from the database. Please check your connection.'
          )
        );
      },
    });

    const unsubscribeMedia = subscribeMediaTelemetry({
      onAccounts: setMediaAccounts,
      onSnapshots: setMediaSnapshots,
      onRetentionLogs: setMediaRetentionLogs,
      onPropertyAudits: setUxPropertyAudits,
    });

    return () => {
      unsubscribeData();
      unsubscribeMedia();
    };
  }, [t]);

  const handlePropertyAuditRefreshed = async (audit: KidzyPropertyAuditResult) => {
    setLatestAuditFallback(audit);
    try {
      await saveUxPropertyAudit(audit);
    } catch {
      // Keep immediate local audit result visible even if offline
    }
  };

  const activePropertyAudit = uxPropertyAudits[0] || latestAuditFallback;

  // Show workspace navigation when opened on root URL (/) OR unlocked from standalone via Admin sign-in
  const isWorkspaceVisible = !sharedSurveyKey || unlockedFromStandalone;
  const isStrictGuestHub = isWorkspaceVisible && isGuestMode && !isFirebaseAdminSignedIn;
  const effectiveActiveTab: ActiveAppTab =
    isStrictGuestHub && activeTab === 'gas-studio'
      ? 'staff-survey'
      : activeTab;
  const hideLoginPromptsForRecipient =
    !isFirebaseAdminSignedIn && (isLockedGuestLink || isGuestMode);

  const handleSavePostVisitLog = async (newLog: PostVisitLog) => {
    await submitPostVisitLog(newLog);
  };

  const handleSaveStaffSurvey = async (newSurvey: StaffSurveyResponse) => {
    await submitStaffSurvey(newSurvey);
  };

  const handleSaveMotherSurvey = async (newSurvey: MotherSurveyResponse) => {
    await submitMotherSurvey(newSurvey);
  };

  const handleSaveDriverSurvey = async (newSurvey: DriverSurveyResponse) => {
    await submitDriverSurvey(newSurvey);
  };

  const handleSaveCsSurvey = async (newSurvey: CustomerServiceSurveyResponse) => {
    await submitCsSurvey(newSurvey);
  };

  const handleSaveOpsSurvey = async (newSurvey: OperationsSurveyResponse) => {
    await submitOpsSurvey(newSurvey);
  };

  const handleDeleteResponse = async (surveyType: SurveyTypeKey, id: string) => {
    await deleteSurveyResponse(surveyType, id);
  };

  const handleAdminLoginSuccess = () => {
    setIsFirebaseAdminSignedIn(true);
    setUnlockedFromStandalone(true);
    setIsGuestMode(false);
    setSyncError(null);
  };

  const handleAdminLogout = async () => {
    clearWorkspaceAccessToken();
    await signOut(auth);
    setIsFirebaseAdminSignedIn(false);
    setUnlockedFromStandalone(false);
  };

  const handleContinueAsGuest = () => {
    setIsGuestMode(true);
    if (activeTab === 'gas-studio') {
      setActiveTab('staff-survey');
    }
  };

  const handleExitGuestMode = () => {
    if (!isLockedGuestLink) {
      setIsGuestMode(false);
    }
  };

  const getSurveyTitle = (key: string) => {
    switch (key) {
      case 'post-visit-log':
        return t('مذكرة ما بعد الزيارة (30 ثانية)', 'Post-Visit Log (30 Seconds)');
      case 'staff-survey':
        return t('استبيان موظفات الشخصيات الكرتونية', 'Character Staff Survey');
      case 'mother-survey':
        return t('استبيان الأمهات', 'Mothers Survey');
      case 'drivers-survey':
        return t('استبيان السائقين والتوصيل الميداني', 'Drivers & Field Delivery Survey');
      case 'customer-service-survey':
        return t('استبيان قسم خدمة العملاء', 'Customer Service Survey');
      case 'operations-survey':
        return t('استبيان العمليات والتشغيل', 'Operations & Dispatch Survey');
      default:
        return t('نموذج استبيان', 'Survey Form');
    }
  };

  const currentRecipientSurvey: SurveyTypeKey =
    sharedSurveyKey ||
    (VALID_SURVEYS.includes(effectiveActiveTab as SurveyTypeKey)
      ? (effectiveActiveTab as SurveyTypeKey)
      : 'staff-survey');

  return (
    <div
      className="min-h-screen bg-[#F7FAFB] text-[#063B44] flex flex-col selection:bg-[#BAEBF1] selection:text-[#063B44]"
      dir={dir}
    >
      {/* Navigation: Full hub on root URL or unlocked Admin; isolated single-survey header for recipients */}
      {isWorkspaceVisible ? (
        <Navbar
          activeTab={effectiveActiveTab}
          onTabChange={setActiveTab}
          postVisitCount={postVisitLogs.length}
          staffSurveyCount={staffSurveys.length}
          driversCount={driverSurveys.length}
          csCount={csSurveys.length}
          opsCount={opsSurveys.length}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          isFirebaseAdminSignedIn={isFirebaseAdminSignedIn}
          adminEmail={firebaseUser?.email}
          onOpenAdminLogin={() => setIsAdminModalOpen(true)}
          onLogoutAdmin={handleAdminLogout}
          isGuestMode={isGuestMode}
          isLockedGuestLink={isLockedGuestLink}
          onEnterGuestMode={handleContinueAsGuest}
          onExitGuestMode={handleExitGuestMode}
        />
      ) : (
        <header className="bg-white border-b border-[#BAEBF1] py-3.5 px-4 sm:px-8 shadow-xs">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <KidzyMonogram variant="tile-teal" size={36} />
              <div>
                <span
                  dir="ltr"
                  className="text-base font-extrabold text-[#063B44] font-['Nunito','Plus_Jakarta_Sans',sans-serif] block leading-tight"
                >
                  kidzy kpi,s
                </span>
                <span className="text-xs text-[#007C8D] font-bold">
                  {getSurveyTitle(currentRecipientSurvey)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <LanguageSwitcher variant="light" />
              <span className="hidden sm:inline text-xs font-medium text-slate-500 whitespace-nowrap">
                {t('استجابة زائر · بدون تسجيل دخول', 'Guest Response · No Sign-In')}
              </span>
            </div>
          </div>
        </header>
      )}

      {isStrictGuestHub && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-4">
          <div className="p-3.5 bg-[#FEF4E3] border border-[#FEC448]/70 rounded-2xl text-xs font-medium text-[#063B44] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#007C8D] shrink-0" />
              <span>
                {t(
                  'وضع الزائر نشط — يمكنك تعبئة وإرسال الاستبيانات مباشرة بدون بريد إلكتروني أو رقم سري.',
                  'Guest mode active — complete and submit any survey directly without email or password sign-in.'
                )}
              </span>
            </div>
            {!isLockedGuestLink && (
              <button
                type="button"
                onClick={handleExitGuestMode}
                className="text-xs font-bold text-[#007C8D] hover:text-[#063B44] underline underline-offset-2 shrink-0 cursor-pointer"
              >
                {t('العودة لعرض المشروع', 'Return to workspace')}
              </button>
            )}
          </div>
        </div>
      )}

      {syncError && isWorkspaceVisible && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        </div>
      )}

      {/* Main survey / section container */}
      <main className="flex-1 pb-16 pt-4 px-3 sm:px-6">
        {!isWorkspaceVisible ? (
          <div>
            {currentRecipientSurvey === 'post-visit-log' && (
              <PostVisitLogView
                onSaveLog={handleSavePostVisitLog}
                recentLogs={[]}
                isStandalone={true}
              />
            )}

            {currentRecipientSurvey === 'staff-survey' && (
              <StaffSurveyView
                onSaveSurvey={handleSaveStaffSurvey}
                recentSurveysCount={0}
                isStandalone={true}
              />
            )}

            {currentRecipientSurvey === 'mother-survey' && (
              <MotherSurveyView
                onSaveResponse={handleSaveMotherSurvey}
                recentSurveys={[]}
                isStandalone={true}
              />
            )}

            {currentRecipientSurvey === 'drivers-survey' && (
              <DriversSurveyView onSubmit={handleSaveDriverSurvey} isStandalone={true} />
            )}

            {currentRecipientSurvey === 'customer-service-survey' && (
              <CustomerServiceSurveyView onSubmit={handleSaveCsSurvey} isStandalone={true} />
            )}

            {currentRecipientSurvey === 'operations-survey' && (
              <OperationsSurveyView onSubmit={handleSaveOpsSurvey} isStandalone={true} />
            )}
          </div>
        ) : (
          <div>
            {effectiveActiveTab === 'post-visit-log' && (
              <PostVisitLogView
                onSaveLog={handleSavePostVisitLog}
                recentLogs={postVisitLogs}
                isStandalone={false}
              />
            )}

            {effectiveActiveTab === 'staff-survey' && (
              <StaffSurveyView
                onSaveSurvey={handleSaveStaffSurvey}
                recentSurveysCount={staffSurveys.length}
                isStandalone={false}
              />
            )}

            {effectiveActiveTab === 'mother-survey' && (
              <MotherSurveyView
                onSaveResponse={handleSaveMotherSurvey}
                recentSurveys={motherSurveys}
                isStandalone={false}
              />
            )}

            {effectiveActiveTab === 'drivers-survey' && (
              <DriversSurveyView onSubmit={handleSaveDriverSurvey} isStandalone={false} />
            )}

            {effectiveActiveTab === 'customer-service-survey' && (
              <CustomerServiceSurveyView onSubmit={handleSaveCsSurvey} isStandalone={false} />
            )}

            {effectiveActiveTab === 'operations-survey' && (
              <OperationsSurveyView onSubmit={handleSaveOpsSurvey} isStandalone={false} />
            )}

            {effectiveActiveTab === 'analytics' && (
              <AnalyticsView
                currentUser={firebaseUser}
                postVisitLogs={postVisitLogs}
                staffSurveys={staffSurveys}
                motherSurveys={motherSurveys}
                driverSurveys={driverSurveys}
                csSurveys={csSurveys}
                opsSurveys={opsSurveys}
                isAdminAuthenticated={isFirebaseAdminSignedIn}
                onOpenAdminLogin={() => setIsAdminModalOpen(true)}
                onContinueAsGuest={handleContinueAsGuest}
                onDeleteResponse={handleDeleteResponse}
                onNavigateTab={setActiveTab}
              />
            )}

            {effectiveActiveTab === 'digital-kpi' && <DigitalPerformanceView />}

            {effectiveActiveTab === 'ux-kpi' && (
              <UserExperienceKpiView
                latestAudit={activePropertyAudit}
                onAuditRefreshed={handlePropertyAuditRefreshed}
                motherSurveys={motherSurveys}
                csSurveys={csSurveys}
              />
            )}

            {effectiveActiveTab === 'media-kpi' && (
              <MediaKpiView
                accounts={mediaAccounts}
                snapshots={mediaSnapshots}
                retentionLogs={mediaRetentionLogs}
                latestPropertyAudit={activePropertyAudit}
                onPropertyAuditRefreshed={handlePropertyAuditRefreshed}
                motherSurveys={motherSurveys}
                staffSurveys={staffSurveys}
                csSurveys={csSurveys}
                isAdminAuthenticated={isFirebaseAdminSignedIn}
                onOpenAdminLogin={() => setIsAdminModalOpen(true)}
              />
            )}

            {effectiveActiveTab === 'gas-studio' && !isStrictGuestHub && <GoogleAppsScriptStudio />}
          </div>
        )}
      </main>

      {/* Share Links Modal (Only available in workspace mode & non-guest mode) */}
      {isWorkspaceVisible && !isStrictGuestHub && (
        <ShareLinkModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          activeSurveyKey={
            VALID_SURVEYS.includes(effectiveActiveTab as SurveyTypeKey)
              ? (effectiveActiveTab as SurveyTypeKey)
              : 'staff-survey'
          }
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        onContinueAsGuest={handleContinueAsGuest}
        currentUser={firebaseUser}
      />

      {/* Footer */}
      <footer className="border-t border-[#BAEBF1] bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <KidzyWordmark variant="teal" className="h-7 w-auto" />
            <span aria-hidden="true" className="text-[#BAEBF1]">|</span>
            <span dir="ltr" className="font-extrabold text-[#063B44] font-['Nunito','Plus_Jakarta_Sans',sans-serif]">
              kidzy kpi,s
            </span>
            <span aria-hidden="true">·</span>
            <span>{t('اصنع يومهم.. على طريقة كيدزي', 'MAKE THEIR DAY. THE KIDZY WAY.')}</span>
          </div>

          <div className="flex items-center gap-3">
            {isFirebaseAdminSignedIn ? (
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {t('قاعدة البيانات متصلة', 'Database Connected')}
              </span>
            ) : hideLoginPromptsForRecipient ? (
              <span className="text-[#007C8D] font-bold text-xs flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                {t('استجابة زائر · بدون بريد إلكتروني أو كلمة مرور', 'Guest Response · No Email or Password')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="text-slate-600 hover:text-[#007C8D] transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                title={t('دخول المشرف (إدارة المشروع)', 'Admin Login')}
              >
                <Lock className="w-3 h-3" />
                <span>{t('دخول المشرف', 'Admin Login')}</span>
              </button>
            )}
            <span aria-hidden="true">·</span>
            <span>
              {t(`جميع الحقوق محفوظة © ${new Date().getFullYear()}`, `© ${new Date().getFullYear()} kidzy kpi,s`)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
