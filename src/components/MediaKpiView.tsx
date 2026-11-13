import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';
import {
  AiMarketingRecommendation,
  KidzyPropertyAuditResult,
  MarketingAdvisoryFocus,
  MediaAdAccount,
  MediaCampaignSnapshot,
  MediaPlatformKey,
  MediaRetentionLog,
} from '../types/analyticsTools';
import {
  CustomerServiceSurveyResponse,
  MotherSurveyResponse,
  StaffSurveyResponse,
} from '../types/survey';
import {
  calculateMediaSummary,
  evaluateRetentionPolicy,
  groupSnapshotsByPlatform,
  parseAdReportCsv,
} from '../utils/mediaAnalytics';
import {
  deleteMediaAdAccount,
  executeThreeMonthRetentionPrune,
  saveMediaAdAccount,
  saveMediaSnapshotsBatch,
} from '../services/mediaFirestore';
import { calculatePricingSentiment } from '../utils/surveyLogic';
import { getFriendlyFirestoreSubmitError } from '../services/surveyFirestore';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart2,
  CalendarClock,
  CheckCircle2,
  Copy,
  Database,
  DollarSign,
  FileSpreadsheet,
  Globe,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Webhook,
} from 'lucide-react';

interface MediaKpiViewProps {
  accounts: MediaAdAccount[];
  snapshots: MediaCampaignSnapshot[];
  retentionLogs: MediaRetentionLog[];
  latestPropertyAudit: KidzyPropertyAuditResult | null;
  onPropertyAuditRefreshed?: (audit: KidzyPropertyAuditResult) => Promise<void> | void;
  motherSurveys?: MotherSurveyResponse[];
  staffSurveys?: StaffSurveyResponse[];
  csSurveys?: CustomerServiceSurveyResponse[];
  isAdminAuthenticated?: boolean;
  onOpenAdminLogin?: () => void;
}

const PLATFORM_META: Record<
  MediaPlatformKey,
  { labelAr: string; labelEn: string; accentClass: string; defaultAccount: string }
> = {
  meta: {
    labelAr: 'Meta Ads (إنستغرام وفيسبوك)',
    labelEn: 'Meta Ads (IG & FB)',
    accentClass: 'text-[#007C8D]',
    defaultAccount: 'Kidzy Qatar Meta Business',
  },
  snapchat: {
    labelAr: 'Snapchat Ads (سناب شات)',
    labelEn: 'Snapchat Ads',
    accentClass: 'text-amber-700',
    defaultAccount: 'Kidzy QA Snapchat Ads',
  },
  tiktok: {
    labelAr: 'TikTok Ads (تيك توك)',
    labelEn: 'TikTok Ads',
    accentClass: 'text-[#063B44]',
    defaultAccount: 'Kidzy TikTok Business',
  },
  google_ads: {
    labelAr: 'Google Ads (بحث ويوتيوب)',
    labelEn: 'Google Ads',
    accentClass: 'text-sky-700',
    defaultAccount: 'Kidzy Search & PMax QA',
  },
  kidzy_store: {
    labelAr: 'متجر وموقع كيدزي (kidzy.qa)',
    labelEn: 'Kidzy E-Commerce & Store',
    accentClass: 'text-emerald-700',
    defaultAccount: 'Kidzy Store (kidzy.qa)',
  },
};

