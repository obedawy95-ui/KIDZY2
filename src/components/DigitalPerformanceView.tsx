import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';
import {
  INITIAL_GA4_TRAFFIC_SOURCES,
  INITIAL_GA4_CONVERSION_FUNNEL,
  INITIAL_GA4_EVENTS,
} from '../data/analyticsToolsData';
import { GA4CustomEvent, TimeframeOption } from '../types/analyticsTools';
import {
  Globe,
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Code2,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  MapPin,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const DigitalPerformanceView: React.FC = () => {
  const { lang, dir, t } = useLanguage();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30d');
  const [eventsList, setEventsList] = useState<GA4CustomEvent[]>(INITIAL_GA4_EVENTS);
  const [simulatedLiveCount, setSimulatedLiveCount] = useState(34);
  const [selectedEventToDispatch, setSelectedEventToDispatch] = useState('survey_starred_answer');
  const [customEventParam, setCustomEventParam] = useState('character=fluffy_lion');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);
  const [isTagCodeModalOpen, setIsTagCodeModalOpen] = useState(false);
  const [measurementId, setMeasurementId] = useState('G-KIDZY2026KP');
  const [copiedCode, setCopiedCode] = useState(false);

  // Timeframe multiplier for dynamic adjustments
  const multiplier = timeframe === 'today' ? 0.08 : timeframe === '7d' ? 0.28 : timeframe === '90d' ? 2.8 : 1.0;

  const totalSessions = Math.round(41190 * multiplier);
  const totalUsers = Math.round(32800 * multiplier);
  const totalConversions = Math.round(3180 * multiplier);
  const avgEngagementSec = 222; // 3m 42s

  const handleDispatchTestEvent = () => {
    setIsDispatching(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      setEventsList((prev) =>
        prev.map((ev) =>
          ev.eventName === selectedEventToDispatch
            ? {
                ...ev,
                count: ev.count + 1,
                lastFired: t(`الآن (${timeStr})`, `Just now (${timeStr})`),
              }
            : ev
        )
      );

      setSimulatedLiveCount((prev) => prev + 1);
      setIsDispatching(false);
      setDispatchSuccessMsg(
        t(
          `تم بنجاح إرسال الحدث «${selectedEventToDispatch}» إلى وحدة القياس الرقمية GA4!`,
          `Event "${selectedEventToDispatch}" dispatched successfully to GA4 stream!`
        )
      );
      setTimeout(() => setDispatchSuccessMsg(null), 4000);
    }, 600);
  };

  const gtagSnippet = `<!-- Google tag (gtag.js) - Kidzy KPIs -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${measurementId}', {
    app_name: 'kidzy kpi,s',
    send_page_view: true,
    custom_map: {
      dimension1: 'character_name',
      dimension2: 'visit_duration',
      dimension3: 'pricing_tier'
    }
  });
</script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gtagSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6" dir={dir}>
      {/* Top Banner with Kidzy Branding & Live Pulse */}
      <div className="bg-gradient-to-br from-[#063B44] via-[#005866] to-[#007C8D] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <KidzyWordmark variant="cream" className="h-8 w-auto mb-3" />
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-[#FEC448] text-[#063B44] text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <Globe className="w-3.5 h-3.5" />
                {t('قسم الأداء الرقمي · Google Analytics 4', 'Digital Performance · Google Analytics 4')}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-xs font-bold px-3 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t(`${simulatedLiveCount} زائرًا متفاعلاً الآن`, `${simulatedLiveCount} live visitors right now`)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              <span dir="ltr" className="font-['Nunito',sans-serif]">
                kidzy kpi,s
              </span>{' '}
              – {t('لوحة قياس وتحليل الزيارات الرقمية والحجوزات', 'Digital Traffic, Funnels & GA4 KPIs')}
            </h1>
            <p className="text-xs sm:text-sm text-[#BAEBF1] mt-2 max-w-2xl leading-relaxed">
              {t(
                'رصد فوري لتدفق الزيارات عبر قنوات التواصل (إنستغرام، سناب، بحث Google)، مسار تحويل الحجوزات (Funnel)، والأحداث المخصصة لخدمات الشخصيات الكرتونية.',
                'Real-time traffic acquisition from social channels (Instagram, Snapchat, SEO), booking funnel conversion, and custom mascot event telemetry.'
              )}
            </p>
          </div>

          {/* Timeframe & Tag Code actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl flex items-center border border-white/20">
              {(['today', '7d', '30d', '90d'] as TimeframeOption[]).map((tf) => (
                <button
                  type="button"
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    timeframe === tf
                      ? 'bg-white text-[#063B44] shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tf === 'today'
                    ? t('اليوم', 'Today')
                    : tf === '7d'
                    ? t('7 أيام', '7 Days')
                    : tf === '30d'
                    ? t('30 يومًا', '30 Days')
                    : t('90 يومًا', '90 Days')}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsTagCodeModalOpen(true)}
              className="px-4 py-2 bg-[#FEC448] hover:bg-[#e5ad35] text-[#063B44] font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>{t('إعدادات وسم GA4', 'GA4 Tag Setup')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Core KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('إجمالي الجلسات', 'Total Sessions')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
            {totalSessions.toLocaleString()}
          </div>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +14.2% {t('مقارنة بالفترة السابقة', 'vs prev')}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('المستخدمون النشطون', 'Active Users')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
            {totalUsers.toLocaleString()}
          </div>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +18.5%
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('متوسط مدة التفاعل', 'Avg Engagement')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#007C8D] font-mono tabular-nums mt-1">
            {Math.floor(avgEngagementSec / 60)}m {avgEngagementSec % 60}s
          </div>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +8.3%
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('نسبة التفاعل', 'Engagement Rate')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
            65.8%
          </div>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-500 mt-1">
            {t('معيار ممتاز > 60%', 'Good > 60%')}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#BAEBF1] p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('معدل الارتداد', 'Bounce Rate')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
            34.2%
          </div>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 mt-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            -4.1% {t('انخفاض صحي', 'Healthy drop')}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#FEC448] p-4 shadow-xs bg-[#FEF4E3]/40">
          <span className="text-[11px] font-bold text-[#063B44] block">
            {t('الحجوزات المكتملة', 'Bookings Won')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#007C8D] font-mono tabular-nums mt-1">
            {totalConversions.toLocaleString()}
          </div>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 mt-1">
            {t('تحويل إجمالي 7.7%', '7.7% Total CVR')}
          </span>
        </div>
      </div>

      {/* Traffic Channels & Funnel Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Traffic Acquisition Sources */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#BAEBF1] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#BAEBF1]/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#BAEBF1]/40 text-[#007C8D] flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#063B44]">
                  {t('مصادر الزيارات واكتساب العملاء (Traffic Sources)', 'Traffic Acquisition Sources')}
                </h2>
                <p className="text-xs text-slate-500">
                  {t('تحليل أداء القنوات التسويقية وتفاعل أولياء الأمور مع كيدزي', 'Marketing channel acquisition & booking conversion')}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-[#FEF4E3] text-[#063B44] px-2.5 py-1 rounded-full border border-[#FEC448]/60">
              GA4 UTM Default
            </span>
          </div>

          <div className="space-y-3">
            {INITIAL_GA4_TRAFFIC_SOURCES.map((source, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/70 hover:border-[#01AFC5] transition space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="font-bold text-[#063B44] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#007C8D]" />
                    <span>{lang === 'en' ? source.channelEn : source.channel}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono font-bold text-slate-600">
                    <span>{Math.round(source.sessions * multiplier).toLocaleString()} {t('جلسة', 'sessions')}</span>
                    <span className="text-[#007C8D] bg-white px-2 py-0.5 rounded-lg border border-[#BAEBF1]/80">
                      {source.conversionRatePct}% {t('تحويل', 'CVR')}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#01AFC5] to-[#007C8D] rounded-full"
                    style={{ width: `${source.sharePct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>{t('معدل الارتداد:', 'Bounce:')} {source.bounceRatePct}%</span>
                  <span>{t('متوسط المكوث:', 'Avg Time:')} {Math.floor(source.avgDurationSec / 60)}m {source.avgDurationSec % 60}s</span>
                  <span className="font-bold text-[#063B44]">{source.sharePct}% {t('من مجمل الزيارات', 'of total')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* E-Commerce & Visit Booking Conversion Funnel */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#BAEBF1] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#BAEBF1]/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FEF4E3] text-[#063B44] flex items-center justify-center font-bold border border-[#FEC448]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#063B44]">
                  {t('مسار تحويل الحجوزات (Booking Funnel)', 'Booking Conversion Funnel')}
                </h2>
                <p className="text-xs text-slate-500">
                  {t('نسب التسرب والانتقال بين مراحل طلب الزيارة', 'Drop-off & progression between steps')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {INITIAL_GA4_CONVERSION_FUNNEL.map((step, idx) => {
              const adjustedCount = Math.round(step.count * multiplier);
              return (
                <div
                  key={step.id}
                  className="p-3 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/80 hover:bg-[#BAEBF1]/20 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-[#063B44] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#007C8D] text-white text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{lang === 'en' ? step.nameEn : step.nameAr}</span>
                    </span>
                    <span className="font-mono font-bold text-[#063B44]">
                      {adjustedCount.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FEC448] via-[#01AFC5] to-[#007C8D] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, step.stepConversionPct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500 font-medium">
                    <span>
                      {t('نسبة الانتقال للخطوة:', 'Step Conversion:')}{' '}
                      <strong className="text-[#007C8D]">{step.stepConversionPct}%</strong>
                    </span>
                    {step.dropoffPct > 0 && (
                      <span className="text-rose-600 font-bold">
                        -{step.dropoffPct}% {t('تسرب', 'drop-off')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Event Telemetry & Live Event Dispatcher */}
      <div className="bg-white rounded-3xl border border-[#BAEBF1] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#BAEBF1]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#BAEBF1]/40 text-[#007C8D] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#063B44]">
                {t('أحداث التتبع المخصصة (GA4 Custom Events Stream)', 'GA4 Custom Events Stream')}
              </h2>
              <p className="text-xs text-slate-500">
                {t(
                  'رصد مباشر للأحداث الميدانية الرقمية: عرض الشخصيات، الإجابة على الأسئلة الإلزامية، وتنبيهات تجاوز الـ 10 دقائق',
                  'Live telemetry for key mascot interactions, starred survey submissions, and overtime alerts'
                )}
              </p>
            </div>
          </div>

          {/* Interactive Test Event Dispatcher */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedEventToDispatch}
              onChange={(e) => setSelectedEventToDispatch(e.target.value)}
              className="py-2 px-3 text-xs bg-[#F7FAFB] border border-slate-300 rounded-xl font-bold text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
            >
              <option value="survey_starred_answer">survey_starred_answer</option>
              <option value="view_character_profile">view_character_profile</option>
              <option value="overtime_alert_triggered">overtime_alert_triggered</option>
              <option value="pricing_modal_opened">pricing_modal_opened</option>
              <option value="whatsapp_support_click">whatsapp_support_click</option>
              <option value="survey_submitted_guest">survey_submitted_guest</option>
            </select>

            <button
              type="button"
              disabled={isDispatching}
              onClick={handleDispatchTestEvent}
              className="px-4 py-2 bg-[#007C8D] hover:bg-[#005866] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isDispatching ? t('جارٍ الإرسال...', 'Dispatching...') : t('إرسال حدث تجريبي لحظي', 'Dispatch Test Event')}</span>
            </button>
          </div>
        </div>

        {dispatchSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{dispatchSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {eventsList.map((ev) => (
            <div
              key={ev.eventName}
              className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#BAEBF1]/80 hover:border-[#01AFC5] transition space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-xs text-[#007C8D] bg-white px-2 py-0.5 rounded-lg border border-[#BAEBF1]/70">
                  {ev.eventName}
                </span>
                <span className="text-[11px] font-bold text-slate-500">{ev.category}</span>
              </div>
              <p className="text-xs text-[#063B44] leading-relaxed">
                {lang === 'en' ? ev.descriptionEn : ev.descriptionAr}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-mono">
                  {t('إجمالي المرات:', 'Count:')}{' '}
                  <strong className="text-[#063B44]">{ev.count.toLocaleString()}</strong>
                </span>
                {ev.lastFired && (
                  <span className="text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-medium">
                    {ev.lastFired}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GA4 Tag Setup Modal */}
      {isTagCodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#063B44]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#BAEBF1] space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#BAEBF1]/60">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-6 h-6 text-[#007C8D]" />
                <h3 className="text-base font-bold text-[#063B44]">
                  {t('كود وسم التتبع الرقمي لـ Google Analytics 4', 'Google Analytics 4 Tag Configuration')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTagCodeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#063B44]">
                {t('معرّف القياس (Measurement ID):', 'Measurement ID:')}
              </label>
              <input
                type="text"
                dir="ltr"
                value={measurementId}
                onChange={(e) => setMeasurementId(e.target.value)}
                className="w-full text-xs font-mono py-2 px-3 bg-[#F7FAFB] border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#01AFC5] focus:outline-none"
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#063B44]">
                  {t('كود التثبيت في رأس الصفحة (<head>):', 'Snippet for <head> tag:')}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs font-bold text-[#007C8D] hover:underline cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? t('تم النسخ!', 'Copied!') : t('نسخ الكود', 'Copy Code')}</span>
                </button>
              </div>
              <pre
                dir="ltr"
                className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800"
              >
                {gtagSnippet}
              </pre>
            </div>

            <div className="p-3 bg-[#FEF4E3] border border-[#FEC448]/80 rounded-2xl text-xs text-[#063B44] space-y-1">
              <p className="font-bold">
                {t('💡 تلميح الربط الميداني مع الاستبيانات:', 'Field Survey Integration Tip:')}
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t(
                  'يقوم تطبيق كيدزي تلقائيًا بإرسال أحداث عند إرسال مذكرات الـ 30 ثانية واستبيانات الموظفات كزائرات وتتبع الإجابات الإلزامية الـ 18.',
                  'Kidzy app automatically emits events when 30s logs and staff surveys are submitted by guests, tracking all 18 starred questions.'
                )}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsTagCodeModalOpen(false)}
                className="px-5 py-2.5 bg-[#063B44] text-white text-xs font-bold rounded-xl hover:bg-[#005866] cursor-pointer"
              >
                {t('إغلاق وحفظ', 'Close & Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
