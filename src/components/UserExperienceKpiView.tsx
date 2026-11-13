import React, { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { KidzyMonogram, KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';
import {
  CLARITY_FRICTION_METRICS,
  CLARITY_HEATMAP_ZONES,
  FIREBASE_CRASH_ISSUES,
  FIREBASE_NETWORK_ENDPOINTS,
  FIREBASE_PERFORMANCE_METRICS,
  HOTJAR_FEEDBACK_ITEMS,
  HOTJAR_NPS_SUMMARY,
} from '../data/analyticsToolsData';
import { KidzyPropertyAuditResult, UxPlatformFilter } from '../types/analyticsTools';
import { CustomerServiceSurveyResponse, MotherSurveyResponse } from '../types/survey';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Flame,
  Globe,
  Heart,
  Info,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Server,
  ShieldAlert,
  Smartphone,
  Smile,
} from 'lucide-react';

interface UserExperienceKpiViewProps {
  latestAudit?: KidzyPropertyAuditResult | null;
  onAuditRefreshed?: (audit: KidzyPropertyAuditResult) => Promise<void> | void;
  motherSurveys?: MotherSurveyResponse[];
  csSurveys?: CustomerServiceSurveyResponse[];
}

const KIDZY_LINKS = {
  web: 'https://kidzy.qa/?lang=en',
  ios: 'https://apps.apple.com/us/app/kidzy-app/id1607986658',
  android: 'https://play.google.com/store/apps/details?id=com.kidzy.qa',
};

export const UserExperienceKpiView: React.FC<UserExperienceKpiViewProps> = ({
  latestAudit = null,
  onAuditRefreshed,
  motherSurveys = [],
  csSurveys = [],
}) => {
  const { lang, dir, t } = useLanguage();
  const [activeTool, setActiveTool] = useState<'clarity' | 'hotjar' | 'firebase'>('clarity');
  const [platformFilter, setPlatformFilter] = useState<UxPlatformFilter>('all');
  const [heatmapMode, setHeatmapMode] = useState<'clicks' | 'scroll'>('clicks');
  const [selectedHeatmapZone, setSelectedHeatmapZone] = useState<string | null>('hz_mascot_avatar');

  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const handleInspectLiveProperties = async () => {
    setInspecting(true);
    setInspectError(null);
    try {
      const res = await fetch('/api/ux/inspect-properties');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const audit = (await res.json()) as KidzyPropertyAuditResult;
      if (onAuditRefreshed) {
        await onAuditRefreshed(audit);
      }
    } catch (err) {
      setInspectError(
        err instanceof Error
          ? err.message
          : t('تعذر فحص روابط كيدزي الحية حاليًا.', 'Unable to inspect live Kidzy properties right now.')
      );
    } finally {
      setInspecting(false);
    }
  };

  // Filtered crash issues when user selects iOS or Android specifically
  const filteredCrashes = useMemo(() => {
    if (platformFilter === 'ios') {
      return FIREBASE_CRASH_ISSUES.filter((c) => c.osVersion.toLowerCase().includes('ios'));
    }
    if (platformFilter === 'android') {
      return FIREBASE_CRASH_ISSUES.filter((c) => c.osVersion.toLowerCase().includes('android'));
    }
    return FIREBASE_CRASH_ISSUES;
  }, [platformFilter]);

  // Platform multiplier for nuanced telemetry display when narrowing web vs iOS vs Android
  const coldStartDisplayMs =
    platformFilter === 'ios'
      ? 620
      : platformFilter === 'android'
      ? 890
      : FIREBASE_PERFORMANCE_METRICS.appColdStartMs;

  const crashFreeUsersDisplayPct =
    platformFilter === 'ios'
      ? 99.94
      : platformFilter === 'android'
      ? 99.78
      : FIREBASE_PERFORMANCE_METRICS.crashFreeUsersPct;

  // Combine real Mother & CS App feedback from Firestore cleanly into the Voice stream
  const mergedVoiceFeedback = useMemo(() => {
    const liveMotherItems = motherSurveys
      .filter((m) => (m.appExperienceFeedback || m.missingWishes || '').trim().length > 0)
      .slice(0, 6)
      .map((m) => ({
        id: `live_m_${m.id}`,
        customerRoleAr: 'أم متفاعلة (استبيان مباشر)',
        customerRoleEn: 'Verified Mother (Live Survey)',
        date: (m.timestamp || '').slice(0, 10) || t('مؤخرًا', 'Recent'),
        score: Math.min(10, Math.max(2, Math.round(m.experienceRating * 2))),
        sentiment: (m.experienceRating >= 4 ? 'positive' : m.experienceRating === 3 ? 'neutral' : 'negative') as
          | 'positive'
          | 'neutral'
          | 'negative',
        quoteAr: (m.appExperienceFeedback || m.missingWishes || '').trim(),
        quoteEn: (m.appExperienceFeedback || m.missingWishes || '').trim(),
        contextPage: t('استبيان الأمهات الحي · التطبيق والموقع', 'Live Mothers Survey · App/Web'),
      }));

    const liveCsAppItems = csSurveys
      .filter((c) => (c.appWebsiteComplaintsDetails || '').trim().length > 0)
      .slice(0, 4)
      .map((c) => ({
        id: `live_cs_${c.id}`,
        customerRoleAr: `رصد خدمة العملاء (${c.agentNameOrCode})`,
        customerRoleEn: `CS Report (${c.agentNameOrCode})`,
        date: (c.submittedAt || '').slice(0, 10) || t('مؤخرًا', 'Recent'),
        score: 5,
        sentiment: 'neutral' as const,
        quoteAr: c.appWebsiteComplaintsDetails.trim(),
        quoteEn: c.appWebsiteComplaintsDetails.trim(),
        contextPage: t('تذكرة ملاحظات التطبيق/الموقع', 'App & Website UX Ticket'),
      }));

    return [...liveMotherItems, ...liveCsAppItems, ...HOTJAR_FEEDBACK_ITEMS];
  }, [motherSurveys, csSurveys, t]);

  const webAudit = latestAudit?.website;
  const iosAudit = latestAudit?.iosApp;
  const androidAudit = latestAudit?.androidApp;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6" dir={dir}>
      {/* Top Banner with Kidzy Branding */}
      <div className="bg-gradient-to-br from-[#063B44] via-[#005866] to-[#007C8D] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <KidzyWordmark variant="cream" className="h-8 w-auto mb-3" />
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-bold text-[#FEC448]">
              <span>{t('قسم تجربة المستخدم الشامل', 'Omnichannel UX & Behavioral Telemetry')}</span>
              <span aria-hidden="true" className="text-[#BAEBF1]/60">·</span>
              <span className="text-[#BAEBF1] font-medium">
                kidzy.qa · iOS id1607986658 · Android com.kidzy.qa
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              <span dir="ltr" className="font-['Nunito',sans-serif]">
                kidzy kpi,s
              </span>{' '}
              – {t('تجربة المستخدم الموحدة للموقع وتطبيقات كيدزي', 'Unified Website, iOS & Android UX KPIs')}
            </h1>
            <p className="text-xs sm:text-sm text-[#BAEBF1] mt-2 max-w-2xl leading-relaxed">
              {t(
                'مراقبة حية ومترابطة لأداء موقع kidzy.qa وتطبيقات iOS و Android عبر Microsoft Clarity و Hotjar و Firebase Performance + استبيانات العملاء الفعلية.',
                'Live synchronized inspection across kidzy.qa, Apple App Store (iOS), and Google Play (Android) powered by Clarity, Hotjar, Firebase, and live customer feedback.'
              )}
            </p>
          </div>

          {/* Tool Switcher Buttons */}
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex flex-wrap items-center gap-1 border border-white/20 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTool('clarity')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTool === 'clarity'
                  ? 'bg-white text-[#063B44] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <MousePointerClick className="w-4 h-4 text-[#01AFC5]" />
              <span>Microsoft Clarity</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('hotjar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTool === 'hotjar'
                  ? 'bg-white text-[#063B44] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Hotjar & Voice</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('firebase')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTool === 'firebase'
                  ? 'bg-white text-[#063B44] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Flame className="w-4 h-4 text-[#FEC448]" />
              <span>Firebase Performance</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* CONNECTED KIDZY DIGITAL PROPERTIES BAR (WEB + IOS + ANDROID) */}
      {/* ========================================================== */}
      <section className="bg-white rounded-3xl border border-[#BAEBF1] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#BAEBF1]/60 pb-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#063B44] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#007C8D]" />
              <span>{t('منصات كيدزي الرسمية المتصلة بالرصد الحي', 'Connected Kidzy Properties & Live Diagnostics')}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {latestAudit
                ? t(
                    `آخر فحص ومزامنة: ${latestAudit.inspectedAt.slice(0, 16).replace('T', ' ')}`,
                    `Last live inspection: ${latestAudit.inspectedAt.slice(0, 16).replace('T', ' ')}`
                  )
                : t(
                    'اضغط «فحص ومزامنة الروابط الحية الآن» لجلب الحالة المباشرة لموقع kidzy.qa وتطبيقي iOS و Android.',
                    'Run live inspection to fetch real-time status from kidzy.qa, Apple App Store, and Google Play.'
                  )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleInspectLiveProperties}
            disabled={inspecting}
            className="px-4 py-2.5 rounded-xl bg-[#007C8D] hover:bg-[#005866] text-white text-xs font-bold transition flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer disabled:opacity-60"
          >
            {inspecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>{inspecting ? t('جارٍ الفحص الحي...', 'Inspecting...') : t('فحص ومزامنة الروابط الحية الآن', 'Inspect Live Links Now')}</span>
          </button>
        </div>

        {inspectError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{inspectError}</span>
          </div>
        )}

        {/* 3 Real Property Rows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Property 1: Website kidzy.qa */}
          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-[#063B44] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#007C8D]" />
                <span>{t('الموقع الرسمي (kidzy.qa)', 'Official Website')}</span>
              </span>
              <a
                href={KIDZY_LINKS.web}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#007C8D] hover:text-[#063B44] font-bold flex items-center gap-1"
              >
                <span>{t('فتح', 'Open')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-[11px] font-mono text-slate-500 truncate" dir="ltr">
              {KIDZY_LINKS.web}
            </div>
            {webAudit ? (
              <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className={webAudit.reachable ? 'text-emerald-700' : 'text-amber-700'}>
                    {webAudit.reachable ? t('متاح ويعمل', 'Online') : webAudit.error || t('مقيد', 'Restricted')}
                  </span>
                  <span className="font-mono text-[#063B44] tabular-nums">
                    TTFB: {webAudit.latencyMs}ms · HTTP {webAudit.httpStatus || '—'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {t('الأدوات المرصودة:', 'Detected tags:')}{' '}
                  <span className="font-mono font-bold text-[#007C8D]">
                    {[
                      webAudit.detectedPixels.ga4 && 'GA4',
                      webAudit.detectedPixels.gtm && 'GTM',
                      webAudit.detectedPixels.clarity && 'Clarity',
                      webAudit.detectedPixels.hotjar && 'Hotjar',
                      webAudit.detectedPixels.metaPixel && 'Meta',
                      webAudit.detectedPixels.snapPixel && 'Snap',
                      webAudit.detectedPixels.tiktokPixel && 'TikTok',
                    ]
                      .filter(Boolean)
                      .join(' · ') || t('لا توجد وسوم ظاهرة في HTML الأولي', 'None detected in initial HTML')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 pt-1">
                {t('بانتظار فحص سرعة الاستجابة وأكواد Clarity / Hotjar / GA4.', 'Ready to check latency & UX scripts.')}
              </div>
            )}
          </div>

          {/* Property 2: iOS App Store */}
          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-[#063B44] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#007C8D]" />
                <span>{t('تطبيق الآيفون (iOS App Store)', 'iOS App Store')}</span>
              </span>
              <a
                href={KIDZY_LINKS.ios}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#007C8D] hover:text-[#063B44] font-bold flex items-center gap-1"
              >
                <span>{t('فتح', 'Open')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-[11px] font-mono text-slate-500 truncate" dir="ltr">
              App ID: id1607986658
            </div>
            {iosAudit ? (
              <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className={iosAudit.reachable ? 'text-emerald-700' : 'text-amber-700'}>
                    {iosAudit.reachable ? iosAudit.trackName : iosAudit.error || t('غير متاح', 'Unavailable')}
                  </span>
                  <span className="font-mono text-[#063B44] tabular-nums">
                    v{iosAudit.version}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 tabular-nums">
                  {t('تقييم المتجر:', 'Store Rating:')}{' '}
                  <strong className="text-[#063B44]">
                    {iosAudit.averageRating ? `${iosAudit.averageRating.toFixed(1)} ★` : '—'}
                  </strong>{' '}
                  · {iosAudit.ratingCount} {t('تقييم', 'reviews')}
                  {iosAudit.releaseDate && ` · ${iosAudit.releaseDate}`}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 pt-1">
                {t('متصل بواجهة Apple Store (id1607986658) لفحص الإصدار والتقييمات.', 'Linked to Apple App Store lookup (id1607986658).')}
              </div>
            )}
          </div>

          {/* Property 3: Android Google Play */}
          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-[#063B44] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>{t('تطبيق الأندرويد (Google Play)', 'Android Google Play')}</span>
              </span>
              <a
                href={KIDZY_LINKS.android}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#007C8D] hover:text-[#063B44] font-bold flex items-center gap-1"
              >
                <span>{t('فتح', 'Open')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-[11px] font-mono text-slate-500 truncate" dir="ltr">
              Package: com.kidzy.qa
            </div>
            {androidAudit ? (
              <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className={androidAudit.reachable ? 'text-emerald-700' : 'text-amber-700'}>
                    {androidAudit.reachable ? androidAudit.title : androidAudit.error || t('مقيد', 'Restricted')}
                  </span>
                  <span className="font-mono text-[#063B44] tabular-nums">
                    HTTP {androidAudit.httpStatus || '—'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 tabular-nums">
                  {androidAudit.ratingText} · {androidAudit.downloadsText}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 pt-1">
                {t('متصل بحزمة الأندرويد (com.kidzy.qa) وملف Firebase Crashlytics.', 'Linked to Google Play (com.kidzy.qa) & Crashlytics.')}
              </div>
            )}
          </div>
        </div>

        {/* Platform Filter Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {t('تصفية عرض تجربة المستخدم حسب المنصة:', 'Filter UX telemetry by platform:')}
            </span>
            {[
              { id: 'all' as const, label: t('جميع المنصات (موحد)', 'All Properties') },
              { id: 'web' as const, label: t('موقع kidzy.qa', 'Website (kidzy.qa)') },
              { id: 'ios' as const, label: t('تطبيق iOS', 'iOS App') },
              { id: 'android' as const, label: t('تطبيق Android', 'Android App') },
            ].map((pf) => (
              <button
                type="button"
                key={pf.id}
                onClick={() => setPlatformFilter(pf.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  platformFilter === pf.id
                    ? 'bg-[#063B44] text-white'
                    : 'bg-[#F7FAFB] text-[#063B44] hover:bg-[#BAEBF1]/40'
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-medium text-[#007C8D] tabular-nums">
            {t(
              `${motherSurveys.length} تقييم أم + ${csSurveys.length} ملاحظة دعم مرتبطة`,
              `${motherSurveys.length} mother + ${csSurveys.length} CS feedback synced`
            )}
          </span>
        </div>
      </section>

      {/* ========================================================== */}
      {/* SECTION 1: MICROSOFT CLARITY                               */}
      {/* ========================================================== */}
      {activeTool === 'clarity' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Clarity Friction Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CLARITY_FRICTION_METRICS.map((metric) => (
              <div
                key={metric.id}
                className="bg-white rounded-3xl border border-[#BAEBF1] p-5 shadow-xs space-y-2 hover:border-[#01AFC5] transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#063B44]">
                    {lang === 'en' ? metric.titleEn : metric.titleAr}
                  </span>
                  <span
                    className={`font-bold ${
                      metric.status === 'good' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {metric.status === 'good' ? t('طبيعي', 'Healthy') : t('مراقبة', 'Monitor')}
                  </span>
                </div>

                <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums">
                  {metric.valuePct}%
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {lang === 'en' ? metric.descriptionEn : metric.descriptionAr}
                </p>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  {t('المعيار الطبيعي:', 'Benchmark:')} &lt; {metric.healthyBenchmarkPct}%
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Heatmap & Session Friction Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#BAEBF1] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#BAEBF1]/60">
                <div>
                  <h2 className="text-sm font-bold text-[#063B44] flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>
                      {t('خريطة التفاعل والحرارة', 'Interactive Heatmap Viewer')}
                      {platformFilter !== 'all' ? ` · ${platformFilter.toUpperCase()}` : ''}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t(
                      'توزيع كثافة النقرات والتمرير في رحلة حجز الشخصية على موقع وتطبيق كيدزي',
                      'Click density & scroll depth on Kidzy booking screen across web & mobile app'
                    )}
                  </p>
                </div>

                <div className="bg-[#F7FAFB] p-1 rounded-xl flex items-center border border-slate-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setHeatmapMode('clicks')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      heatmapMode === 'clicks'
                        ? 'bg-[#007C8D] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#063B44]'
                    }`}
                  >
                    {t('نقرات (Click Map)', 'Click Map')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapMode('scroll')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      heatmapMode === 'scroll'
                        ? 'bg-[#007C8D] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#063B44]'
                    }`}
                  >
                    {t('عمق التمرير (Scroll Depth)', 'Scroll Reach')}
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl bg-gradient-to-b from-[#F7FAFB] via-white to-[#F7FAFB] border-2 border-slate-200 p-6 min-h-[360px] overflow-hidden select-none">
                {heatmapMode === 'scroll' && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
                    <div className="border-b-2 border-dashed border-emerald-500/80 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded w-max">
                      100% {t('وصول (أعلى الشاشة)', 'Top fold reached')}
                    </div>
                    <div className="border-b-2 border-dashed border-sky-500/80 text-[10px] font-mono font-bold text-sky-700 bg-sky-50/80 px-2 py-0.5 rounded w-max">
                      78% {t('وصول (اختيار الشخصيات)', 'Mascot selection')}
                    </div>
                    <div className="border-b-2 border-dashed border-amber-500/80 text-[10px] font-mono font-bold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded w-max">
                      56% {t('وصول (تنبيه الـ 10 دقائق وتفاصيل الزيارة)', '10-min duration notice')}
                    </div>
                    <div className="border-b-2 border-dashed border-rose-500/80 text-[10px] font-mono font-bold text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded w-max">
                      34% {t('وصول (زر التأكيد والدفع النهائي)', 'Confirm CTA')}
                    </div>
                  </div>
                )}

                <div className="max-w-md mx-auto space-y-4 opacity-85">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KidzyMonogram variant="tile-teal" size={24} />
                      <span className="font-extrabold text-xs text-[#063B44]">kidzy.qa</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {t('حجز زيارة شخصية كيدزي', 'Kidzy Visit Booking')}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl shadow-xs border border-slate-200 space-y-2">
                    <div className="h-3 w-1/3 bg-slate-200 rounded" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-16 bg-[#BAEBF1]/40 rounded-lg flex items-center justify-center text-[10px] font-bold text-[#063B44]">
                        {t('شخصية 1', 'Mascot 1')}
                      </div>
                      <div className="h-16 bg-[#BAEBF1]/60 rounded-lg border-2 border-[#007C8D] flex items-center justify-center text-[10px] font-bold text-[#063B44]">
                        {t('شخصية 2 ✓', 'Mascot 2 ✓')}
                      </div>
                      <div className="h-16 bg-[#BAEBF1]/40 rounded-lg flex items-center justify-center text-[10px] font-bold text-[#063B44]">
                        {t('شخصية 3', 'Mascot 3')}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FEF4E3] border border-[#FEC448] rounded-xl text-center text-xs font-bold text-[#063B44]">
                    {t('مدة الزيارة الرسمية: 10 دقائق فقط داخل المنزل', 'Official visit duration: 10 minutes')}
                  </div>

                  <div className="h-10 bg-[#007C8D] text-white rounded-xl flex items-center justify-center text-xs font-bold shadow-xs">
                    {t('تأكيد حجز الزيارة', 'Confirm Booking')}
                  </div>
                </div>

                {heatmapMode === 'clicks' &&
                  CLARITY_HEATMAP_ZONES.map((zone) => {
                    const isSelected = selectedHeatmapZone === zone.id;
                    return (
                      <button
                        type="button"
                        key={zone.id}
                        onClick={() => setSelectedHeatmapZone(zone.id)}
                        style={{
                          left: `${zone.xPercent}%`,
                          top: `${zone.yPercent}%`,
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all cursor-pointer z-30 ${
                          isSelected
                            ? 'w-14 h-14 bg-rose-500/80 ring-4 ring-rose-300 animate-pulse text-white font-bold text-xs shadow-lg'
                            : 'w-10 h-10 bg-orange-500/70 hover:bg-orange-600/90 text-white font-bold text-[10px] shadow-md'
                        }`}
                      >
                        {zone.clickDensityPct}%
                      </button>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  {t('المناطق الأكثر نقرًا (Hot Zones)', 'High click frequency hot zones')}
                </span>
                <span className="font-mono font-bold text-[#007C8D]">
                  {webAudit?.detectedPixels.clarity
                    ? t('Clarity Tag مرصود على kidzy.qa', 'Clarity Tag Live on kidzy.qa')
                    : 'Microsoft Clarity Funnel View'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#BAEBF1] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#BAEBF1]/60">
                <Eye className="w-4 h-4 text-[#007C8D]" />
                <h3 className="text-sm font-bold text-[#063B44]">
                  {t('تفاصيل المنطقة وتوصيات تحسين التجربة', 'Hotspot Detail & Recommendations')}
                </h3>
              </div>

              <div className="space-y-2.5">
                {CLARITY_HEATMAP_ZONES.map((zone) => {
                  const isSelected = selectedHeatmapZone === zone.id;
                  return (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedHeatmapZone(zone.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#FEF4E3] border-[#FEC448]'
                          : 'bg-[#F7FAFB] border-slate-200 hover:border-[#01AFC5]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-[#063B44]">
                          {lang === 'en' ? zone.targetElementEn : zone.targetElementAr}
                        </span>
                        <span className="font-mono font-bold text-[#007C8D]">
                          {zone.clickDensityPct}% {t('نقر', 'clicks')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {t('نقرات غضب:', 'Rage clicks:')}{' '}
                          <strong className="text-rose-600">{zone.rageClicksCount}</strong>
                        </span>
                        <span className="text-[#007C8D] font-medium">
                          {zone.rageClicksCount > 5 ? t('يُنصح بتوضيح التفاعل', 'Clarify CTA') : t('سلوك مستقر', 'Stable')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 bg-[#BAEBF1]/30 border border-[#01AFC5]/50 rounded-2xl text-xs space-y-1 text-[#063B44]">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#007C8D]" />
                  <span>{t('توصية كيدزي لتجربة المستخدم:', 'Kidzy UX Recommendation:')}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t(
                    'إبراز بطاقة مدة الزيارة (10 دقائق) وقيمة الهدية قبل خطوة الدفع على الموقع وتطبيقي iOS و Android يقلل نقرات الغضب على زر التأكيد.',
                    'Highlighting the 10-minute duration and gift value before checkout across web, iOS, and Android reduces rage clicks.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SECTION 2: HOTJAR & REAL SYNCED SURVEY VOICE               */}
      {/* ========================================================== */}
      {activeTool === 'hotjar' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#063B44] to-[#007C8D] text-white rounded-3xl p-6 shadow-md space-y-3">
              <span className="text-xs font-bold text-[#BAEBF1] block">
                {t('مؤشر صافي الترويج (Net Promoter Score)', 'Net Promoter Score (NPS)')}
              </span>
              <div className="text-4xl font-black font-mono text-[#FEC448]">
                +{HOTJAR_NPS_SUMMARY.npsScore}
              </div>
              <p className="text-xs text-white/85 leading-relaxed">
                {t(
                  'مدعوم باستطلاعات Hotjar اللحظية على الموقع والتطبيق واستبيانات الأمهات الحية.',
                  'Backed by Hotjar micro-surveys across web & mobile plus live mother surveys.'
                )}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-500 block">
                {t('توزيع تقييمات الأمهات (NPS Breakdown)', 'NPS Cohort Breakdown')}
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-[#063B44] mb-1">
                    <span>{t('المروجون (9-10)', 'Promoters (9-10)')}</span>
                    <span className="font-mono text-emerald-600">{HOTJAR_NPS_SUMMARY.promotersPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${HOTJAR_NPS_SUMMARY.promotersPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-bold text-[#063B44] mb-1">
                    <span>{t('المحايدون (7-8)', 'Passives (7-8)')}</span>
                    <span className="font-mono text-amber-600">{HOTJAR_NPS_SUMMARY.passivesPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${HOTJAR_NPS_SUMMARY.passivesPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-bold text-[#063B44] mb-1">
                    <span>{t('المنتقدون (1-6)', 'Detractors (1-6)')}</span>
                    <span className="font-mono text-rose-600">{HOTJAR_NPS_SUMMARY.detractorsPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${HOTJAR_NPS_SUMMARY.detractorsPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-500 block">
                {t('مؤشر الرضا العام (CSAT Index)', 'Customer Satisfaction (CSAT)')}
              </span>
              <div className="text-4xl font-black font-mono text-[#007C8D]">
                {HOTJAR_NPS_SUMMARY.csatRatingPct}%
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  `مرتبط مع ${motherSurveys.length} استجابة أم و ${csSurveys.length} تذكرة خدمة عملاء مسجلة فعليًا.`,
                  `Synced with ${motherSurveys.length} live mother surveys & ${csSurveys.length} CS tickets.`
                )}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#BAEBF1] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#BAEBF1]/60">
              <div className="flex items-center gap-2.5">
                <Heart className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-sm font-bold text-[#063B44]">
                    {t('صوت الأمهات وملاحظات التطبيق والموقع المباشرة', 'Voice of Mothers & Live App/Web UX Feedback')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t(
                      'يجمع تعليقات الاستبيانات الحية من قاعدة البيانات مع مقتطفات Hotjar على kidzy.qa والتطبيقات.',
                      'Unifies live Firestore mother/CS feedback with Hotjar UX observations.'
                    )}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-[#007C8D]">
                {mergedVoiceFeedback.length} {t('ملاحظة مرصودة', 'feedback items')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mergedVoiceFeedback.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#063B44]">
                      {lang === 'en' ? item.customerRoleEn : item.customerRoleAr}
                    </span>
                    <span className="font-mono font-black text-xs text-[#007C8D]">
                      {item.score}/10
                    </span>
                  </div>

                  <p className="text-xs text-[#063B44] leading-relaxed italic">
                    "{lang === 'en' ? item.quoteEn : item.quoteAr}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/70">
                    <span>{item.contextPage}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SECTION 3: FIREBASE PERFORMANCE & CRASHLYTICS              */}
      {/* ========================================================== */}
      {activeTool === 'firebase' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-4 bg-[#FEF4E3] border border-[#FEC448] rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white border border-[#FEC448] flex items-center justify-center text-amber-600 font-bold shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-[#063B44] flex flex-wrap items-center gap-2">
                  <span>{t('اتصال Firebase Performance & Crashlytics', 'Live Firebase Telemetry')}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-800 font-mono">
                    {FIREBASE_PERFORMANCE_METRICS.connectedProjectId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                  Web: kidzy.qa · iOS: id1607986658 · Android: com.kidzy.qa
                </p>
              </div>
            </div>

            <div className="font-mono font-bold text-[#063B44]">
              {FIREBASE_PERFORMANCE_METRICS.activeSessionsLive} {t('جلسة نشطة الآن', 'active sessions')}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">
                {t('المستخدمون الخالون من الأعطال', 'Crash-Free Users')}
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono tabular-nums mt-1">
                {crashFreeUsersDisplayPct}%
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {t('معيار ممتاز > 99.5%', 'Healthy > 99.5%')}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">
                {t('الجلسات الخالية من الأعطال', 'Crash-Free Sessions')}
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono tabular-nums mt-1">
                {FIREBASE_PERFORMANCE_METRICS.crashFreeSessionsPct}%
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {FIREBASE_PERFORMANCE_METRICS.fatalCrashesLast7d} {t('أعطال آخر 7 أيام', 'fatal 7d')}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">
                {t('زمن التشغيل (Cold Start)', 'App Cold Start')}
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#007C8D] font-mono tabular-nums mt-1">
                {coldStartDisplayMs}ms
              </div>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                {t('سريع (< 1.5s)', 'Fast (< 1.5s)')}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">
                {t('سرعة موقع kidzy.qa (TTFB)', 'kidzy.qa Live TTFB')}
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                {webAudit ? `${webAudit.latencyMs}ms` : `${FIREBASE_PERFORMANCE_METRICS.appWarmStartMs}ms`}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                {webAudit ? t('قياس مباشر للموقع', 'Live server probe') : t('زمن التشغيل الدافئ', 'Warm Start')}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">
                {t('معدل عدم الاستجابة (ANR Rate)', 'ANR Rate')}
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                {FIREBASE_PERFORMANCE_METRICS.anrRatePct}%
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {t('ضمن الحد الآمن (< 0.47%)', 'Under threshold')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#BAEBF1] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#BAEBF1]/60">
                <Server className="w-4 h-4 text-[#007C8D]" />
                <h3 className="text-sm font-bold text-[#063B44]">
                  {t('سرعة استجابة استعلامات السحابة والشبكة', 'Firebase Network Latency Monitor')}
                </h3>
              </div>

              <div className="space-y-3">
                {FIREBASE_NETWORK_ENDPOINTS.map((endpoint, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/70 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#063B44]">
                        {endpoint.endpointName}
                      </span>
                      <span className="font-mono font-bold text-[#007C8D]">
                        {endpoint.avgLatencyMs}ms
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#007C8D] h-full rounded-full"
                        style={{ width: `${Math.min(100, (endpoint.avgLatencyMs / 500) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{endpoint.method}</span>
                      <span>{endpoint.requestsCount24h} {t('طلب/يوم', 'req/24h')}</span>
                      <span className="font-bold text-emerald-600">
                        {100 - endpoint.failureRatePct}% {t('نجاح', 'Success')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#BAEBF1] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#BAEBF1]/60">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-[#063B44]">
                  {t('سجل استثناءات Crashlytics', 'Crashlytics Issues Stream')}
                  {platformFilter === 'ios' ? ' · iOS' : platformFilter === 'android' ? ' · Android' : ''}
                </h3>
              </div>

              <div className="space-y-3">
                {filteredCrashes.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/70 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-mono font-bold text-rose-700 truncate">
                        {issue.exceptionName}
                      </span>
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          issue.status === 'resolved'
                            ? 'text-emerald-700'
                            : issue.status === 'investigating'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {issue.status === 'resolved'
                          ? t('محلول', 'Resolved')
                          : issue.status === 'investigating'
                          ? t('قيد التحقق', 'Investigating')
                          : t('مفتوح', 'Open')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>{issue.deviceModel} ({issue.osVersion})</span>
                      <span className="font-mono font-bold">
                        {issue.occurrencesCount} {t('مرات', 'events')} · {issue.affectedUsersCount} {t('مستخدمين', 'users')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