export const MediaKpiView: React.FC<MediaKpiViewProps> = ({
  accounts,
  snapshots,
  retentionLogs,
  latestPropertyAudit,
  onPropertyAuditRefreshed,
  motherSurveys = [],
  staffSurveys = [],
  csSurveys = [],
  isAdminAuthenticated = false,
  onOpenAdminLogin,
}) => {
  const { lang, dir, t } = useLanguage();

  const [platformFilter, setPlatformFilter] = useState<'all' | MediaPlatformKey>('all');
  const [dateWindow, setDateWindow] = useState<'30d' | '90d' | 'all'>('90d');
  const [activeSubSection, setActiveSubSection] = useState<
    'overview' | 'accounts' | 'retention' | 'ai-expert'
  >('overview');

  // Account creation/edit modal-inline state
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accPlatform, setAccPlatform] = useState<MediaPlatformKey>('meta');
  const [accName, setAccName] = useState('');
  const [accExternalId, setAccExternalId] = useState('');
  const [accPixelId, setAccPixelId] = useState('');
  const [accBudget, setAccBudget] = useState('5000');
  const [accStatus, setAccStatus] = useState<'connected' | 'paused' | 'attention'>('connected');
  const [savingAccount, setSavingAccount] = useState(false);

  // Manual snapshot ingestion state
  const [showSnapshotForm, setShowSnapshotForm] = useState(false);
  const [snapPlatform, setSnapPlatform] = useState<MediaPlatformKey>('meta');
  const [snapCampaign, setSnapCampaign] = useState('');
  const [snapDate, setSnapDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [snapSpend, setSnapSpend] = useState('');
  const [snapRevenue, setSnapRevenue] = useState('');
  const [snapImpr, setSnapImpr] = useState('');
  const [snapReach, setSnapReach] = useState('');
  const [snapClicks, setSnapClicks] = useState('');
  const [snapConv, setSnapConv] = useState('');
  const [snapViews3s, setSnapViews3s] = useState('');
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  // CSV ingestion state
  const [csvImportPlatform, setCsvImportPlatform] = useState<MediaPlatformKey>('meta');
  const [csvText, setCsvText] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);

  // Pixel verification state
  const [checkingPixels, setCheckingPixels] = useState(false);

  // Retention cleanup state
  const [pruningNow, setPruningNow] = useState(false);
  const autoPruneTriggeredRef = useRef(false);

  // AI Marketing Advisor state
  const [advisoryFocus, setAdvisoryFocus] = useState<MarketingAdvisoryFocus>('overall_roas');
  const [customQuestion, setCustomQuestion] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiReport, setAiReport] = useState<AiMarketingRecommendation | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Status banner
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredSnapshots = useMemo(() => {
    const now = Date.now();
    return snapshots.filter((s) => {
      if (platformFilter !== 'all' && s.platform !== platformFilter) return false;
      if (dateWindow === 'all') return true;
      const ms = Date.parse(s.date);
      if (Number.isNaN(ms)) return true;
      const days = dateWindow === '30d' ? 30 : 90;
      return now - ms <= days * 24 * 60 * 60 * 1000;
    });
  }, [snapshots, platformFilter, dateWindow]);

  const summary = useMemo(() => calculateMediaSummary(filteredSnapshots), [filteredSnapshots]);
  const platformBreakdown = useMemo(() => groupSnapshotsByPlatform(filteredSnapshots), [filteredSnapshots]);
  const retentionStats = useMemo(
    () => evaluateRetentionPolicy(snapshots, retentionLogs),
    [snapshots, retentionLogs]
  );

  // Survey cross-signals for Senior Marketer AI
  const surveyInsights = useMemo(() => {
    const pricing = calculatePricingSentiment(staffSurveys, [], csSurveys, motherSurveys);
    const avgRating =
      motherSurveys.length > 0
        ? Number(
            (
              motherSurveys.reduce((sum, m) => sum + m.experienceRating, 0) / motherSurveys.length
            ).toFixed(2)
          )
        : null;
    const unawareCount = staffSurveys.filter((s) => s.momsKnowTenMinLimit === 'لا').length;
    const awareKnownTotal = staffSurveys.filter(
      (s) => s.momsKnowTenMinLimit === 'نعم' || s.momsKnowTenMinLimit === 'لا'
    ).length;

    return {
      motherSurveysCount: motherSurveys.length,
      averageMotherRatingOutOf5: avgRating,
      staffSurveysCount: staffSurveys.length,
      csSurveysCount: csSurveys.length,
      dominantPricingSentiment: pricing.dominant,
      pricingPercentages: pricing.percentages,
      momsUnawareOf10MinPct:
        awareKnownTotal > 0 ? Math.round((unawareCount / awareKnownTotal) * 100) : null,
      recentAppComplaints: csSurveys
        .map((c) => c.appWebsiteComplaintsDetails)
        .filter(Boolean)
        .slice(0, 5),
      recentMotherWishes: motherSurveys
        .map((m) => m.missingWishes)
        .filter(Boolean)
        .slice(0, 5),
    };
  }, [motherSurveys, staffSurveys, csSurveys]);

  // Automatic 6-month cycle check: deletes records older than 3 months (90 days) when admin is signed in & cycle is due
  useEffect(() => {
    if (
      !autoPruneTriggeredRef.current &&
      isAdminAuthenticated &&
      retentionStats.isSixMonthCycleDue &&
      retentionStats.expiredCount > 0
    ) {
      autoPruneTriggeredRef.current = true;
      const expiredIds = retentionStats.expiredSnapshots.map((s) => s.id);
      const freedKb = Number(
        (
          retentionStats.expiredSnapshots.reduce((sum, item) => sum + JSON.stringify(item).length, 0) /
          1024
        ).toFixed(1)
      );
      const logId = `ret_auto_${Date.now()}`;
      executeThreeMonthRetentionPrune(expiredIds, {
        id: logId,
        executedAt: new Date().toISOString(),
        triggerType: 'auto-6m-schedule',
        cutoffDate: retentionStats.cutoffIsoDate,
        deletedCount: expiredIds.length,
        freedEstimatedKb: freedKb,
        remainingCount: Math.max(0, snapshots.length - expiredIds.length),
        notes: 'Automatic 6-month scheduled cleanup of campaign snapshots older than 90 days.',
      })
        .then(() => {
          setFeedbackMsg({
            type: 'success',
            text: t(
              `تم تنفيذ دورة التنظيف الدورية (كل 6 أشهر): حذف ${expiredIds.length} سجل أقدم من 3 أشهر لتوفير ${freedKb} KB.`,
              `6-month auto-retention ran: pruned ${expiredIds.length} snapshots older than 90 days (${freedKb} KB freed).`
            ),
          });
        })
        .catch(() => {
          // Silently recover if user isn't permitted yet
        });
    }
  }, [isAdminAuthenticated, retentionStats, snapshots.length, t]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminAuthenticated) {
      onOpenAdminLogin?.();
      return;
    }
    setSavingAccount(true);
    setFeedbackMsg(null);
    try {
      const existing = accounts.find((a) => a.platform === accPlatform && a.accountId === accExternalId.trim());
      const id = existing ? existing.id : `acc_${accPlatform}_${Date.now()}`;
      await saveMediaAdAccount(
        {
          id,
          platform: accPlatform,
          accountName: accName.trim() || PLATFORM_META[accPlatform].defaultAccount,
          accountId: accExternalId.trim() || `ID-${accPlatform.toUpperCase()}`,
          pixelOrTagId: accPixelId.trim(),
          monthlyBudgetQar: Math.max(0, Number(accBudget) || 0),
          currency: 'QAR',
          status: accStatus,
          lastSyncedAt: new Date().toISOString(),
        },
        Boolean(existing)
      );
      setShowAccountForm(false);
      setAccName('');
      setAccExternalId('');
      setAccPixelId('');
      setFeedbackMsg({
        type: 'success',
        text: t('تم ربط وتحديث الحساب الإعلاني بنجاح في قاعدة البيانات.', 'Ad account saved to cloud database.'),
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: getFriendlyFirestoreSubmitError(err, lang),
      });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!isAdminAuthenticated) {
      onOpenAdminLogin?.();
      return;
    }
    try {
      await deleteMediaAdAccount(id);
      setFeedbackMsg({
        type: 'success',
        text: t('تم فصل الحساب الإعلاني.', 'Ad account removed.'),
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: getFriendlyFirestoreSubmitError(err, lang),
      });
    }
  };

  const handleSaveManualSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSnapshot(true);
    setFeedbackMsg(null);
    try {
      const impr = Math.max(0, Math.round(Number(snapImpr) || 0));
      const newSnap: MediaCampaignSnapshot = {
        id: `snap_${snapPlatform}_${Date.now()}`,
        platform: snapPlatform,
        accountId: accounts.find((a) => a.platform === snapPlatform)?.accountId || `acc_${snapPlatform}`,
        campaignName: snapCampaign.trim() || `${PLATFORM_META[snapPlatform].labelEn} Campaign`,
        date: snapDate || new Date().toISOString().slice(0, 10),
        spendQar: Math.max(0, Number(snapSpend) || 0),
        revenueQar: Math.max(0, Number(snapRevenue) || 0),
        impressions: impr,
        reach: Math.max(0, Math.round(Number(snapReach) || impr * 0.75)),
        clicks: Math.max(0, Math.round(Number(snapClicks) || 0)),
        conversions: Math.max(0, Math.round(Number(snapConv) || 0)),
        videoViews3s: Math.max(0, Math.round(Number(snapViews3s) || 0)),
        source: 'manual',
      };
      await saveMediaSnapshotsBatch([newSnap]);
      setShowSnapshotForm(false);
      setSnapCampaign('');
      setSnapSpend('');
      setSnapRevenue('');
      setSnapImpr('');
      setSnapReach('');
      setSnapClicks('');
      setSnapConv('');
      setSnapViews3s('');
      setFeedbackMsg({
        type: 'success',
        text: t('تم تسجيل بيانات الحملة وحساب العائد على الإنفاق مباشرة.', 'Campaign snapshot saved and KPIs recalculated.'),
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: getFriendlyFirestoreSubmitError(err, lang),
      });
    } finally {
      setSavingSnapshot(false);
    }
  };

  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setImportingCsv(true);
    setFeedbackMsg(null);
    try {
      const parsed = parseAdReportCsv(csvText, csvImportPlatform);
      if (parsed.length === 0) {
        setFeedbackMsg({
          type: 'error',
          text: t(
            'لم يتم العثور على صفوف صالحة في ملف CSV. تأكد من وجود أعمدة Campaign و Spend و Revenue.',
            'No valid rows parsed. Ensure CSV headers include Campaign, Spend, and Revenue.'
          ),
        });
        return;
      }
      await saveMediaSnapshotsBatch(parsed);
      setCsvText('');
      setFeedbackMsg({
        type: 'success',
        text: t(
          `تم استيراد ${parsed.length} سجل حملة إعلانية وتحديث التحليلات الفورية.`,
          `Imported ${parsed.length} campaign rows into live KPI analytics.`
        ),
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: getFriendlyFirestoreSubmitError(err, lang),
      });
    } finally {
      setImportingCsv(false);
    }
  };

  const handleRunManualPrune = async () => {
    if (!isAdminAuthenticated) {
      onOpenAdminLogin?.();
      return;
    }
    setPruningNow(true);
    setFeedbackMsg(null);
    try {
      const expiredIds = retentionStats.expiredSnapshots.map((s) => s.id);
      const freedKb = Number(
        (
          retentionStats.expiredSnapshots.reduce((sum, item) => sum + JSON.stringify(item).length, 0) /
          1024
        ).toFixed(1)
      );
      await executeThreeMonthRetentionPrune(expiredIds, {
        id: `ret_man_${Date.now()}`,
        executedAt: new Date().toISOString(),
        triggerType: 'manual',
        cutoffDate: retentionStats.cutoffIsoDate,
        deletedCount: expiredIds.length,
        freedEstimatedKb: freedKb,
        remainingCount: Math.max(0, snapshots.length - expiredIds.length),
        notes:
          expiredIds.length > 0
            ? `Manual 3-month retention purge executed by admin (deleted ${expiredIds.length} records older than ${retentionStats.cutoffIsoDate}).`
            : `Manual retention audit check confirmed 0 records older than 90 days (${retentionStats.cutoffIsoDate}).`,
      });
      setFeedbackMsg({
        type: 'success',
        text:
          expiredIds.length > 0
            ? t(
                `تم حذف ${expiredIds.length} سجل أقدم من 3 أشهر (قبل ${retentionStats.cutoffIsoDate}) وتحرير ${freedKb} KB.`,
                `Pruned ${expiredIds.length} records older than 3 months (before ${retentionStats.cutoffIsoDate}), freeing ${freedKb} KB.`
              )
            : t(
                `تم تسجيل الفحص: لا توجد بيانات أقدم من 3 أشهر (${retentionStats.cutoffIsoDate}) تستوجب الحذف حاليًا.`,
                `Audit logged: 0 records older than 3 months (${retentionStats.cutoffIsoDate}) need deletion.`
              ),
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: getFriendlyFirestoreSubmitError(err, lang),
      });
    } finally {
      setPruningNow(false);
    }
  };

  const handleCheckLivePixels = async () => {
    setCheckingPixels(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/ux/inspect-properties');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const audit = (await res.json()) as KidzyPropertyAuditResult;
      if (onPropertyAuditRefreshed) {
        await onPropertyAuditRefreshed(audit);
      }
      setFeedbackMsg({
        type: 'success',
        text: t(
          'تم فحص أكواد التتبع والبيكسل الحية على موقع kidzy.qa ومتاجر التطبيقات بنجاح.',
          'Live tracking pixels & storefront diagnostics refreshed from kidzy.qa.'
        ),
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : t('تعذر فحص الموقع حاليًا', 'Failed checking live site'),
      });
    } finally {
      setCheckingPixels(false);
    }
  };

  const handleGenerateAiAdvisory = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/media/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus: advisoryFocus,
          customQuestion: customQuestion.trim(),
          summary,
          platformBreakdown,
          accounts: accounts.map((a) => ({
            platform: a.platform,
            accountName: a.accountName,
            monthlyBudgetQar: a.monthlyBudgetQar,
            status: a.status,
            hasPixel: Boolean(a.pixelOrTagId),
          })),
          propertyAudit: latestPropertyAudit,
          surveyInsights,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setAiReport(data as AiMarketingRecommendation);
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : t('تعذر استخراج تحليل خبير التسويق حاليًا.', 'Unable to generate AI marketing report.')
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCopyReport = async () => {
    if (!aiReport) return;
    const text = [
      `Kidzy Marketing Strategy Report (${aiReport.generatedAt})`,
      `Health Score: ${aiReport.healthScore}/100`,
      '',
      lang === 'en' ? aiReport.executiveDiagnosisEn : aiReport.executiveDiagnosisAr,
      '',
      '--- Priority Actions ---',
      ...aiReport.priorityActions.map(
        (a, i) =>
          `${i + 1}. [${a.channel}] ${lang === 'en' ? a.titleEn : a.titleAr}: ${
            lang === 'en' ? a.actionEn : a.actionAr
          } (${lang === 'en' ? a.expectedLiftEn : a.expectedLiftAr})`
      ),
      '',
      '--- Ad Hooks ---',
      ...aiReport.adHooksAndCopy.map(
        (h) => `• ${lang === 'en' ? h.angleEn : h.angleAr}: "${lang === 'en' ? h.hookEn : h.hookAr}"`
      ),
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const webhookEndpointUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/media/webhook` : '/api/media/webhook';

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(webhookEndpointUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const pixels = latestPropertyAudit?.website?.detectedPixels;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6" dir={dir}>
      {/* Executive Header */}
      <section className="bg-gradient-to-br from-[#063B44] via-[#005866] to-[#007C8D] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <KidzyWordmark variant="cream" className="h-8 w-auto mb-2" />
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#FEC448]">
              <span>Media KPIs</span>
              <span aria-hidden="true" className="text-[#BAEBF1]/60">·</span>
              <span className="text-[#BAEBF1]">
                Meta · Snapchat · TikTok · Google Ads · kidzy.qa Store
              </span>
              <span aria-hidden="true" className="text-[#BAEBF1]/60">·</span>
              <span className="text-[#BAEBF1] tabular-nums">
                {accounts.length} {t('حساب متصل', 'linked accounts')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t('مركز أداء الميديا والحملات الإعلانية والمتجر', 'Media KPIs, Ad Accounts & Store Revenue')}
            </h1>
            <p className="text-xs sm:text-sm text-[#BAEBF1] max-w-2xl leading-relaxed">
              {t(
                'ربط موحد لحسابات الإعلانات والمتجر الإلكتروني، مراقبة العائد الفعلي (ROAS) وتكلفة الاستحواذ (CPA)، سياسة حذف تلقائي للبيانات الأقدم من 3 أشهر كل 6 أشهر، وتوصيات خبير تسويق بخبرة تتجاوز 10 سنوات.',
                'Unified ad account & e-commerce attribution (ROAS/CPA), automated 90-day data pruning every 6 months, and 10+ year senior performance marketing strategy.'
              )}
            </p>
          </div>

          {/* Interactive Section Switcher */}
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex flex-wrap items-center gap-1 border border-white/20 shrink-0">
            {[
              { id: 'overview' as const, label: t('لوحة المؤشرات', 'KPI Dashboard'), icon: BarChart2 },
              { id: 'accounts' as const, label: t('الحسابات والاستيراد', 'Accounts & Sync'), icon: Link2 },
              { id: 'retention' as const, label: t('سياسة الحذف (3م/6م)', 'Auto-Prune (3m/6m)'), icon: CalendarClock },
              { id: 'ai-expert' as const, label: t('خبير التسويق (+10س)', 'AI Strategist (+10y)'), icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;
              const isCurrent = activeSubSection === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveSubSection(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isCurrent
                      ? 'bg-white text-[#063B44] shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#007C8D]' : 'text-[#FEC448]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs underline cursor-pointer shrink-0"
          >
            {t('إخفاء', 'Dismiss')}
          </button>
        </div>
      )}

      {/* Blended Media Executive KPI Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          {
            label: t('إجمالي الإنفاق', 'Total Spend'),
            val: `${summary.totalSpendQar.toLocaleString()} QAR`,
            sub: t(`${filteredSnapshots.length} سجل حملة`, `${filteredSnapshots.length} records`),
            highlight: false,
          },
          {
            label: t('العائد المحقق', 'Revenue'),
            val: `${summary.totalRevenueQar.toLocaleString()} QAR`,
            sub: t(`متوسط الطلب ${summary.aovQar} QAR`, `AOV ${summary.aovQar} QAR`),
            highlight: false,
          },
          {
            label: t('العائد ROAS', 'Blended ROAS'),
            val: `${summary.blendedRoas}x`,
            sub: summary.blendedRoas >= 3 ? t('أداء مربح', 'Profitable') : t('يحتاج تحسين', 'Optimize'),
            highlight: true,
          },
          {
            label: t('تكلفة الحجز CPA', 'Blended CPA'),
            val: `${summary.blendedCpaQar} QAR`,
            sub: `${summary.totalConversions.toLocaleString()} ${t('تحويل', 'bookings')}`,
            highlight: false,
          },
          {
            label: t('معدل النقر CTR', 'Link CTR'),
            val: `${summary.ctrPct}%`,
            sub: `${summary.totalClicks.toLocaleString()} ${t('نقرة', 'clicks')}`,
            highlight: false,
          },
          {
            label: t('تكلفة النقرة CPC', 'Avg CPC'),
            val: `${summary.cpcQar} QAR`,
            sub: `CPM ${summary.cpmQar} QAR`,
            highlight: false,
          },
          {
            label: t('معدل خطف الانتباه', '3s Hook Rate'),
            val: `${summary.hookRatePct}%`,
            sub: t('جودة افتتاح الفيديو', 'Video thumbstop'),
            highlight: false,
          },
          {
            label: t('حجم البيانات', 'Data Footprint'),
            val: `${retentionStats.estimatedKb} KB`,
            sub:
              retentionStats.expiredCount > 0
                ? t(`${retentionStats.expiredCount} أقدم من 3م`, `${retentionStats.expiredCount} >90d`)
                : t('ضمن نافذة 90 يوم', 'Within 90d window'),
            highlight: retentionStats.expiredCount > 0,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-4 border transition ${
              kpi.highlight
                ? 'bg-[#FEF4E3] border-[#FEC448]'
                : 'bg-white border-[#BAEBF1]'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500">{kpi.label}</div>
            <div className="text-lg font-black text-[#063B44] font-mono tabular-nums mt-1">
              {kpi.val}
            </div>
            <div className="text-[11px] font-medium text-[#007C8D] mt-0.5 tabular-nums">
              {kpi.sub}
            </div>
          </div>
        ))}
      </section>

      {/* =================================================================== */}
      {/* TAB 1: KPI OVERVIEW & CHANNEL BREAKDOWN                              */}
      {/* =================================================================== */}
      {activeSubSection === 'overview' && (
        <div className="space-y-6">
          {/* Filter Controls & Live Pixel Audit Bar */}
          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPlatformFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  platformFilter === 'all'
                    ? 'bg-[#007C8D] text-white'
                    : 'bg-[#F7FAFB] text-[#063B44] hover:bg-[#BAEBF1]/40'
                }`}
              >
                {t('جميع المنصات', 'All Channels')}
              </button>
              {(Object.keys(PLATFORM_META) as MediaPlatformKey[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setPlatformFilter(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    platformFilter === key
                      ? 'bg-[#007C8D] text-white'
                      : 'bg-[#F7FAFB] text-[#063B44] hover:bg-[#BAEBF1]/40'
                  }`}
                >
                  {lang === 'en' ? PLATFORM_META[key].labelEn : PLATFORM_META[key].labelAr}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['30d', '90d', 'all'] as const).map((win) => (
                <button
                  type="button"
                  key={win}
                  onClick={() => setDateWindow(win)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    dateWindow === win
                      ? 'bg-[#063B44] text-white'
                      : 'bg-[#F7FAFB] text-slate-600 hover:text-[#063B44]'
                  }`}
                >
                  {win === '30d'
                    ? t('آخر 30 يوم', '30 Days')
                    : win === '90d'
                    ? t('آخر 3 أشهر (90 يوم)', '90 Days')
                    : t('كامل السجل', 'All')}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowSnapshotForm((v) => !v)}
                className="px-3.5 py-1.5 rounded-xl bg-[#FEC448] hover:bg-[#ebb136] text-[#063B44] text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('تسجيل حملة / مبيعات', 'Log Campaign')}</span>
              </button>
            </div>
          </div>

          {/* Live Website & App Pixel Verification Strip */}
          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#063B44] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#007C8D]" />
                <span>
                  {t('حالة أكواد التتبع والبيكسل الحية على متجر kidzy.qa', 'Live Pixel & Conversion Tag Status on kidzy.qa')}
                </span>
              </div>
              {pixels ? (
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={pixels.metaPixel ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    Meta Pixel: {pixels.metaPixel ? t('مفعل', 'Active') : t('غير مرصود', 'Not detected')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className={pixels.snapPixel ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    Snap Pixel: {pixels.snapPixel ? t('مفعل', 'Active') : t('غير مرصود', 'Not detected')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className={pixels.tiktokPixel ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    TikTok Pixel: {pixels.tiktokPixel ? t('مفعل', 'Active') : t('غير مرصود', 'Not detected')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className={pixels.ga4 || pixels.gtm ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    GA4/GTM: {pixels.ga4 || pixels.gtm ? t('مفعل', 'Active') : t('غير مرصود', 'Not detected')}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {t(
                    'اضغط فحص لفحص الصفحة الفعلية kidzy.qa/?lang=en والتأكد من جاهزية أكواد تتبع الحملات.',
                    'Run live scan on kidzy.qa/?lang=en to verify Meta, Snap, TikTok, and GA4 tags.'
                  )}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleCheckLivePixels}
              disabled={checkingPixels}
              className="px-4 py-2 rounded-xl bg-[#007C8D] hover:bg-[#005866] text-white text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
            >
              {checkingPixels ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{t('فحص البيكسل الحي الآن', 'Verify Live Pixels')}</span>
            </button>
          </div>

          {/* Quick Add Snapshot Form */}
          {showSnapshotForm && (
            <form
              onSubmit={handleSaveManualSnapshot}
              className="bg-[#FEF4E3]/60 border border-[#FEC448] rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#FEC448]/50 pb-3">
                <h3 className="text-sm font-black text-[#063B44]">
                  {t('إضافة قراءة أداء حملة أو مبيعات متجر جديدة', 'Record Campaign or Store Performance Snapshot')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSnapshotForm(false)}
                  className="text-xs font-bold text-slate-600 hover:text-[#063B44] cursor-pointer"
                >
                  {t('إلغاء', 'Cancel')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="font-bold text-[#063B44] block mb-1">{t('المنصة', 'Platform')}</label>
                  <select
                    value={snapPlatform}
                    onChange={(e) => setSnapPlatform(e.target.value as MediaPlatformKey)}
                    className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-bold"
                  >
                    {(Object.keys(PLATFORM_META) as MediaPlatformKey[]).map((k) => (
                      <option key={k} value={k}>
                        {lang === 'en' ? PLATFORM_META[k].labelEn : PLATFORM_META[k].labelAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="font-bold text-[#063B44] block mb-1">{t('اسم الحملة / القناة', 'Campaign Name')}</label>
                  <input
                    type="text"
                    required
                    value={snapCampaign}
                    onChange={(e) => setSnapCampaign(e.target.value)}
                    placeholder={t('مثال: حملة شخصيات كيدزي الدوحة - ويكند', 'e.g. Doha Weekend Mascot Booking')}
                    className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#063B44] block mb-1">{t('التاريخ', 'Date')}</label>
                  <input
                    type="date"
                    required
                    value={snapDate}
                    onChange={(e) => setSnapDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#063B44] block mb-1">{t('الإنفاق (QAR)', 'Spend (QAR)')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={snapSpend}
                    onChange={(e) => setSnapSpend(e.target.value)}
                    placeholder="1200"
                    className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#063B44] block mb-1">{t('الإيراد / المبيعات (QAR)', 'Revenue (QAR)')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={snapRevenue}
                    onChange={(e) => setSnapRevenue(e.target.value)}
                    placeholder="4800"
                    className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#063B44] block mb-1">{t('الحجوزات / الطلبات', 'Conversions')}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={snapConv}
                    onChange={(e) => setSnapConv(e.target.value)}
                    placeholder="16"
                    className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#063B44] block mb-1">{t('الظهور (Impressions)', 'Impressions')}</label>
                  <input
                    type="number"
                    min="0"
                    value={snapImpr}
                    onChange={(e) => setSnapImpr(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#063B44] block mb-1">{t('النقرات (Clicks)', 'Clicks')}</label>
                  <input
                    type="number"
                    min="0"
                    value={snapClicks}
                    onChange={(e) => setSnapClicks(e.target.value)}
                    placeholder="980"
                    className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#063B44] block mb-1">{t('مشاهدات 3 ثوانٍ', '3s Video Views')}</label>
                  <input
                    type="number"
                    min="0"
                    value={snapViews3s}
                    onChange={(e) => setSnapViews3s(e.target.value)}
                    placeholder="14500"
                    className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSnapshot}
                  className="px-5 py-2.5 bg-[#007C8D] hover:bg-[#005866] text-white rounded-xl text-xs font-black transition cursor-pointer disabled:opacity-60"
                >
                  {savingSnapshot ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ وتحديث التحليلات', 'Save Snapshot')}
                </button>
              </div>
            </form>
          )}

          {/* Channel Comparison Table */}
          <div className="bg-white rounded-3xl border border-[#BAEBF1] overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#BAEBF1]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-[#063B44]">
                  {t('تحليل الكفاءة عبر القنوات الإعلانية والمتجر', 'Cross-Channel Efficiency & Store Attribution')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t(
                    'مقارنة مباشرة للعائد ROAS وتكلفة الاستحواذ CPA ومعدل التفاعل لكل حساب إعلاني.',
                    'Direct ROAS, CPA, CTR, and Hook Rate breakdown across ad platforms and kidzy.qa store.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubSection('ai-expert')}
                className="text-xs font-bold text-[#007C8D] hover:text-[#063B44] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FEC448]" />
                <span>{t('اطلب توصية الخبير لإعادة توزيع الميزانية', 'Get AI Budget Reallocation')}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-[#F7FAFB] text-slate-600 font-bold border-b border-[#BAEBF1]/60">
                  <tr>
                    <th className="py-3.5 px-4 text-start">{t('القناة / المتجر', 'Channel')}</th>
                    <th className="py-3.5 px-4 text-start">{t('الحملات', 'Rows')}</th>
                    <th className="py-3.5 px-4 text-start">{t('الإنفاق', 'Spend')}</th>
                    <th className="py-3.5 px-4 text-start">{t('العائد', 'Revenue')}</th>
                    <th className="py-3.5 px-4 text-start">ROAS</th>
                    <th className="py-3.5 px-4 text-start">CPA</th>
                    <th className="py-3.5 px-4 text-start">CTR</th>
                    <th className="py-3.5 px-4 text-start">{t('الحجوزات', 'Conv.')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {(Object.keys(PLATFORM_META) as MediaPlatformKey[]).map((key) => {
                    const row = platformBreakdown[key];
                    return (
                      <tr key={key} className="hover:bg-[#F7FAFB]/70 transition">
                        <td className="py-3.5 px-4 font-bold text-[#063B44]">
                          {lang === 'en' ? PLATFORM_META[key].labelEn : PLATFORM_META[key].labelAr}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{row.count}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#063B44]">
                          {row.totalSpendQar.toLocaleString()} QAR
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                          {row.totalRevenueQar.toLocaleString()} QAR
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-[#007C8D]">
                          {row.blendedRoas}x
                        </td>
                        <td className="py-3.5 px-4 font-mono">{row.blendedCpaQar} QAR</td>
                        <td className="py-3.5 px-4 font-mono">{row.ctrPct}%</td>
                        <td className="py-3.5 px-4 font-mono font-bold">{row.totalConversions}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredSnapshots.length === 0 && (
              <div className="p-8 text-center border-t border-slate-100 space-y-3">
                <p className="text-sm font-bold text-[#063B44]">
                  {t('لا توجد قراءات حملات مسجلة في هذه النافذة الزمنية بعد.', 'No campaign snapshots recorded in this window yet.')}
                </p>
                <p className="text-xs text-slate-500 max-w-xl mx-auto">
                  {t(
                    'لبدء التحليل الحقيقي، سجّل حملة مباشرة أو استورد تقرير CSV من مدير إعلانات Meta / Snapchat / TikTok / Google Ads.',
                    'Log a campaign snapshot or import a CSV report from Meta, Snapchat, TikTok, or Google Ads Manager.'
                  )}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSnapshotForm(true)}
                    className="px-4 py-2 bg-[#007C8D] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {t('إضافة قراءة حملة يدويًا', 'Log First Snapshot')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubSection('accounts')}
                    className="px-4 py-2 bg-[#FEF4E3] text-[#063B44] border border-[#FEC448] rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {t('ربط الحسابات واستيراد CSV', 'Connect Accounts & Import CSV')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Campaign Snapshots Ledger */}
          {filteredSnapshots.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#BAEBF1] overflow-hidden">
              <div className="p-5 border-b border-[#BAEBF1]/60 flex items-center justify-between">
                <h3 className="text-sm font-black text-[#063B44]">
                  {t('سجل الحملات والطلبات الحديثة', 'Recent Campaign & Store Ledger')} ({filteredSnapshots.length})
                </h3>
                <span className="text-xs text-slate-500">
                  {t('تُحفظ البيانات لآخر 90 يومًا تلقائيًا', 'Active 90-day attribution window')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-[#F7FAFB] text-slate-600 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 text-start">{t('التاريخ', 'Date')}</th>
                      <th className="py-3 px-4 text-start">{t('المنصة', 'Platform')}</th>
                      <th className="py-3 px-4 text-start">{t('اسم الحملة', 'Campaign')}</th>
                      <th className="py-3 px-4 text-start">{t('الإنفاق', 'Spend')}</th>
                      <th className="py-3 px-4 text-start">{t('الإيراد', 'Revenue')}</th>
                      <th className="py-3 px-4 text-start">ROAS</th>
                      <th className="py-3 px-4 text-start">{t('التحويلات', 'Conv.')}</th>
                      <th className="py-3 px-4 text-start">{t('المصدر', 'Source')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {filteredSnapshots.slice(0, 30).map((s) => {
                      const roas = s.spendQar > 0 ? (s.revenueQar / s.spendQar).toFixed(2) : '—';
                      return (
                        <tr key={s.id} className="hover:bg-[#F7FAFB]/70">
                          <td className="py-2.5 px-4 font-mono text-slate-600">{s.date}</td>
                          <td className="py-2.5 px-4 font-bold text-[#007C8D]">
                            {lang === 'en' ? PLATFORM_META[s.platform].labelEn : PLATFORM_META[s.platform].labelAr}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-[#063B44]">{s.campaignName}</td>
                          <td className="py-2.5 px-4 font-mono">{s.spendQar.toLocaleString()} QAR</td>
                          <td className="py-2.5 px-4 font-mono text-emerald-700 font-bold">
                            {s.revenueQar.toLocaleString()} QAR
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold">{roas}x</td>
                          <td className="py-2.5 px-4 font-mono">{s.conversions}</td>
                          <td className="py-2.5 px-4 text-slate-500 uppercase font-mono">{s.source}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: ACCOUNTS CONNECTOR, CSV IMPORTER & WEBHOOK SYNC               */}
      {/* =================================================================== */}
      {activeSubSection === 'accounts' && (
        <div className="space-y-6">
          {/* Linked Accounts Grid */}
          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#BAEBF1]/60 pb-4">
              <div>
                <h2 className="text-base font-black text-[#063B44]">
                  {t('الحسابات الإعلانية والمتجر المرتبطة', 'Connected Ad Accounts & Storefront')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t(
                    'اربط معرفات الحسابات الإعلانية وأكواد البيكسل لتوحيد التحليلات والميزانيات.',
                    'Manage ad account IDs, pixels, and monthly QAR budgets across all channels.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountForm((v) => !v)}
                className="px-4 py-2 bg-[#007C8D] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('ربط حساب إعلاني جديد', 'Connect Ad Account')}</span>
              </button>
            </div>

            {showAccountForm && (
              <form
                onSubmit={handleSaveAccount}
                className="p-5 bg-[#F7FAFB] rounded-2xl border border-[#BAEBF1] space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-[#063B44] block mb-1">{t('المنصة', 'Platform')}</label>
                    <select
                      value={accPlatform}
                      onChange={(e) => setAccPlatform(e.target.value as MediaPlatformKey)}
                      className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-bold"
                    >
                      {(Object.keys(PLATFORM_META) as MediaPlatformKey[]).map((k) => (
                        <option key={k} value={k}>
                          {lang === 'en' ? PLATFORM_META[k].labelEn : PLATFORM_META[k].labelAr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-[#063B44] block mb-1">{t('اسم الحساب', 'Account Name')}</label>
                    <input
                      type="text"
                      required
                      value={accName}
                      onChange={(e) => setAccName(e.target.value)}
                      placeholder={PLATFORM_META[accPlatform].defaultAccount}
                      className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#063B44] block mb-1">{t('معرف الحساب (Account ID)', 'Ad Account ID')}</label>
                    <input
                      type="text"
                      required
                      value={accExternalId}
                      onChange={(e) => setAccExternalId(e.target.value)}
                      placeholder="act_10294857 / kidzy-qa"
                      className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#063B44] block mb-1">{t('معرف البيكسل / التتبع', 'Pixel / Tag ID')}</label>
                    <input
                      type="text"
                      value={accPixelId}
                      onChange={(e) => setAccPixelId(e.target.value)}
                      placeholder="Pixel / G-XXXX / CAPI"
                      className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#063B44] block mb-1">{t('الميزانية الشهرية (QAR)', 'Monthly Budget (QAR)')}</label>
                    <input
                      type="number"
                      min="0"
                      value={accBudget}
                      onChange={(e) => setAccBudget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#063B44] block mb-1">{t('الحالة', 'Status')}</label>
                    <select
                      value={accStatus}
                      onChange={(e) => setAccStatus(e.target.value as 'connected' | 'paused' | 'attention')}
                      className="w-full px-3 py-2 rounded-xl border border-[#BAEBF1] bg-white font-bold"
                    >
                      <option value="connected">{t('متصل ونشط', 'Connected')}</option>
                      <option value="paused">{t('متوقف مؤقتًا', 'Paused')}</option>
                      <option value="attention">{t('بحاجة لمراجعة', 'Needs Attention')}</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  {!isAdminAuthenticated && (
                    <span className="text-[11px] font-bold text-amber-800">
                      {t('يتطلب حفظ الحسابات الإعلانية تسجيل دخول المشرف.', 'Admin sign-in required to save ad accounts.')}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={savingAccount}
                    className="px-5 py-2 bg-[#063B44] hover:bg-[#005866] text-white rounded-xl font-bold cursor-pointer ms-auto"
                  >
                    {savingAccount ? t('جارٍ الربط...', 'Saving...') : t('حفظ الحساب الإعلاني', 'Save Account')}
                  </button>
                </div>
              </form>
            )}

            {accounts.length === 0 ? (
              <div className="p-6 bg-[#F7FAFB] rounded-2xl text-center text-xs text-slate-600">
                {t(
                  'لا توجد حسابات إعلانية مربوطة بعد. اضغط «ربط حساب إعلاني جديد» لإضافة Meta أو Snapchat أو TikTok أو Google Ads أو متجر kidzy.qa.',
                  'No ad accounts linked yet. Click "Connect Ad Account" to link Meta, Snapchat, TikTok, Google Ads, or kidzy.qa.'
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`font-black ${PLATFORM_META[acc.platform].accentClass}`}>
                          {lang === 'en' ? PLATFORM_META[acc.platform].labelEn : PLATFORM_META[acc.platform].labelAr}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-bold text-[#063B44]">{acc.accountName}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className={acc.status === 'connected' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          {acc.status === 'connected'
                            ? t('متصل', 'Connected')
                            : acc.status === 'paused'
                            ? t('متوقف', 'Paused')
                            : t('انتباه', 'Attention')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-2">
                        <span>ID: {acc.accountId}</span>
                        {acc.pixelOrTagId && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Pixel: {acc.pixelOrTagId}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>
                          {t('الميزانية:', 'Budget:')} {acc.monthlyBudgetQar.toLocaleString()} {acc.currency}
                        </span>
                      </div>
                    </div>

                    {isAdminAuthenticated && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('إزالة', 'Remove')}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dual Panel: CSV Report Importer + Live Webhook API */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#BAEBF1] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#BAEBF1]/60 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#007C8D]" />
                  <h3 className="text-sm font-black text-[#063B44]">
                    {t('استيراد تقارير الحملات والمبيعات (CSV)', 'Import Ad Manager & Store CSV Reports')}
                  </h3>
                </div>
                <select
                  value={csvImportPlatform}
                  onChange={(e) => setCsvImportPlatform(e.target.value as MediaPlatformKey)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#BAEBF1] text-xs font-bold bg-[#F7FAFB]"
                >
                  {(Object.keys(PLATFORM_META) as MediaPlatformKey[]).map((k) => (
                    <option key={k} value={k}>
                      {lang === 'en' ? PLATFORM_META[k].labelEn : PLATFORM_META[k].labelAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="px-4 py-2 bg-[#FEF4E3] hover:bg-[#FEC448]/40 border border-[#FEC448] text-[#063B44] rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-[#007C8D]" />
                  <span>{t('رفع ملف CSV من Meta / Snap / TikTok / Google', 'Upload Ad Manager CSV File')}</span>
                  <input type="file" accept=".csv,.txt" onChange={handleCsvFileUpload} className="hidden" />
                </label>
                <span className="text-[11px] text-slate-500">
                  {t('الأعمدة المدعومة: Date, Platform, Campaign, Spend, Impressions, Clicks, Conversions, Revenue', 'Columns: Date, Platform, Campaign, Spend, Impressions, Clicks, Conversions, Revenue')}
                </span>
              </div>

              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                dir="ltr"
                placeholder={`Platform,Campaign,Date,Spend,Impressions,Reach,Clicks,Conversions,Revenue,3s Video Views\nmeta,Kidzy Mascot Eid Offer,2026-11-10,850,42000,31000,910,14,4200,13200`}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-[#F7FAFB] font-mono text-xs"
              />

              <button
                type="button"
                onClick={handleImportCsv}
                disabled={importingCsv || !csvText.trim()}
                className="px-5 py-2.5 bg-[#007C8D] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {importingCsv ? t('جارٍ الاستيراد...', 'Importing...') : t('تحليل واستيراد الصفوف الآن', 'Parse & Save CSV Rows')}
              </button>
            </div>

            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#BAEBF1] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#BAEBF1]/60 pb-3">
                <Webhook className="w-4 h-4 text-[#007C8D]" />
                <h3 className="text-sm font-black text-[#063B44]">
                  {t('الربط الآلي المستمر عبر Webhook (Make / Zapier / المتجر)', 'Automated Store & Ad Webhook')}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  'أرسل أحداث الطلبات من متجر kidzy.qa أو مزامنة حملات الإعلانات يوميًا إلى نقطة الاستقبال الموحدة التالية:',
                  'Send daily ad syncs or kidzy.qa store order conversions to this live endpoint:'
                )}
              </p>
              <div className="p-3 bg-[#063B44] text-[#BAEBF1] rounded-2xl font-mono text-[11px] flex items-center justify-between gap-2 break-all" dir="ltr">
                <span>POST {webhookEndpointUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="text-[#FEC448] hover:text-white shrink-0 cursor-pointer"
                  title="Copy URL"
                >
                  {copiedWebhook ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre
                dir="ltr"
                className="p-3 bg-[#F7FAFB] border border-slate-200 rounded-2xl font-mono text-[10px] text-[#063B44] overflow-x-auto"
              >
{`{
  "platform": "kidzy_store",
  "campaignName": "Checkout Order Completed",
  "date": "2026-11-12",
  "spendQar": 0,
  "conversions": 1,
  "revenueQar": 350
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: AUTOMATIC 3-MONTH RETENTION EVERY 6 MONTHS                   */}
      {/* =================================================================== */}
      {activeSubSection === 'retention' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#BAEBF1]/60 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#007C8D]">
                  <Database className="w-4 h-4" />
                  <span>{t('سياسة الحوكمة والأرشفة الذكية', 'Automated Data Governance Policy')}</span>
                </div>
                <h2 className="text-lg font-black text-[#063B44]">
                  {t(
                    'حذف بيانات 3 أشهر تلقائيًا كل 6 أشهر عند تضخم البيانات',
                    'Auto-Delete Records Older Than 3 Months Every 6 Months'
                  )}
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {t(
                    'للحفاظ على سرعة التحميل وكفاءة قاعدة البيانات عند تزايد بيانات الحملات والمتجر، يتم مسح السجلات الأقدم من 90 يومًا تلقائيًا في دورة كل 180 يومًا (6 أشهر) مع توثيق كل دورة في سجل غير قابل للتعديل.',
                    'To keep dashboard performance fast and storage lean, campaign snapshots older than 90 days (3 months) are pruned automatically every 180-day (6-month) cycle with an immutable audit trail.'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunManualPrune}
                disabled={pruningNow}
                className="px-5 py-2.5 bg-[#063B44] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
              >
                {pruningNow ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-[#FEC448]" />}
                <span>
                  {isAdminAuthenticated
                    ? t('تنفيذ فحص وحذف أقدم من 3 أشهر الآن', 'Prune >3 Months Data Now')
                    : t('دخول المشرف لتنفيذ الحذف', 'Admin Login to Prune')}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]">
                <div className="text-xs font-bold text-slate-500">{t('إجمالي السجلات المخزنة', 'Stored Snapshots')}</div>
                <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                  {snapshots.length}
                </div>
                <div className="text-[11px] text-[#007C8D] mt-1 font-mono">
                  {retentionStats.estimatedKb} KB {retentionStats.isStorageHeavy ? `· ${t('حجم مرتفع', 'Heavy Load')}` : `· ${t('خفيف ومثالي', 'Optimal')}`}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FEF4E3] border border-[#FEC448]/70">
                <div className="text-xs font-bold text-[#063B44]">{t('سجلات أقدم من 3 أشهر (90 يوم)', 'Records Older Than 3 Months')}</div>
                <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                  {retentionStats.expiredCount}
                </div>
                <div className="text-[11px] text-[#063B44]/80 mt-1 font-mono">
                  {t('تاريخ القطع:', 'Cutoff:')} &lt; {retentionStats.cutoffIsoDate}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]">
                <div className="text-xs font-bold text-slate-500">{t('الدورة الدورية القادمة (6 أشهر)', 'Next 6-Month Cycle')}</div>
                <div className="text-xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                  {retentionStats.nextScheduledIsoDate}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {retentionStats.isSixMonthCycleDue
                    ? t('مستحقة للتنفيذ الآن', 'Cycle due now')
                    : t('مجدولة كل 180 يومًا', 'Scheduled every 180 days')}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]">
                <div className="text-xs font-bold text-slate-500">{t('آخر عملية تنظيف موثقة', 'Last Logged Purge')}</div>
                <div className="text-xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                  {retentionStats.lastLog ? retentionStats.lastLog.executedAt.slice(0, 10) : '—'}
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 font-bold">
                  {retentionStats.lastLog
                    ? t(`حُذف ${retentionStats.lastLog.deletedCount} سجل`, `Deleted ${retentionStats.lastLog.deletedCount} rows`)
                    : t('لم تُنفذ دورات بعد', 'No prior purge runs')}
                </div>
              </div>
            </div>

            {/* Retention Audit Logs Table */}
            <div className="pt-2">
              <h3 className="text-sm font-black text-[#063B44] mb-3">
                {t('سجل تدقيق دورات الحذف التلقائي واليدوي', 'Retention Purge Audit Log')}
              </h3>
              {retentionLogs.length === 0 ? (
                <div className="p-6 bg-[#F7FAFB] rounded-2xl text-center text-xs text-slate-500">
                  {t(
                    'سيظهر هنا كل سجل تنظيف تلقائي (كل 6 أشهر) أو يدوي بعد تنفيذه.',
                    'All automated 6-month and manual purge executions are permanently logged here.'
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-[#F7FAFB] text-slate-600 font-bold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4 text-start">{t('تاريخ التنفيذ', 'Executed At')}</th>
                        <th className="py-3 px-4 text-start">{t('النوع', 'Trigger')}</th>
                        <th className="py-3 px-4 text-start">{t('حذف ما قبل', 'Cutoff Date')}</th>
                        <th className="py-3 px-4 text-start">{t('المحذوف', 'Deleted')}</th>
                        <th className="py-3 px-4 text-start">{t('المساحة المحررة', 'Freed')}</th>
                        <th className="py-3 px-4 text-start">{t('ملاحظات', 'Notes')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {retentionLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="py-2.5 px-4 font-mono">{log.executedAt.slice(0, 16).replace('T', ' ')}</td>
                          <td className="py-2.5 px-4 font-bold text-[#007C8D]">
                            {log.triggerType === 'auto-6m-schedule'
                              ? t('تلقائي (دورة 6 أشهر)', 'Auto 6-Month')
                              : t('تنفيذ يدوي', 'Manual')}
                          </td>
                          <td className="py-2.5 px-4 font-mono">{log.cutoffDate}</td>
                          <td className="py-2.5 px-4 font-mono font-bold">{log.deletedCount}</td>
                          <td className="py-2.5 px-4 font-mono">{log.freedEstimatedKb} KB</td>
                          <td className="py-2.5 px-4 text-slate-600">{log.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: 10+ YEARS SENIOR PERFORMANCE MARKETER AI CONSULTANT          */}
      {/* =================================================================== */}
      {activeSubSection === 'ai-expert' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#BAEBF1]/60 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#007C8D]">
                  <Sparkles className="w-4 h-4 text-[#FEC448]" />
                  <span>{t('مستشار الأداء والنمو الرقمي — خبرة +10 سنوات في سوق الخليج وقطر', '10+ Years GCC Performance Marketing Strategist')}</span>
                </div>
                <h2 className="text-lg font-black text-[#063B44] mt-1">
                  {t(
                    'تحليل استراتيجي واقتراحات إعلانية وحلول تحسين التحويل (CRO)',
                    'Executive Media Diagnosis, Budget Reallocation & Ad Creative Solutions'
                  )}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {t(
                    'يدمج التحليل أرقام الحملات الحالية + جاهزية بيكسل kidzy.qa + آراء الأمهات والموظفات وخدمة العملاء من الاستبيانات الحية.',
                    'Synthesizes live ad metrics, kidzy.qa tracking health, and real survey insights from mothers, staff, and support.'
                  )}
                </p>
              </div>
            </div>

            {/* Advisory Focus Selector */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#063B44]">
                {t('اختر محور الاستشارة التسويقية:', 'Select Advisory Focus:')}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'overall_roas' as const, label: t('مضاعفة العائد ROAS', 'Maximize Blended ROAS') },
                  { id: 'reduce_cpa' as const, label: t('خفض تكلفة الحجز CPA', 'Lower Booking CPA') },
                  { id: 'budget_reallocation' as const, label: t('إعادة توزيع الميزانية', 'Reallocate Budget') },
                  { id: 'creatives_hooks' as const, label: t('أفكار إعلانية و Hooks', 'High-Converting Ad Hooks') },
                  { id: 'store_app_cro' as const, label: t('تحسين موقع وتطبيق كيدزي CRO', 'Store & App CRO Fixes') },
                  { id: 'launch_roadmap' as const, label: t('خطة نمو 30 يوم', '30-Day Growth Roadmap') },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setAdvisoryFocus(opt.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      advisoryFocus === opt.id
                        ? 'bg-[#007C8D] text-white'
                        : 'bg-[#F7FAFB] text-[#063B44] border border-[#BAEBF1] hover:bg-[#BAEBF1]/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder={t(
                  'سؤال مخصص لخبير التسويق (اختياري): مثال كيف نعالج انطباع السعر مقابل مدة الـ 10 دقائق في إعلانات سناب؟',
                  'Optional custom question: e.g. How to position 10-min mascot value against price objections on Snapchat?'
                )}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#BAEBF1] bg-[#F7FAFB] text-xs"
              />
              <button
                type="button"
                onClick={handleGenerateAiAdvisory}
                disabled={loadingAi}
                className="px-6 py-2.5 bg-[#063B44] hover:bg-[#005866] text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
              >
                {loadingAi ? <Loader2 className="w-4 h-4 animate-spin text-[#FEC448]" /> : <TrendingUp className="w-4 h-4 text-[#FEC448]" />}
                <span>{loadingAi ? t('جارٍ التحليل العميق...', 'Analyzing...') : t('توليد التقرير والحلول الإعلانية', 'Generate Senior Strategy Report')}</span>
              </button>
            </div>

            {aiError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* Rendered Executive Strategy Report */}
          {aiReport && (
            <div className="space-y-6">
              {/* Executive Diagnosis & Health Score */}
              <div className="bg-gradient-to-br from-[#063B44] to-[#005866] text-white rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
                  <div>
                    <span className="text-xs font-bold text-[#FEC448]">
                      {t('التشخيص التنفيذي — خبير التسويق والأداء', 'Executive Performance Diagnosis')}
                    </span>
                    <div className="text-xs text-[#BAEBF1] mt-1 font-mono">
                      {aiReport.generatedAt.slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-[11px] text-[#BAEBF1]">{t('مؤشر صحة النمو', 'Growth Health')}</div>
                      <div className="text-3xl font-black text-[#FEC448] font-mono tabular-nums">
                        {aiReport.healthScore}/100
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="px-3.5 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedReport ? <CheckCircle2 className="w-3.5 h-3.5 text-[#FEC448]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReport ? t('تم النسخ', 'Copied') : t('نسخ التقرير', 'Copy Report')}</span>
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/95">
                  {lang === 'en' ? aiReport.executiveDiagnosisEn : aiReport.executiveDiagnosisAr}
                </p>
              </div>

              {/* Priority Actions */}
              <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 space-y-4">
                <h3 className="text-sm font-black text-[#063B44]">
                  {t('أولويات التدخل الإعلاني والتحويل الفورية', 'High-Impact Priority Actions')}
                </h3>
                <div className="divide-y divide-slate-100">
                  {aiReport.priorityActions.map((act, idx) => (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-black text-[#063B44]">
                          {idx + 1}. {lang === 'en' ? act.titleEn : act.titleAr}
                        </span>
                        <span className="font-mono font-bold text-[#007C8D]">
                          {act.channel} · {act.impact === 'high' ? t('أولوية قصوى', 'High Impact') : t('متوسط', 'Medium')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {lang === 'en' ? act.actionEn : act.actionAr}
                      </p>
                      <div className="text-xs font-bold text-emerald-700">
                        {t('الأثر المتوقع:', 'Expected Lift:')}{' '}
                        {lang === 'en' ? act.expectedLiftEn : act.expectedLiftAr}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Reallocation & Ad Hooks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 space-y-4">
                  <h3 className="text-sm font-black text-[#063B44]">
                    {t('مقترح إعادة توزيع الميزانية الإعلانية', 'Recommended Budget Allocation Matrix')}
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {aiReport.budgetAllocation.map((b, idx) => (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-[#063B44]">{b.platform}</span>
                          <span className="font-mono font-bold text-[#007C8D]">
                            {b.currentSharePct}% → {b.recommendedSharePct}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {lang === 'en' ? b.rationaleEn : b.rationaleAr}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 space-y-4">
                  <h3 className="text-sm font-black text-[#063B44]">
                    {t('زوايا إبداعية ونصوص خطف الانتباه (Ad Hooks)', 'High-Converting Creative Angles & Hooks')}
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {aiReport.adHooksAndCopy.map((h, idx) => (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-[#007C8D]">
                            {lang === 'en' ? h.angleEn : h.angleAr}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {lang === 'en' ? h.targetAudienceEn : h.targetAudienceAr}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#063B44] bg-[#FEF4E3] p-3 rounded-xl">
                          "{lang === 'en' ? h.hookEn : h.hookAr}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 30-Day Execution Roadmap */}
              <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 space-y-4">
                <h3 className="text-sm font-black text-[#063B44]">
                  {t('خارطة التنفيذ لمدة 30 يومًا', '30-Day Execution Roadmap')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {aiReport.thirtyDayRoadmap.map((w, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/80 space-y-1.5">
                      <div className="text-xs font-black text-[#007C8D]">
                        {lang === 'en' ? w.weekLabelEn : w.weekLabelAr}
                      </div>
                      <p className="text-xs text-[#063B44] leading-relaxed">
                        {lang === 'en' ? w.focusEn : w.focusAr}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
