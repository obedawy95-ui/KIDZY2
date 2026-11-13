import React, { useState } from 'react';
import { OperationsSurveyResponse } from '../types/survey';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';
import { getFriendlyFirestoreSubmitError } from '../services/surveyFirestore';
import { KidzyMonogram, KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';
import { Compass, Send, CheckCircle2, Clock, Truck, AlertTriangle, Check, Link2 } from 'lucide-react';

interface OperationsSurveyViewProps {
  onSubmit: (response: OperationsSurveyResponse) => Promise<void> | void;
  isStandalone?: boolean;
}

export const OperationsSurveyView: React.FC<OperationsSurveyViewProps> = ({
  onSubmit,
  isStandalone = false,
}) => {
  const { lang, dir, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [coordinatorNameOrCode, setCoordinatorNameOrCode] = useState('');
  const [shiftType, setShiftType] = useState('');
  const [dailyDispatchedVisits, setDailyDispatchedVisits] = useState<number>(0);
  const [scheduleAdherenceRating, setScheduleAdherenceRating] = useState<number>(3);
  const [driverLatenessRateOutOfTen, setDriverLatenessRateOutOfTen] = useState<number>(0);
  const [mascotLatenessRateOutOfTen, setMascotLatenessRateOutOfTen] = useState<number>(0);

  const [primaryDispatchBottlenecks, setPrimaryDispatchBottlenecks] = useState<string[]>([]);
  const [costumeReadinessAndMaintenance, setCostumeReadinessAndMaintenance] = useState('');
  const [appBookingIntegrationIssues, setAppBookingIntegrationIssues] = useState('');
  const [pricingFeedbackFromOperations, setPricingFeedbackFromOperations] = useState('');
  const [coordinationBetweenCSAndField, setCoordinationBetweenCSAndField] = useState('');
  const [peakHoursStrategyFeedback, setPeakHoursStrategyFeedback] = useState('');
  const [proposalsForLeadership, setProposalsForLeadership] = useState('');

  const bottleneckOptions = [
    { val: 'تباعد المسافات بين الأحياء وزحام المرور', en: 'Long distances between districts & traffic' },
    { val: 'تأخر تجهيز الهدايا والبالونات من الشركاء', en: 'Partner delays preparing gifts/balloons' },
    { val: 'تعديل العملاء للمواعيد أو العناوين في آخر لحظة', en: 'Last-minute address/time changes by clients' },
    { val: 'صعوبة دخول الكمباوندات والمجمعات السكنية المغلقة', en: 'Compound gate clearance delays' },
    { val: 'نقص السائقين الاحتياط في ساعات الذروة', en: 'Shortage of backup drivers during peak hours' },
    { val: 'تعطل أو تضرر الأزياء أثناء النقل والتنقل', en: 'Costume wear or damage during transit' },
  ];

  const toggleBottleneck = (itemVal: string) => {
    if (primaryDispatchBottlenecks.includes(itemVal)) {
      setPrimaryDispatchBottlenecks(primaryDispatchBottlenecks.filter((i) => i !== itemVal));
    } else {
      setPrimaryDispatchBottlenecks([...primaryDispatchBottlenecks, itemVal]);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setCoordinatorNameOrCode('');
    setShiftType('');
    setDailyDispatchedVisits(0);
    setScheduleAdherenceRating(3);
    setDriverLatenessRateOutOfTen(0);
    setMascotLatenessRateOutOfTen(0);
    setPrimaryDispatchBottlenecks([]);
    setCostumeReadinessAndMaintenance('');
    setAppBookingIntegrationIssues('');
    setPricingFeedbackFromOperations('');
    setCoordinationBetweenCSAndField('');
    setPeakHoursStrategyFeedback('');
    setProposalsForLeadership('');
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload: OperationsSurveyResponse = {
      id: `ops-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      submittedAt: new Date().toISOString(),
      coordinatorNameOrCode: coordinatorNameOrCode.trim(),
      shiftType,
      dailyDispatchedVisits: Number(dailyDispatchedVisits) || 0,
      scheduleAdherenceRating,
      driverLatenessRateOutOfTen: Number(driverLatenessRateOutOfTen) || 0,
      mascotLatenessRateOutOfTen: Number(mascotLatenessRateOutOfTen) || 0,
      primaryDispatchBottlenecks,
      costumeReadinessAndMaintenance: costumeReadinessAndMaintenance.trim(),
      appBookingIntegrationIssues: appBookingIntegrationIssues.trim(),
      pricingFeedbackFromOperations: pricingFeedbackFromOperations.trim(),
      coordinationBetweenCSAndField: coordinationBetweenCSAndField.trim(),
      peakHoursStrategyFeedback: peakHoursStrategyFeedback.trim(),
      proposalsForLeadership: proposalsForLeadership.trim(),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        getFriendlyFirestoreSubmitError(
          error,
          lang,
          'تعذر إرسال استبيان العمليات لقاعدة البيانات حاليًا. يرجى المحاولة مرة أخرى.',
          'Unable to submit operations survey right now. Please try again.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="max-w-2xl mx-auto my-12 bg-white rounded-3xl p-8 shadow-xl border border-[#BAEBF1] text-center relative overflow-hidden"
        dir={dir}
      >
        <KidzyPatternDecor variant="cream-card" />
        <div className="relative z-10 flex flex-col items-center">
          <KidzyWordmark
            variant="teal"
            className="h-9 w-auto mb-5"
            showTagline
            taglineBilingual={t('اصنع يومهم.. على طريقة كيدزي', 'MAKE THEIR DAY. THE KIDZY WAY.')}
          />
          <div className="w-20 h-20 bg-[#BAEBF1]/50 text-[#007C8D] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-[#063B44] mb-3">
            {t('شكرًا لك على المشاركة القيمة!', 'Thank You for Your Input!')}
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {t(
              'تم حفظ ردك بنجاح في سجل العمليات والتشغيل لـ kidzy kpi,s.',
              'Your response has been saved in the kidzy kpi,s operations database.'
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-[#007C8D] hover:bg-[#005866] text-white font-bold rounded-xl transition shadow-md cursor-pointer"
            >
              {t('إرسال استبيان جديد', 'Submit Another Survey')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 px-4 pt-6" dir={dir}>
      {isStandalone && (
        <div className="mb-6 p-4 bg-[#FEF4E3] border border-[#FEC448]/60 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Link2 className="w-4 h-4 text-[#007C8D] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#063B44]">
                {t('أنت الآن في الرابط المباشر المخصص لـ ', 'Direct link for ')}
                <span className="font-bold">
                  {t('فريق العمليات والتشغيل – kidzy kpi,s', 'Operations & Dispatch Team – kidzy kpi,s')}
                </span>
                .
              </p>
              <span className="text-[11px] font-bold text-[#007C8D] block mt-0.5">
                {t(
                  'استجابة زائر مباشرة · بدون الحاجة لتسجيل الدخول ببريد إلكتروني أو كلمة مرور',
                  'Guest response · No email or password required'
                )}
              </span>
            </div>
          </div>
          <LanguageSwitcher variant="light" />
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-[#063B44] via-[#005866] to-[#007C8D] rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <KidzyWordmark variant="cream" className="h-7 w-auto mb-3" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shrink-0">
                <Compass className="w-8 h-8 text-[#FEC448]" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#BAEBF1] mb-1">
                  <span dir="ltr" className="font-bold text-white">kidzy kpi,s</span>
                  <span aria-hidden="true">·</span>
                  <span>{t('إدارة التوجيه واللوجستيات', 'Dispatch & Logistics')}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  {t('استبيان العمليات والتشغيل', 'Operations & Dispatch Survey')}
                </h1>
              </div>
            </div>
            <p className="text-[#BAEBF1] text-sm sm:text-base leading-relaxed">
              {t(
                'توجيه الميدان بين السائقين والموظفات ومواعيد العائلات هو العصب الحقيقي للخدمة. يساعدنا هذا النموذج في كشف نقاط الاختناق ومعدلات التأخير الفعلية لتحسين الجداول.',
                'Coordinating drivers, character staff, and family schedules is the operational backbone. This survey pinpoints bottlenecks and actual delay causes.'
              )}
            </p>
          </div>

          <LanguageSwitcher variant="glass" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#BAEBF1]/80">
          <h2 className="text-xl font-bold text-[#063B44] mb-6 flex items-center gap-2 pb-3 border-b border-[#BAEBF1]/50">
            <Clock className="w-5 h-5 text-[#007C8D] shrink-0" />
            <span>{t('1. معلومات الوردية وحجم الطلبات الميدانية', '1. Shift & Dispatched Volume')}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-[#063B44] mb-2">
                {t('اسم المشرف / المنسق أو الكود التعريفي (اختياري)', 'Coordinator name or code (optional)')}
              </label>
              <input
                type="text"
                placeholder={t('مثال: منسق عمليات المنطقة الوسطى', 'e.g., Central Dispatch Lead')}
                value={coordinatorNameOrCode}
                onChange={(e) => setCoordinatorNameOrCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] focus:border-[#01AFC5] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#063B44] mb-2">
                {t('فترة الوردية التشغيلية', 'Operations shift')}
              </label>
              <select
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] focus:border-[#01AFC5] outline-none transition bg-white"
              >
                <option value="" disabled>
                  {t('اختَر فترة الوردية...', 'Select shift...')}
                </option>
                <option value="صباحية (9 ص – 3 م)">
                  {t('صباحية (9 ص – 3 م)', 'Morning (9 AM – 3 PM)')}
                </option>
                <option value="مسائية (أوقات الذروة 3 م – 11 م)">
                  {t('مسائية (أوقات الذروة 3 م – 11 م)', 'Evening Peak (3 PM – 11 PM)')}
                </option>
                <option value="عطلات نهاية الأسبوع والأعياد (مناسبات كبرى)">
                  {t('عطلات نهاية الأسبوع والأعياد', 'Weekends & Holidays')}
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-[#063B44]">
                  {t('متوسط الطلبات الموزعة في ورديتك', 'Average dispatched orders per shift')}
                </label>
                <span className="text-sm font-bold text-[#063B44] bg-[#BAEBF1]/50 px-2.5 py-0.5 rounded-lg tabular-nums">
                  {dailyDispatchedVisits} {t('طلب', 'orders')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={dailyDispatchedVisits}
                onChange={(e) => setDailyDispatchedVisits(Number(e.target.value))}
                className="w-full accent-[#007C8D] h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-[#063B44]">
                  {t('مدى التزام الميدان بالجدول العام', 'Overall schedule adherence')}
                </label>
                <span className="text-sm font-bold text-[#063B44] bg-[#BAEBF1]/50 px-2.5 py-0.5 rounded-lg tabular-nums">
                  {scheduleAdherenceRating} / 5 ★
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setScheduleAdherenceRating(star)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition cursor-pointer tabular-nums ${
                      scheduleAdherenceRating >= star
                        ? 'bg-[#FEC448] border-[#FEC448] text-[#063B44] shadow-sm'
                        : 'bg-[#F7FAFB] border-slate-200 text-slate-500 hover:bg-[#BAEBF1]/25'
                    }`}
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#BAEBF1]/80 space-y-6">
          <h2 className="text-xl font-bold text-[#063B44] mb-6 flex items-center gap-2 pb-3 border-b border-[#BAEBF1]/50">
            <Truck className="w-5 h-5 text-[#007C8D] shrink-0" />
            <span>{t('2. معدلات التأخير والاختناقات اللوجستية', '2. Lateness & Logistics Bottlenecks')}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-[#FEF4E3]/70 rounded-2xl border border-[#FEC448]/60">
            <div>
              <div className="flex justify-between items-center mb-2 gap-2">
                <label className="text-sm font-bold text-[#063B44]">
                  {t('كم من كل 10 طلبات يتأخر السائقون في التوصيل؟', 'Out of 10 orders, driver late arrivals?')}
                </label>
                <span className="text-base font-black text-[#007C8D] bg-white px-3 py-1 rounded-lg border border-[#BAEBF1] tabular-nums shrink-0">
                  {driverLatenessRateOutOfTen} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={driverLatenessRateOutOfTen}
                onChange={(e) => setDriverLatenessRateOutOfTen(Number(e.target.value))}
                className="w-full accent-[#007C8D] h-2 bg-white rounded-lg cursor-pointer"
              />
              <p className="text-xs text-slate-600 mt-2">
                {t('توصيلات الهدايا، البالونات، والكيك بدون شخصية', 'Driver-only gifts, balloons & cakes')}
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 gap-2">
                <label className="text-sm font-bold text-[#063B44]">
                  {t('كم من كل 10 زيارات تتأخر موظفات الشخصيات؟', 'Out of 10 visits, character staff late arrivals?')}
                </label>
                <span className="text-base font-black text-[#007C8D] bg-white px-3 py-1 rounded-lg border border-[#BAEBF1] tabular-nums shrink-0">
                  {mascotLatenessRateOutOfTen} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={mascotLatenessRateOutOfTen}
                onChange={(e) => setMascotLatenessRateOutOfTen(Number(e.target.value))}
                className="w-full accent-[#007C8D] h-2 bg-white rounded-lg cursor-pointer"
              />
              <p className="text-xs text-slate-600 mt-2">
                {t('زيارات العشر دقائق للشخصيات الكرتونية', '10-minute character visits')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#063B44] mb-3">
              {t('أبرز اختناقات التوجيه والتوصيل التي تتكرر لديكم (اختاري ما ينطبق):', 'Most frequent dispatch bottlenecks:')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bottleneckOptions.map((opt) => {
                const checked = primaryDispatchBottlenecks.includes(opt.val);
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => toggleBottleneck(opt.val)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                      lang === 'en' ? 'text-left' : 'text-right'
                    } ${
                      checked
                        ? 'border-[#01AFC5] bg-[#BAEBF1]/35 text-[#063B44] font-medium'
                        : 'border-slate-200 hover:bg-[#BAEBF1]/15 text-[#063B44]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                        checked ? 'bg-[#007C8D] border-[#007C8D] text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm">{lang === 'en' ? opt.en : opt.val}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#BAEBF1]/50">
            <label className="block text-sm font-semibold text-[#063B44] mb-2">
              {t(
                'ما هي الشكاوى أو المشاكل التي تظهر في تكامل التطبيق والموقع مع التوجيه (GPS وتوزيع الطلبات)؟',
                'Issues between app/website bookings and GPS/dispatch routing:'
              )}
            </label>
            <textarea
              rows={3}
              placeholder={t(
                'مثال: الخريطة لا تعكس الزحام الحقيقي، توجيه غير مرتب جغرافياً...',
                'e.g., map ignores live traffic, unclustered routes...'
              )}
              value={appBookingIntegrationIssues}
              onChange={(e) => setAppBookingIntegrationIssues(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] outline-none text-sm transition"
            />
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#BAEBF1]/80 space-y-6">
          <h2 className="text-xl font-bold text-[#063B44] mb-4 flex items-center gap-2 pb-3 border-b border-[#BAEBF1]/50">
            <KidzyMonogram variant="teal" size={22} />
            <span>{t('3. جاهزية الأزياء، الأسعار، والمقترحات', '3. Costumes, Pricing & Proposals')}</span>
          </h2>

          <div>
            <label className="block text-sm font-semibold text-[#063B44] mb-2">
              {t(
                'حالة أزياء الشخصيات ونظافتها وصيانتها أثناء التنقل',
                'Mascot costume readiness, hygiene & maintenance in transit'
              )}
            </label>
            <textarea
              rows={2}
              placeholder={t(
                'مثال: الأزياء تحتاج تبديل أسرع للمراوح الداخلية، حقائب النقل ثقيلة...',
                'e.g., faster fan battery swaps, lighter transport bags...'
              )}
              value={costumeReadinessAndMaintenance}
              onChange={(e) => setCostumeReadinessAndMaintenance(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] outline-none text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#063B44] mb-2">
              {t(
                'ملاحظات التشغيل حول أسعار التوصيل والخدمات (رأي الفريق والعملاء في الميدان)',
                'Operations notes regarding delivery & service pricing'
              )}
            </label>
            <input
              type="text"
              placeholder={t(
                'اكتب ملاحظتك عن أسعار الباقات أو تكلفة التوصيل السريع...',
                'Notes on package pricing or express delivery fees...'
              )}
              value={pricingFeedbackFromOperations}
              onChange={(e) => setPricingFeedbackFromOperations(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] outline-none text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#063B44] mb-2">
              {t(
                'كيف تصف التنسيق والتواصل بين فريق خدمة العملاء وفريق التشغيل والميدان؟',
                'How is the coordination between Customer Support and Dispatch?'
              )}
            </label>
            <textarea
              rows={2}
              placeholder={t(
                'مثال: نحتاج قناة واحدة لحالات الطوارئ والتعديلات العاجلة...',
                'e.g., Need a unified escalation channel...'
              )}
              value={coordinationBetweenCSAndField}
              onChange={(e) => setCoordinationBetweenCSAndField(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] outline-none text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#063B44] mb-2">
              {t(
                'مقترحك الأهم لإدارة kidzy kpi,s لتفادي التأخيرات في ساعات الذروة والمواسم',
                'Your key recommendation to avoid peak-hour delays'
              )}
            </label>
            <textarea
              rows={3}
              placeholder={t(
                'مثال: تقسيم المدينة إلى قطاعات جغرافية ثابتة لكل سائق...',
                'e.g., Fixed geographic zones per driver...'
              )}
              value={proposalsForLeadership}
              onChange={(e) => setProposalsForLeadership(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] outline-none text-sm transition"
            />
          </div>
        </div>

        {submitError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-4 bg-[#063B44] hover:bg-[#005866] disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3 text-base sm:text-lg whitespace-nowrap cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span>
              {isSubmitting
                ? t('جاري الإرسال...', 'Submitting...')
                : t('إرسال استبيان العمليات والتشغيل', 'Submit Operations Survey')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
