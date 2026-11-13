import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  PostVisitLog,
  StaffSurveyResponse,
  MotherSurveyResponse,
  DriverSurveyResponse,
  CustomerServiceSurveyResponse,
  OperationsSurveyResponse,
  SurveyTypeKey,
  ActiveAppTab,
} from '../types/survey';
import {
  aggregateIdeasRatings,
  calculatePricingSentiment,
} from '../utils/surveyLogic';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart3,
  Timer,
  Search,
  Star,
  Clock,
  Truck,
  Headphones,
  Compass,
  DollarSign,
  Camera,
  AlertTriangle,
  Smartphone,
  FileText,
  FileSpreadsheet,
  ClipboardCheck,
  Quote,
  LogIn,
  Database,
  Gift,
  ShoppingBag,
  MessageSquare,
  UserCheck,
  Globe,
  Smile,
  ArrowUpRight,
  Activity,
  Megaphone,
} from 'lucide-react';
import { IndividualResponsesExplorer } from './IndividualResponsesExplorer';
import { GoogleSheetsHub, SheetsExportSource } from './GoogleSheetsHub';
import { StaffSurveyReviewPanel } from './StaffSurveyReviewPanel';
import { KidzyMonogram, KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';

interface AnalyticsViewProps {
  currentUser?: User | null;
  postVisitLogs: PostVisitLog[];
  staffSurveys: StaffSurveyResponse[];
  motherSurveys: MotherSurveyResponse[];
  driverSurveys?: DriverSurveyResponse[];
  csSurveys?: CustomerServiceSurveyResponse[];
  opsSurveys?: OperationsSurveyResponse[];
  isAdminAuthenticated?: boolean;
  onOpenAdminLogin?: () => void;
  onContinueAsGuest?: () => void;
  onDeleteResponse?: (surveyType: SurveyTypeKey, id: string) => Promise<void>;
  onNavigateTab?: (tab: ActiveAppTab) => void;
}

const buildBreakdown = (values: (string | undefined)[]): { label: string; count: number; pct: number }[] => {
  const counts: Record<string, number> = {};
  let validTotal = 0;
  for (const v of values) {
    if (v && v.trim()) {
      const clean = v.trim();
      counts[clean] = (counts[clean] || 0) + 1;
      validTotal++;
    }
  }
  if (validTotal === 0) return [];
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / validTotal) * 100),
    }))
    .sort((a, b) => b.count - a.count);
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentUser = null,
  postVisitLogs,
  staffSurveys,
  motherSurveys,
  driverSurveys = [],
  csSurveys = [],
  opsSurveys = [],
  isAdminAuthenticated = false,
  onOpenAdminLogin,
  onContinueAsGuest,
  onDeleteResponse,
  onNavigateTab,
}) => {
  const { lang, dir, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'staff-review'
    | 'individual-responses'
    | 'google-sheets'
    | 'pricing-tech'
    | 'lateness'
    | 'logs'
    | 'ideas'
  >('overview');
  const [sheetsExportSource, setSheetsExportSource] = useState<SheetsExportSource>('staff-survey');
  const [draftTask, setDraftTask] = useState<{ title: string; notes: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [characterFilter, setCharacterFilter] = useState('all');

  const totalIndividualResponses =
    staffSurveys.length +
    postVisitLogs.length +
    motherSurveys.length +
    driverSurveys.length +
    csSurveys.length +
    opsSurveys.length;

  // Historical ideas evaluation (tab hidden if empty because Section 8 is unpublished)
  const allIdeaRatings = staffSurveys.map((s) => s.ideasEvaluation || []);
  const rankedIdeas = aggregateIdeasRatings(allIdeaRatings);

  const avgMotherScore =
    motherSurveys.length > 0
      ? (motherSurveys.reduce((sum, m) => sum + m.experienceRating, 0) / motherSurveys.length).toFixed(1)
      : '—';

  const motherOvertimeDemand =
    motherSurveys.length > 0
      ? `${Math.round(
          (motherSurveys.filter((m) => m.wasTenMinutesEnough === 'أحتاج وقتًا أكثر').length /
            motherSurveys.length) *
            100
        )}%`
      : '—';

  // Photo frequency (out of 10)
  const staffPhotoFreq = staffSurveys.filter((s) => s.photoFrequencyOutOfTen !== undefined);
  const avgStaffPhotoFreq =
    staffPhotoFreq.length > 0
      ? (
          staffPhotoFreq.reduce((sum, s) => sum + (s.photoFrequencyOutOfTen || 0), 0) /
          staffPhotoFreq.length
        ).toFixed(1)
      : '—';

  const driverPhotoFreq = driverSurveys.filter((d) => d.photoProofFrequencyOutOfTen !== undefined);
  const avgDriverPhotoFreq =
    driverPhotoFreq.length > 0
      ? (
          driverPhotoFreq.reduce((sum, d) => sum + (d.photoProofFrequencyOutOfTen || 0), 0) /
          driverPhotoFreq.length
        ).toFixed(1)
      : '—';

  // Lateness stats
  const staffLate = staffSurveys.filter((s) => s.lateArrivalOutOfTen !== undefined);
  const avgStaffLate =
    staffLate.length > 0
      ? (
          staffLate.reduce((sum, s) => sum + (s.lateArrivalOutOfTen || 0), 0) / staffLate.length
        ).toFixed(1)
      : '—';

  const driverLate = driverSurveys.filter((d) => d.lateArrivalOutOfTen !== undefined);
  const avgDriverLate =
    driverLate.length > 0
      ? (
          driverLate.reduce((sum, d) => sum + (d.lateArrivalOutOfTen || 0), 0) / driverLate.length
        ).toFixed(1)
      : '—';

  const totalDriverDeliveries = driverSurveys.reduce((sum, d) => sum + (d.dailyDeliveriesAvg || 0), 0);

  // New Character Staff Survey Field KPIs (computed strictly from live staffSurveys)
  const extraToysResponders = staffSurveys.filter((s) => s.extraToysInCarAskOutOfTen !== undefined);
  const avgExtraToysAsk =
    extraToysResponders.length > 0
      ? (
          extraToysResponders.reduce((sum, s) => sum + (s.extraToysInCarAskOutOfTen || 0), 0) /
          extraToysResponders.length
        ).toFixed(1)
      : '—';

  const otherChildrenGiftResponders = staffSurveys.filter(
    (s) => s.otherChildrenGiftAskOutOfTen !== undefined
  );
  const avgOtherChildrenGiftAsk =
    otherChildrenGiftResponders.length > 0
      ? (
          otherChildrenGiftResponders.reduce((sum, s) => sum + (s.otherChildrenGiftAskOutOfTen || 0), 0) /
          otherChildrenGiftResponders.length
        ).toFixed(1)
      : '—';

  const momsLimitKnownResponders = staffSurveys.filter(
    (s) => s.momsKnowTenMinLimit === 'نعم' || s.momsKnowTenMinLimit === 'لا'
  );
  const momsUnawarePct =
    momsLimitKnownResponders.length > 0
      ? `${Math.round(
          (momsLimitKnownResponders.filter((s) => s.momsKnowTenMinLimit === 'لا').length /
            momsLimitKnownResponders.length) *
            100
        )}%`
      : '—';

  const giftRecipientBreakdown = buildBreakdown(staffSurveys.map((s) => s.giftRecipient));
  const competitorGiftsBreakdown = buildBreakdown(staffSurveys.map((s) => s.seenCompetitorGifts));
  const conversationPartnerBreakdown = buildBreakdown(
    staffSurveys.map((s) => s.primaryConversationPartner)
  );

  // Pricing sentiment across teams
  const pricingSentiment = calculatePricingSentiment(
    staffSurveys,
    driverSurveys,
    csSurveys,
    motherSurveys
  );

  // Dispatch bottlenecks from Operations + Drivers
  const bottleneckCounts: Record<string, number> = {};
  const bottleneckSources = [
    ...opsSurveys.flatMap((o) => o.primaryDispatchBottlenecks || []),
    ...driverSurveys.flatMap((d) => d.lateArrivalReasons || []),
  ];
  for (const b of bottleneckSources) {
    if (b && b.trim()) {
      bottleneckCounts[b] = (bottleneckCounts[b] || 0) + 1;
    }
  }
  const bottleneckTotalResponders = opsSurveys.length + driverSurveys.length;
  const topBottlenecks = Object.entries(bottleneckCounts)
    .map(([text, count]) => ({
      text,
      count,
      pct:
        bottleneckTotalResponders > 0
          ? Math.min(100, Math.round((count / bottleneckTotalResponders) * 100))
          : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Driver door openers & items
  const doorOpenerBreakdown = buildBreakdown(driverSurveys.map((d) => d.doorOpener));

  const deliveryItemCounts: Record<string, number> = {};
  for (const d of driverSurveys) {
    for (const item of d.commonDeliveryItems || []) {
      if (item) deliveryItemCounts[item] = (deliveryItemCounts[item] || 0) + 1;
    }
  }
  const topDeliveryItems = Object.entries(deliveryItemCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);

  // CS complaints across CS + Staff + Driver
  const csComplaintCounts: Record<string, number> = {};
  for (const c of csSurveys) {
    for (const comp of c.commonClientComplaintsAboutCS || []) {
      if (comp) csComplaintCounts[comp] = (csComplaintCounts[comp] || 0) + 1;
    }
  }
  for (const s of staffSurveys) {
    if (s.customerServiceFeedback) {
      csComplaintCounts[s.customerServiceFeedback] =
        (csComplaintCounts[s.customerServiceFeedback] || 0) + 1;
    }
  }
  for (const d of driverSurveys) {
    if (d.customerServiceFeedback) {
      csComplaintCounts[d.customerServiceFeedback] =
        (csComplaintCounts[d.customerServiceFeedback] || 0) + 1;
    }
  }
  const topCsComplaints = Object.entries(csComplaintCounts).sort((a, b) => b[1] - a[1]);

  const filteredLogs = postVisitLogs.filter((log) => {
    const matchesSearch =
      log.characterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.topMomQuestion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.staffNameOrCode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCharacter = characterFilter === 'all' || log.characterName === characterFilter;
    return matchesSearch && matchesCharacter;
  });

  const appComplaints = [
    ...csSurveys.map((c) => ({
      source: t('خدمة العملاء', 'Customer Service'),
      text: c.appWebsiteComplaintsDetails,
      user: c.agentNameOrCode,
    })),
    ...driverSurveys.map((d) => ({
      source: t('السائقون والتوصيل', 'Drivers & Delivery'),
      text: d.appMapComplaints,
      user: d.driverNameOrCode,
    })),
    ...staffSurveys
      .filter((s) => s.appWebsiteComplaints)
      .map((s) => ({
        source: t('موظفات الشخصيات', 'Character Staff'),
        text: s.appWebsiteComplaints!,
        user: s.frequentCharacters || t('موظفة', 'Staff'),
      })),
    ...motherSurveys
      .filter((m) => m.appExperienceFeedback)
      .map((m) => ({
        source: t('الأمهات', 'Mothers'),
        text: m.appExperienceFeedback!,
        user: t('أم', 'Mother'),
      })),
    ...opsSurveys.map((o) => ({
      source: t('العمليات والتشغيل', 'Operations'),
      text: o.appBookingIntegrationIssues,
      user: o.coordinatorNameOrCode,
    })),
  ].filter((item) => item.text && item.text.trim().length > 0);

  const lateJustifications = [
    ...staffSurveys
      .filter((s) => s.lateArrivalJustification)
      .map((s) => ({
        role: t('موظفة شخصية', 'Character Staff'),
        rate: s.lateArrivalOutOfTen !== undefined ? `${s.lateArrivalOutOfTen}/10` : '—',
        reason: s.lateArrivalJustification!,
      })),
    ...driverSurveys
      .filter((d) => d.lateArrivalJustification)
      .map((d) => ({
        role: t('سائق توصيل', 'Delivery Driver'),
        rate: `${d.lateArrivalOutOfTen}/10`,
        reason: d.lateArrivalJustification,
      })),
  ];

  const uniqueCharacters = Array.from(
    new Set(postVisitLogs.map((l) => l.characterName).filter((c): c is string => Boolean(c)))
  );

  const subTabs: {
    id:
      | 'overview'
      | 'staff-review'
      | 'individual-responses'
      | 'google-sheets'
      | 'pricing-tech'
      | 'lateness'
      | 'logs'
      | 'ideas';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: t('نظرة عامة والتشغيل', 'Overview & Operations'), icon: Compass },
    {
      id: 'staff-review',
      label: t(`مراجعة استبيان الشخصيات (${staffSurveys.length})`, `Staff Survey Review (${staffSurveys.length})`),
      icon: ClipboardCheck,
    },
    {
      id: 'individual-responses',
      label: t(`الاستجابات الفردية (${totalIndividualResponses})`, `Responses (${totalIndividualResponses})`),
      icon: FileText,
    },
    {
      id: 'google-sheets',
      label: t('Google Sheets والمهام', 'Google Sheets & Tasks'),
      icon: FileSpreadsheet,
    },
    { id: 'pricing-tech', label: t('الأسعار وشكاوى التطبيق', 'Pricing & App Issues'), icon: DollarSign },
    { id: 'lateness', label: t('التأخيرات وتبريراتها الميدانية', 'Delays & Field Justifications'), icon: Clock },
    {
      id: 'logs',
      label: t(`سجل مذكرات الـ 30 ثانية (${postVisitLogs.length})`, `30s Logs (${postVisitLogs.length})`),
      icon: Timer,
    },
  ];

  if (rankedIdeas.length > 0) {
    subTabs.push({
      id: 'ideas',
      label: t('تقييم الأفكار المقترحة', 'Proposed Ideas Ratings'),
      icon: Star,
    });
  }

  const effectiveTab = activeTab === 'ideas' && rankedIdeas.length === 0 ? 'overview' : activeTab;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir={dir}>
      {/* Live Guest Response Explorer Banner when not signed in as Admin */}
      {!isAdminAuthenticated && (
        <div className="mb-6 bg-[#FEF4E3] border border-[#FEC448]/70 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#FEC448] text-[#007C8D] flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#063B44]">
                  {t('استعراض الاستجابات المباشرة كزائر', 'Live Guest Response Viewer')}
                </h2>
                <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {t('قراءة مباشرة بدون تسجيل', 'Direct Read · No Login')}
                </span>
              </div>
              <p className="text-xs text-[#063B44]/80 mt-0.5 leading-relaxed">
                {t(
                  'يتم تحميل الاستجابات الفعلية من السحابة مباشرة دون اشتراط تسجيل دخول أو بريد إلكتروني. (حذف السجلات ومزامنة الجداول مقتصر على المشرف).',
                  'Live responses and KPIs are loaded directly from the cloud with no Google or email login required. (Deleting and sheet sync are admin-only).'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenAdminLogin && (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="px-3.5 py-2 bg-white hover:bg-[#BAEBF1]/30 text-[#063B44] border border-[#01AFC5]/50 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 text-[#007C8D]" />
                <span>{t('دخول المشرف (إدارة وحذف)', 'Admin Login (Manage)')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#063B44] via-[#005866] to-[#007C8D] text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <KidzyWordmark variant="cream" className="h-8 w-auto mb-3" />
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-[#FEC448] text-[#063B44] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <BarChart3 className="w-3.5 h-3.5" />
                {t('تحليلات الاستجابات الفعلية', 'Live Survey KPIs')}
              </span>
              <span className="text-[#BAEBF1] text-xs tabular-nums">
                {t(
                  `${staffSurveys.length + motherSurveys.length + driverSurveys.length + csSurveys.length + opsSurveys.length} استبيانًا فعليًا + ${postVisitLogs.length} مذكرة سريعة`,
                  `${staffSurveys.length + motherSurveys.length + driverSurveys.length + csSurveys.length + opsSurveys.length} surveys + ${postVisitLogs.length} quick logs`
                )}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              <span dir="ltr" className="font-['Nunito',sans-serif]">
                kidzy kpi,s
              </span>{' '}
              <span className="text-[#BAEBF1] font-bold text-xl sm:text-2xl">
                {t('— مؤشرات الأداء والتجربة الميدانية', '— Field Performance Dashboard')}
              </span>
            </h1>
            <p className="text-slate-100/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {t(
                'تُحسب جميع الأرقام والنسب تلقائيًا من الاستجابات الفعلية المسجلة عبر قاعدة البيانات دون أي بيانات افتراضية.',
                'All metrics and distributions are calculated directly from verified live submissions with zero mock data.'
              )}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('staff-review')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEC448] hover:bg-[#f5b62f] text-[#063B44] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="tabular-nums">
                  {t(
                    `مراجعة استبيان الشخصيات (${staffSurveys.length})`,
                    `Staff Survey Review (${staffSurveys.length})`
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('google-sheets')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#063B44] hover:bg-[#BAEBF1] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#007C8D]" />
                <span>{t('Google Sheets والمهام', 'Google Sheets & Tasks')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('individual-responses')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#FEC448]" />
                <span className="tabular-nums">
                  {t(
                    `مطالعة الاستجابات الفردية (${totalIndividualResponses})`,
                    `Browse Individual Responses (${totalIndividualResponses})`
                  )}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="bg-[#063B44]/60 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-[#BAEBF1] block">{t('رضا الأمهات', 'Mother Rating')}</span>
              <span className="text-xl font-black text-[#FEC448] font-mono tabular-nums">
                {avgMotherScore === '—' ? '—' : `★ ${avgMotherScore}`}
              </span>
            </div>
            <div className="bg-[#063B44]/60 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-[#BAEBF1] block">{t('طلب وقت إضافي', 'Extra Time Demand')}</span>
              <span className="text-xl font-black text-[#48CBD9] font-mono tabular-nums">
                {motherOvertimeDemand}
              </span>
            </div>
            <div className="bg-[#063B44]/60 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-[#BAEBF1] block">{t('تصوير الشخصية', 'Photo Rate')}</span>
              <span className="text-xl font-black text-[#FEF4E3] font-mono tabular-nums">
                {avgStaffPhotoFreq === '—' ? '—' : `${avgStaffPhotoFreq}/10`}
              </span>
            </div>
            <div className="bg-[#063B44]/60 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-[#BAEBF1] block">{t('معدل التأخير', 'Late Rate')}</span>
              <span className="text-xl font-black text-[#FEC448] font-mono tabular-nums">
                {avgStaffLate === '—' ? '—' : `${avgStaffLate}/10`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-[#BAEBF1] scrollbar-none">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isCurrent = effectiveTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isCurrent
                  ? 'bg-[#007C8D] text-white shadow-md'
                  : 'bg-white text-[#063B44] border border-[#BAEBF1] hover:bg-[#BAEBF1]/25'
              }`}
            >
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-[#FEC448]' : 'text-[#007C8D]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: STAFF SURVEY REVIEW */}
      {effectiveTab === 'staff-review' && (
        <StaffSurveyReviewPanel
          staffSurveys={staffSurveys}
          isAdminAuthenticated={isAdminAuthenticated}
          onOpenAdminLogin={onOpenAdminLogin}
          onOpenIndividualStaffResponses={() => setActiveTab('individual-responses')}
          onOpenGoogleSheetsSync={() => {
            setSheetsExportSource('staff-survey');
            setActiveTab('google-sheets');
          }}
          onCreateFollowUpTask={(title, notes) => {
            setDraftTask({ title, notes });
            setActiveTab('google-sheets');
          }}
        />
      )}

      {/* TAB: INDIVIDUAL RESPONSES EXPLORER */}
      {effectiveTab === 'individual-responses' && (
        <IndividualResponsesExplorer
          postVisitLogs={postVisitLogs}
          staffSurveys={staffSurveys}
          motherSurveys={motherSurveys}
          driverSurveys={driverSurveys}
          csSurveys={csSurveys}
          opsSurveys={opsSurveys}
          isAdminAuthenticated={isAdminAuthenticated}
          onOpenAdminLogin={onOpenAdminLogin}
          onDeleteResponse={onDeleteResponse}
          onOpenStaffReview={() => setActiveTab('staff-review')}
          onSyncToSheets={(surveyKey) => {
            setSheetsExportSource(surveyKey);
            setActiveTab('google-sheets');
          }}
        />
      )}

      {/* TAB: GOOGLE SHEETS & GOOGLE TASKS */}
      {effectiveTab === 'google-sheets' && (
        <GoogleSheetsHub
          currentUser={currentUser}
          postVisitLogs={postVisitLogs}
          staffSurveys={staffSurveys}
          motherSurveys={motherSurveys}
          driverSurveys={driverSurveys}
          csSurveys={csSurveys}
          opsSurveys={opsSurveys}
          initialExportSource={sheetsExportSource}
          draftTaskInput={draftTask}
          onClearDraftTask={() => setDraftTask(null)}
        />
      )}

      {/* TAB 1: OVERVIEW & OPERATIONS */}
      {effectiveTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Digital, UX & Media KPI Sections Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#063B44] to-[#005866] text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between gap-4 border border-[#01AFC5]/40">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#FEC448] font-black flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    Google Analytics 4
                  </span>
                  <span className="text-[#BAEBF1] font-mono font-bold">
                    {t('الأداء الرقمي', 'Digital')}
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  {t('الأداء الرقمي ومسار التحويل (GA4)', 'Digital Performance & Funnel')}
                </h3>
                <p className="text-xs text-[#BAEBF1] leading-relaxed">
                  {t(
                    'رصد الزوار اللحظي، قنوات الاكتساب، ومسار تحويل الحجوزات حتى إتمام الطلب.',
                    'Real-time pulse, traffic acquisition channels, and booking drop-off funnels.'
                  )}
                </p>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('digital-kpi')}
                  className="px-4 py-2.5 bg-white hover:bg-[#BAEBF1]/20 text-[#063B44] hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-between gap-2 self-start cursor-pointer group"
                >
                  <span>{t('فتح الأداء الرقمي (GA4)', 'Open Digital KPIs')}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#007C8D] group-hover:text-white transition" />
                </button>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#005866] to-[#007C8D] text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between gap-4 border border-[#BAEBF1]/40">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#BAEBF1] font-black flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5" />
                    Clarity · Hotjar · Firebase
                  </span>
                  <span className="text-[#FEC448] font-mono font-bold">
                    Web · iOS · Android
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  {t('تجربة المستخدم الموحدة (UX KPIs)', 'Unified Web & App UX KPIs')}
                </h3>
                <p className="text-xs text-[#BAEBF1] leading-relaxed">
                  {t(
                    'فحص حي لموقع kidzy.qa وتطبيقي iOS و Android مع الخرائط الحرارية ورضا الأمهات.',
                    'Live inspection of kidzy.qa, iOS & Android apps with heatmaps, NPS, and Crashlytics.'
                  )}
                </p>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('ux-kpi')}
                  className="px-4 py-2.5 bg-[#FEC448] hover:bg-[#e5ad35] text-[#063B44] font-black text-xs rounded-xl transition flex items-center justify-between gap-2 self-start cursor-pointer shadow-xs"
                >
                  <span>{t('فتح قسم تجربة المستخدم', 'Open UX KPIs')}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#063B44]" />
                </button>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#063B44] via-[#004450] to-[#007C8D] text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between gap-4 border border-[#FEC448]/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#FEC448] font-black flex items-center gap-1">
                    <Megaphone className="w-3.5 h-3.5" />
                    Media KPIs & Store
                  </span>
                  <span className="text-[#BAEBF1] font-mono font-bold">
                    AI +10y Strategist
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  {t('الميديا والحملات والمتجر الإلكتروني', 'Paid Media, Store & AI Strategist')}
                </h3>
                <p className="text-xs text-[#BAEBF1] leading-relaxed">
                  {t(
                    'ربط Meta و Snap و TikTok و Google Ads والمتجر، حذف تلقائي (3م/6م)، وتوصيات خبير تسويق.',
                    'Connect Meta, Snap, TikTok, Google Ads & store with 3m/6m pruning & senior AI advisory.'
                  )}
                </p>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('media-kpi')}
                  className="px-4 py-2.5 bg-white hover:bg-[#FEF4E3] text-[#063B44] font-black text-xs rounded-xl transition flex items-center justify-between gap-2 self-start cursor-pointer shadow-xs"
                >
                  <span>{t('فتح قسم الميديا والحملات', 'Open Media KPIs')}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#007C8D]" />
                </button>
              )}
            </div>
          </div>

          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#BAEBF1]/45 text-[#007C8D] flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">
                  {t('تصوير الشخصية مع الأطفال', 'Character Photos Rate')}
                </span>
                <div className="text-2xl font-black text-[#063B44] font-mono mt-0.5 tabular-nums">
                  {avgStaffPhotoFreq}{' '}
                  <span className="text-xs font-normal text-slate-500">{t('من 10', '/ 10')}</span>
                </div>
                <span className="text-[11px] text-[#007C8D] font-medium">
                  {avgStaffPhotoFreq === '—'
                    ? t('بانتظار استجابات الموظفات', 'Awaiting staff responses')
                    : t(
                        `${Math.round(Number(avgStaffPhotoFreq) * 10)}% من الأسر توثق اللحظة`,
                        `${Math.round(Number(avgStaffPhotoFreq) * 10)}% of families capture photos`
                      )}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF4E3] text-[#063B44] border border-[#FEC448]/60 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">
                  {t('معدل تأخير الوصول', 'Arrival Lateness Rate')}
                </span>
                <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums">
                  {avgStaffLate} <span className="text-xs font-normal text-slate-500">{t('من 10', '/ 10')}</span>
                </div>
                <span className="text-[11px] text-[#063B44]/80 font-medium tabular-nums">
                  {t('السائقون:', 'Drivers:')} {avgDriverLate === '—' ? '—' : `${avgDriverLate}/10`}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">
                  {t('انطباع الأسعار الغالب', 'Dominant Pricing Sentiment')}
                </span>
                <div className="text-xl font-black text-[#063B44] mt-0.5">
                  {pricingSentiment.total > 0 ? pricingSentiment.dominant : t('لا توجد بيانات', 'No data yet')}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium tabular-nums">
                  {pricingSentiment.total > 0
                    ? t(`${pricingSentiment.percentages['معقولة']}% يعتبرونها معقولة`, `${pricingSentiment.percentages['معقولة']}% reasonable`)
                    : t('بانتظار أول استجابة', 'Awaiting first response')}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#007C8D]/10 text-[#005866] flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">
                  {t('طلبات التوصيل المسجلة', 'Tracked Daily Deliveries')}
                </span>
                <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums">
                  {totalDriverDeliveries}{' '}
                  <span className="text-xs font-normal text-slate-500">{t('طلب / يوم', 'orders/day')}</span>
                </div>
                <span className="text-[11px] text-[#007C8D] font-medium tabular-nums">
                  {t(`من ${driverSurveys.length} استبيان سائقين`, `Across ${driverSurveys.length} driver surveys`)}
                </span>
              </div>
            </div>
          </div>

          {/* New Field KPIs from Updated Character Staff Survey */}
          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#063B44] flex items-center gap-2">
                <KidzyMonogram variant="teal" size={24} />
                <span>
                  {t(
                    'مؤشرات الزيارة الميدانية الجديدة (من استبيان موظفات الشخصيات)',
                    'Character Visit Field Indicators (From Live Staff Surveys)'
                  )}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {t(
                  'مؤشرات الوعي بمدة الـ 10 دقائق، طلب الألعاب الإضافية، مستلم الهدية، ووجود هدايا منافسة',
                  '10-minute awareness, car toy requests, gift handoff recipient, and competitor gift sightings'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FEF4E3] border border-[#FEC448]/70 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#FEC448]/60 text-[#063B44] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#007C8D]" />
                </div>
                <div>
                  <span className="text-xs text-[#063B44] font-semibold block">
                    {t('أمهات لا يعلمن بمدة الـ 10 دقائق', 'Moms Unaware of 10-Min Limit')}
                  </span>
                  <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums">{momsUnawarePct}</div>
                  <span className="text-[11px] text-[#063B44]/80 tabular-nums">
                    {t(`من ${momsLimitKnownResponders.length} إجابة`, `From ${momsLimitKnownResponders.length} answers`)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#BAEBF1]/30 border border-[#BAEBF1] flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#BAEBF1] text-[#007C8D] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-[#063B44] font-semibold block">
                    {t('سؤال الأهل عن ألعاب إضافية بالسيارة', 'Extra Toys in Car Requests')}
                  </span>
                  <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums">
                    {avgExtraToysAsk === '—' ? '—' : `${avgExtraToysAsk} / 10`}
                  </div>
                  <span className="text-[11px] text-[#007C8D] tabular-nums">
                    {t(`من كل 10 زيارات`, `Out of 10 visits`)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-rose-950 font-semibold block">
                    {t('سؤال بقية الأطفال عن هدايا لهم', 'Other Kids Asking for Gifts')}
                  </span>
                  <div className="text-2xl font-black text-rose-900 font-mono tabular-nums">
                    {avgOtherChildrenGiftAsk === '—' ? '—' : `${avgOtherChildrenGiftAsk} / 10`}
                  </div>
                  <span className="text-[11px] text-rose-800 tabular-nums">
                    {t(`من كل 10 زيارات`, `Out of 10 visits`)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Breakdown Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gift Recipient */}
              <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/80">
                <h3 className="text-xs font-bold text-[#063B44] mb-3 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-[#007C8D]" />
                  <span>{t('من يستلم الهدية عادةً؟', 'Who Receives the Gift?')}</span>
                </h3>
                {giftRecipientBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-400">{t('بانتظار استجابات جديدة', 'Awaiting responses')}</p>
                ) : (
                  <div className="space-y-2">
                    {giftRecipientBreakdown.map((item) => (
                      <div key={item.label} className="text-xs">
                        <div className="flex justify-between font-semibold text-[#063B44] mb-0.5">
                          <span>{item.label}</span>
                          <span className="font-mono tabular-nums">{item.pct}% ({item.count})</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#01AFC5]" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversation Partner */}
              <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/80">
                <h3 className="text-xs font-bold text-[#063B44] mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#005866]" />
                  <span>{t('أكثر من يتبادل الحديث مع الشخصية', 'Primary Conversation Partner')}</span>
                </h3>
                {conversationPartnerBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-400">{t('بانتظار استجابات جديدة', 'Awaiting responses')}</p>
                ) : (
                  <div className="space-y-2">
                    {conversationPartnerBreakdown.map((item) => (
                      <div key={item.label} className="text-xs">
                        <div className="flex justify-between font-semibold text-[#063B44] mb-0.5">
                          <span>{item.label}</span>
                          <span className="font-mono tabular-nums">{item.pct}% ({item.count})</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#007C8D]" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Competitor Gifts */}
              <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/80">
                <h3 className="text-xs font-bold text-[#063B44] mb-3 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#063B44]" />
                  <span>{t('رصد هدايا/ألعاب من شركات أخرى', 'Competitor Gifts Observed')}</span>
                </h3>
                {competitorGiftsBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-400">{t('بانتظار استجابات جديدة', 'Awaiting responses')}</p>
                ) : (
                  <div className="space-y-2">
                    {competitorGiftsBreakdown.map((item) => (
                      <div key={item.label} className="text-xs">
                        <div className="flex justify-between font-semibold text-[#063B44] mb-0.5">
                          <span>{item.label}</span>
                          <span className="font-mono tabular-nums">{item.pct}% ({item.count})</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#063B44]" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Operational Bottlenecks & Drivers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#063B44] mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#007C8D]" />
                <span>
                  {t(
                    'أبرز اختناقات التوجيه والتوزيع الميداني (من التشغيل والسائقين)',
                    'Top Field Dispatch Bottlenecks (Ops & Drivers)'
                  )}
                </span>
              </h2>
              {topBottlenecks.length === 0 ? (
                <div className="p-8 bg-[#F7FAFB] rounded-2xl border border-[#BAEBF1]/60 text-center text-xs text-slate-500">
                  {t(
                    'لم تُسجل استبيانات تشغيل أو سائقين بعد لعرض نسب الاختناقات الفعلية.',
                    'No operations or driver surveys recorded yet.'
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {topBottlenecks.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#F7FAFB] rounded-2xl border border-[#BAEBF1]/70">
                      <div className="flex justify-between items-center text-xs font-bold text-[#063B44] mb-1.5">
                        <span>{item.text}</span>
                        <span className="font-mono text-[#007C8D] tabular-nums">
                          {item.pct}% ({item.count})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#01AFC5]" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-[#063B44] mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#007C8D]" />
                <span>
                  {t(
                    'استبيان السائقين: من يفتح الباب وما هي السلع الأكثر توصيلاً؟',
                    'Drivers Survey: Door Openers & Top Delivered Items'
                  )}
                </span>
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-[#BAEBF1]/30 rounded-2xl border border-[#BAEBF1]">
                  <span className="text-xs text-[#063B44] font-bold block mb-1">
                    {t('من يفتح الباب غالبًا للسائق؟', 'Who opens the door?')}
                  </span>
                  {doorOpenerBreakdown.length === 0 ? (
                    <span className="text-xs text-slate-500">
                      {t('لا توجد بيانات سائقين بعد', 'No driver data yet')}
                    </span>
                  ) : (
                    <ul className="text-xs text-[#063B44]/85 space-y-1">
                      {doorOpenerBreakdown.map((item) => (
                        <li key={item.label}>
                          • <strong>{item.label}:</strong> <span className="tabular-nums">{item.pct}%</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 bg-[#FEF4E3] rounded-2xl border border-[#FEC448]/70">
                  <span className="text-xs text-[#063B44] font-bold block mb-1">
                    {t('توثيق الاستلام بالصور', 'Delivery Photo Rate')}
                  </span>
                  <div className="text-xl font-black text-[#063B44] font-mono mt-1 tabular-nums">
                    {avgDriverPhotoFreq === '—' ? '—' : `${avgDriverPhotoFreq} / 10`}
                  </div>
                  <span className="text-[11px] text-[#007C8D]">
                    {t('تصوير الصندوق أو الهدية عند الباب', 'Photo at doorstep')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-[#063B44] block mb-2">
                  {t('أبرز ما يوصله السائقون بدون شخصية:', 'Top non-character delivery items:')}
                </span>
                {topDeliveryItems.length === 0 ? (
                  <span className="text-xs text-slate-500">
                    {t('ستظهر العناصر هنا فور وصول استبيانات السائقين.', 'Items will appear as driver surveys arrive.')}
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {topDeliveryItems.map((item, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-[#F7FAFB] text-[#063B44] rounded-xl text-xs font-semibold border border-[#BAEBF1]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRICING & APP/WEBSITE COMPLAINTS */}
      {effectiveTab === 'pricing-tech' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#063B44] mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>
                {t(
                  'ما هي التعليقات التي تسمعونها غالبًا عن الأسعار؟ (تحليل مقارن)',
                  'Client Pricing Sentiment Breakdown (All Teams)'
                )}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mb-6 tabular-nums">
              {t(
                `مقارنة الإجابات الفعلية بين الأمهات، موظفات الشخصيات، السائقين، وفريق خدمة العملاء (${pricingSentiment.total} إجابة)`,
                `Aggregated across mothers, character staff, drivers, and CS (${pricingSentiment.total} responses)`
              )}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: t('معقولة ومناسبة', 'Reasonable'),
                  count: pricingSentiment.breakdown['معقولة'],
                  pct: pricingSentiment.total > 0 ? pricingSentiment.percentages['معقولة'] : 0,
                  color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                },
                {
                  label: t('غالية', 'Expensive'),
                  count: pricingSentiment.breakdown['غالية'],
                  pct: pricingSentiment.total > 0 ? pricingSentiment.percentages['غالية'] : 0,
                  color: 'text-[#063B44] bg-[#FEF4E3] border-[#FEC448]/70',
                },
                {
                  label: t('غالية جدًا', 'Very Expensive'),
                  count: pricingSentiment.breakdown['غالية جدا'],
                  pct: pricingSentiment.total > 0 ? pricingSentiment.percentages['غالية جدا'] : 0,
                  color: 'text-red-700 bg-red-50 border-red-200',
                },
                {
                  label: t('لا توجد تعليقات', 'No Comments'),
                  count: pricingSentiment.breakdown['لا توجد تعليقات'],
                  pct: pricingSentiment.total > 0 ? pricingSentiment.percentages['لا توجد تعليقات'] : 0,
                  color: 'text-[#063B44] bg-[#F7FAFB] border-[#BAEBF1]',
                },
              ].map((item, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${item.color}`}>
                  <span className="text-xs font-bold block">{item.label}</span>
                  <div className="text-2xl font-black font-mono mt-1 tabular-nums">{item.pct}%</div>
                  <span className="text-[11px] opacity-80 tabular-nums">
                    {t(`${item.count} ردًا مسجلًا`, `${item.count} responses`)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#FEF4E3] border border-[#FEC448]/70 rounded-2xl flex items-start gap-3">
              <Quote className="w-5 h-5 text-[#007C8D] shrink-0 mt-0.5" />
              <div className="text-xs text-[#063B44] leading-relaxed">
                <strong>{t('خلاصة التسعير:', 'Pricing Summary:')}</strong>{' '}
                {pricingSentiment.total === 0
                  ? t(
                      'لم تصل استجابات كافية بعد لتحليل انطباع العملاء عن الأسعار.',
                      'Not enough responses recorded yet to evaluate pricing feedback.'
                    )
                  : t(
                      `من إجمالي ${pricingSentiment.total} استجابة مسجلة، الانطباع السائد هو «${pricingSentiment.dominant}» (${pricingSentiment.percentages['معقولة']}% معقولة، ${pricingSentiment.percentages['غالية']}% غالية، ${pricingSentiment.percentages['غالية جدا']}% غالية جداً).`,
                      `Across ${pricingSentiment.total} responses: ${pricingSentiment.percentages['معقولة']}% Reasonable, ${pricingSentiment.percentages['غالية']}% Expensive, ${pricingSentiment.percentages['غالية جدا']}% Very Expensive.`
                    )}
              </div>
            </div>
          </div>

          {/* App & Website Complaints Feed */}
          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#063B44] flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#007C8D]" />
                  <span>
                    {t(
                      'شكاوى وانزعاج العملاء من التطبيق أو الموقع (عن ماذا يشتكون بالضبط؟)',
                      'App & Website Complaints Feed'
                    )}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t(
                    'ردود حية مسجلة من واقع مكالمات خدمة العملاء، ملاحظات السائقين، الموظفات، والأمهات',
                    'Reported directly by CS agents, drivers, character staff, and mothers'
                  )}
                </p>
              </div>
              <span className="text-xs font-bold bg-[#BAEBF1]/50 text-[#063B44] px-3 py-1 rounded-full tabular-nums">
                {t(`${appComplaints.length} ملاحظة مسجلة`, `${appComplaints.length} reports`)}
              </span>
            </div>

            {appComplaints.length === 0 ? (
              <div className="p-8 bg-[#F7FAFB] rounded-2xl border border-[#BAEBF1]/60 text-center text-xs text-slate-500">
                {t('لا توجد شكاوى تقنية مسجلة عن التطبيق أو الموقع حتى الآن.', 'No app or website complaints recorded yet.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appComplaints.map((item, idx) => (
                  <div key={idx} className="p-4 bg-[#F7FAFB] border border-[#BAEBF1]/70 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-white text-[#007C8D] rounded-lg border border-[#BAEBF1]">
                          {item.source}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{item.user}</span>
                      </div>
                      <p className="text-xs text-[#063B44] leading-relaxed font-medium">"{item.text}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-bold text-[#063B44] mb-3 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#007C8D]" />
                <span>
                  {t(
                    'تعليقات وشكاوى العملاء عن خدمة العملاء (من الاستجابات الفعلية):',
                    'Customer Service Feedback Breakdown:'
                  )}
                </span>
              </h3>
              {topCsComplaints.length === 0 ? (
                <div className="p-6 bg-[#F7FAFB] rounded-2xl border border-[#BAEBF1]/60 text-center text-xs text-slate-500">
                  {t('لم تصل تعليقات عن خدمة العملاء بعد.', 'No customer service comments recorded yet.')}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topCsComplaints.map(([label, count]) => (
                    <div
                      key={label}
                      className="p-3 bg-[#BAEBF1]/25 border border-[#BAEBF1] rounded-xl flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-[#063B44]">{label}</span>
                      <span className="text-xs font-mono font-bold bg-white text-[#007C8D] px-2 py-0.5 rounded-lg border border-[#BAEBF1] tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LATENESS & JUSTIFICATIONS */}
      {effectiveTab === 'lateness' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#BAEBF1]/45 text-[#007C8D] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#063B44]">
                    {t('كم من كل 10 زيارات تصل موظفة الشخصية متأخرة؟', 'Character Staff Lateness (out of 10)')}
                  </h3>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {t(`متوسط الإجابات الميدانية (${staffLate.length} ردود)`, `Average (${staffLate.length} responses)`)}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-black text-[#007C8D] font-mono tabular-nums">{avgStaffLate}</span>
                {avgStaffLate !== '—' && (
                  <span className="text-sm text-slate-500 tabular-nums">
                    {t(
                      `من كل 10 زيارات (${Math.round(Number(avgStaffLate) * 10)}%)`,
                      `/ 10 (${Math.round(Number(avgStaffLate) * 10)}%)`
                    )}
                  </span>
                )}
              </div>
              <div className="w-full h-3 bg-[#BAEBF1]/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#01AFC5] rounded-full"
                  style={{ width: avgStaffLate === '—' ? '0%' : `${Number(avgStaffLate) * 10}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FEF4E3] text-[#063B44] border border-[#FEC448]/60 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#063B44]">
                    {t('كم من كل 10 طلبات يصل السائق متأخرًا؟', 'Driver Lateness (out of 10)')}
                  </h3>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {t(`متوسط إجابات السائقين (${driverLate.length} ردود)`, `Average (${driverLate.length} responses)`)}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-black text-[#063B44] font-mono tabular-nums">{avgDriverLate}</span>
                {avgDriverLate !== '—' && (
                  <span className="text-sm text-slate-500 tabular-nums">
                    {t(
                      `من كل 10 طلبات (${Math.round(Number(avgDriverLate) * 10)}%)`,
                      `/ 10 (${Math.round(Number(avgDriverLate) * 10)}%)`
                    )}
                  </span>
                )}
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#005866] rounded-full"
                  style={{ width: avgDriverLate === '—' ? '0%' : `${Number(avgDriverLate) * 10}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#063B44] mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FEC448]" />
              <span>
                {t(
                  'وبماذا تبررين / يبرر السائق التأخير للعميل؟ (ردود الميدان الحقيقية)',
                  'Client Delay Justifications (Live Field Feed)'
                )}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              {t(
                'تحليل التبريرات الفعلية التي تقال لأولياء الأمور لتحديد الحلول الجذرية لها',
                'Root-cause review of real delay reasons communicated to families'
              )}
            </p>

            {lateJustifications.length === 0 ? (
              <div className="p-8 bg-[#F7FAFB] rounded-2xl border border-[#BAEBF1]/60 text-center text-xs text-slate-500">
                {t('لا توجد تبريرات تأخير مسجلة بعد.', 'No delay justifications recorded yet.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lateJustifications.map((item, idx) => (
                  <div key={idx} className="p-4 bg-[#F7FAFB] border border-[#BAEBF1]/70 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#063B44] bg-[#BAEBF1]/50 px-2.5 py-0.5 rounded-md">
                        {item.role}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#063B44] bg-[#FEF4E3] px-2 py-0.5 rounded-md border border-[#FEC448]/70 tabular-nums">
                        {item.rate}
                      </span>
                    </div>
                    <p className="text-xs text-[#063B44] leading-relaxed font-medium mt-1">"{item.reason}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: POST-VISIT LOGS TABLE */}
      {effectiveTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#063B44]">
                {t('سجل المذكرات الميدانية الفعلية (30 ثانية)', 'Live Field Post-Visit Logs')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('عرض تفاصيل الزيارات المسجلة مباشرة من الميدان', 'Real-time visit snapshots from the field')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                    dir === 'rtl' ? 'right-3' : 'left-3'
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('بحث في الأسئلة أو الشخصيات...', 'Search questions or characters...')}
                  className={`py-1.5 text-xs bg-[#F7FAFB] border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01AFC5] w-44 sm:w-56 ${
                    dir === 'rtl' ? 'pr-8 pl-3' : 'pl-8 pr-3'
                  }`}
                />
              </div>

              <select
                value={characterFilter}
                onChange={(e) => setCharacterFilter(e.target.value)}
                className="text-xs bg-[#F7FAFB] border border-slate-300 rounded-xl px-2.5 py-1.5 text-[#063B44] font-medium focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
              >
                <option value="all">{t('كل الشخصيات', 'All Characters')}</option>
                {uniqueCharacters.map((charName) => (
                  <option key={charName} value={charName}>
                    {charName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 bg-[#F7FAFB] rounded-2xl border border-[#BAEBF1]/60">
              {t('لا توجد مذكرات زيارة مسجلة بعد.', 'No post-visit logs recorded yet.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full text-xs border-collapse ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className="border-b border-[#BAEBF1] text-[#063B44] bg-[#F7FAFB]">
                    <th className="py-2.5 px-3 font-bold">{t('الشخصية', 'Character')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('الموظفة', 'Staff')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('عمر الطفل', 'Age')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('المدة', 'Duration')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('وقت إضافي؟', 'Extra Time?')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('أبرز سؤال للأم', 'Top Question')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('الأجواء', 'Rating')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('التوقيت', 'Time')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#BAEBF1]/20 transition-colors">
                      <td className="py-3 px-3 font-bold text-[#063B44]">{log.characterName}</td>
                      <td className="py-3 px-3 text-slate-600">{log.staffNameOrCode || '—'}</td>
                      <td className="py-3 px-3 text-slate-600">{log.childAgeGroup}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#007C8D] tabular-nums">
                        {log.actualDurationMinutes} {t('د', 'm')}
                      </td>
                      <td className="py-3 px-3">
                        {log.requestedExtraTime ? (
                          <span className="bg-[#FEF4E3] text-[#063B44] border border-[#FEC448]/70 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {t('نعم', 'Yes')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">{t('لا', 'No')}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={log.topMomQuestion}>
                        {log.topMomQuestion || '—'}
                      </td>
                      <td className="py-3 px-3 text-[#b47b00] font-bold tabular-nums">★ {log.atmosphereRating}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[10px] tabular-nums">
                        {new Date(log.timestamp).toLocaleTimeString(lang === 'en' ? 'en-US' : 'ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: HISTORICAL IDEAS EVALUATION (ONLY SHOWN WHEN DATA EXISTS) */}
      {effectiveTab === 'ideas' && rankedIdeas.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-[#063B44]">
                {t('تقييم الأفكار المقترحة (بيانات سابقة)', 'Proposed Ideas Evaluation (Archived)')}
              </h2>
              <p className="text-xs text-slate-500">
                {t(
                  'مرتبة حسب تصويت موظفات الميدان من 1 إلى 5 مع نسبة القابلية للتطبيق',
                  'Sorted by score (1–5) and field feasibility percentage'
                )}
              </p>
            </div>
            <span className="text-xs font-bold text-[#007C8D] bg-[#BAEBF1]/35 px-3 py-1 rounded-full border border-[#BAEBF1] tabular-nums">
              {t(`${staffSurveys.length} مشاركة`, `${staffSurveys.length} participants`)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankedIdeas.map((idea, index) => (
              <div
                key={idea.ideaId}
                className="p-5 rounded-2xl border border-[#BAEBF1]/70 bg-[#F7FAFB] hover:bg-[#BAEBF1]/15 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-[#063B44] bg-[#BAEBF1]/50 px-2 py-0.5 rounded-md tabular-nums">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#063B44] bg-[#FEF4E3] px-2.5 py-0.5 rounded-lg border border-[#FEC448]/70 tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-[#FEC448] text-[#FEC448]" />
                      <span>{idea.averageScore} / 5</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#063B44] mb-2 leading-snug">{idea.title}</h3>
                </div>

                <div className="pt-3 border-t border-slate-200/60 mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>{t('القابلية للتطبيق الميداني:', 'Feasibility:')}</span>
                    <span className="font-bold text-[#007C8D] font-mono tabular-nums">
                      {idea.feasibilityScorePercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${idea.feasibilityScorePercent}%` }}
                      className="bg-[#01AFC5] h-full"
                    />
                    <div
                      style={{ width: `${100 - idea.feasibilityScorePercent}%` }}
                      className="bg-slate-300 h-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
