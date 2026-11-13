import React, { useState } from 'react';
import { DriverSurveyResponse } from '../types/survey';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';
import { getFriendlyFirestoreSubmitError } from '../services/surveyFirestore';
import { KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';
import {
  Truck,
  CheckCircle2,
  Send,
  AlertTriangle,
  Camera,
  DollarSign,
  PhoneCall,
  MapPin,
  Save,
  Link2,
} from 'lucide-react';

interface DriversSurveyViewProps {
  onSaveSurvey?: (response: DriverSurveyResponse) => Promise<void> | void;
  onSubmit?: (response: DriverSurveyResponse) => Promise<void> | void;
  isStandalone?: boolean;
}

export const DriversSurveyView: React.FC<DriversSurveyViewProps> = ({
  onSaveSurvey,
  onSubmit,
  isStandalone = false,
}) => {
  const { lang, dir, t } = useLanguage();
  const [driverNameOrCode, setDriverNameOrCode] = useState('');
  const [experiencePeriod, setExperiencePeriod] = useState('');
  const [dailyDeliveriesAvg, setDailyDeliveriesAvg] = useState(0);
  const [vehicleType] = useState('');
  const [commonDeliveryItems, setCommonDeliveryItems] = useState<string[]>([]);
  const [lateArrivalOutOfTen, setLateArrivalOutOfTen] = useState(0);
  const [lateArrivalJustification, setLateArrivalJustification] = useState('');
  const [doorOpener, setDoorOpener] = useState('');
  const [clientRequiresEntry, setClientRequiresEntry] = useState('');
  const [photoProofFrequencyOutOfTen, setPhotoProofFrequencyOutOfTen] = useState(0);
  const [pricingCommentsHeard, setPricingCommentsHeard] = useState<string>('');
  const [appMapComplaints, setAppMapComplaints] = useState('');
  const [customerServiceFeedbackOption, setCustomerServiceFeedbackOption] = useState('');
  const [customerServiceFeedbackCustom, setCustomerServiceFeedbackCustom] = useState('');
  const [customerServiceSupportRating] = useState(3);
  const [biggestRoadblock, setBiggestRoadblock] = useState('');
  const [suggestionsForOps, setSuggestionsForOps] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftToast, setDraftToast] = useState(false);

  const deliveryItemsList = [
    { val: 'هدايا وصناديق مفاجآت', en: 'Gifts & Surprise Boxes' },
    { val: 'بالونات وتوزيعات', en: 'Balloons & Giveaways' },
    { val: 'كيك وحلويات', en: 'Cakes & Sweets' },
    { val: 'ألعاب فقط', en: 'Toys Only' },
    { val: 'باقات مشتركة', en: 'Combined Packages' },
  ];

  const handleToggleItem = (itemVal: string) => {
    if (commonDeliveryItems.includes(itemVal)) {
      setCommonDeliveryItems(commonDeliveryItems.filter((i) => i !== itemVal));
    } else {
      setCommonDeliveryItems([...commonDeliveryItems, itemVal]);
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      driverNameOrCode,
      experiencePeriod,
      dailyDeliveriesAvg,
      commonDeliveryItems,
      lateArrivalOutOfTen,
      lateArrivalJustification,
      doorOpener,
      pricingCommentsHeard,
      appMapComplaints,
    };
    try {
      localStorage.setItem('kidzy_driver_survey_draft', JSON.stringify(draft));
      setDraftToast(true);
      setTimeout(() => setDraftToast(false), 2000);
    } catch {
      // ignore storage errors
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setDriverNameOrCode('');
    setExperiencePeriod('');
    setDailyDeliveriesAvg(0);
    setCommonDeliveryItems([]);
    setLateArrivalOutOfTen(0);
    setLateArrivalJustification('');
    setDoorOpener('');
    setClientRequiresEntry('');
    setPhotoProofFrequencyOutOfTen(0);
    setPricingCommentsHeard('');
    setAppMapComplaints('');
    setCustomerServiceFeedbackOption('');
    setCustomerServiceFeedbackCustom('');
    setBiggestRoadblock('');
    setSuggestionsForOps('');
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const finalCSFeedback =
      customerServiceFeedbackOption === 'أخرى'
        ? customerServiceFeedbackCustom.trim()
          ? `أخرى: ${customerServiceFeedbackCustom.trim()}`
          : 'أخرى'
        : customerServiceFeedbackOption;

    const surveyData: DriverSurveyResponse = {
      id: `driver-resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      submittedAt: new Date().toISOString(),
      driverNameOrCode: driverNameOrCode.trim(),
      experiencePeriod,
      dailyDeliveriesAvg,
      vehicleType,
      commonDeliveryItems,
      lateArrivalOutOfTen,
      lateArrivalReasons: [],
      lateArrivalJustification: lateArrivalJustification.trim(),
      doorOpener,
      clientRequiresEntry,
      photoProofFrequencyOutOfTen,
      pricingCommentsHeard,
      appMapComplaints: appMapComplaints.trim(),
      customerServiceFeedback: finalCSFeedback,
      customerServiceSupportRating,
      biggestRoadblock: biggestRoadblock.trim(),
      suggestionsForOps: suggestionsForOps.trim(),
    };

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(surveyData);
      } else if (onSaveSurvey) {
        await onSaveSurvey(surveyData);
      }
      try {
        localStorage.removeItem('kidzy_driver_survey_draft');
      } catch {
        // ignore storage errors
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        getFriendlyFirestoreSubmitError(
          error,
          lang,
          'تعذر إرسال استبيان السائق لقاعدة البيانات. يرجى المحاولة مرة أخرى.',
          'Unable to submit driver survey. Please try again.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
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
            <div className="w-16 h-16 bg-[#BAEBF1]/50 text-[#007C8D] rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-[#063B44] mb-2">
              {t('تم استلام ردك بنجاح!', 'Response Received Successfully!')}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {t(
                'شكرًا لك يا بطل التوصيل. ملاحظاتك الميدانية تساعدنا في تحسين دقة مسارات الطرق وحل مشكلات الخرائط والتطبيق ودعم السائقين.',
                'Thank you! Your field notes help us improve delivery routing, map accuracy, and driver support.'
              )}
            </p>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-[#007C8D] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {t('تعبئة استبيان جديد', 'Fill out another survey')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-7" dir={dir}>
      {isStandalone && (
        <div className="p-4 bg-[#FEF4E3] border border-[#FEC448]/60 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Link2 className="w-4 h-4 text-[#007C8D] shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#063B44]">
                {t('أنت الآن في الرابط المباشر لـ ', 'You are viewing the direct link for ')}
                <span className="font-bold">
                  {t('استبيان السائقين – kidzy kpi,s', 'Drivers Survey – kidzy kpi,s')}
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

      {/* Banner */}
      <div className="bg-gradient-to-br from-[#063B44] via-[#005866] to-[#007C8D] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <KidzyWordmark variant="cream" className="h-7 w-auto mb-1" />
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#BAEBF1]">
              <span className="font-bold text-[#FEC448] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                {t('توصيل الطلبات بدون شخصيات', 'Driver-Only Deliveries')}
              </span>
              <span aria-hidden="true">·</span>
              <span dir="ltr" className="font-bold text-white">kidzy kpi,s</span>
              <span aria-hidden="true">·</span>
              <span>{t('سري ومباشر لفريق السائقين', 'Confidential driver survey')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {t('استبيان السائقين والتوصيل الميداني – kidzy kpi,s', 'Drivers & Delivery Survey – kidzy kpi,s')}
            </h1>
            <p className="text-[#BAEBF1] text-xs sm:text-sm max-w-xl leading-relaxed">
              {t(
                'مخصص لطلبات التوصيل التي يسلمها السائقون فقط بدون مرافقة شخصيات كرتونية (صناديق المفاجآت، البالونات، الكيك، الهدايا). هدفنا تسهيل عملك وحل صعوبات الطرق والتطبيق.',
                'Dedicated to orders delivered solely by drivers without mascot characters (surprise boxes, balloons, cakes, gifts). Helps us streamline routes and app issues.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <LanguageSwitcher variant="glass" />
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{draftToast ? t('تم الحفظ!', 'Saved!') : t('حفظ مسودة', 'Save Draft')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#BAEBF1] shadow-sm p-6 sm:p-8 space-y-7">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-1.5">
              {t('رمز السائق أو الاسم (اختياري)', 'Driver code or name (optional)')}
            </label>
            <input
              type="text"
              value={driverNameOrCode}
              onChange={(e) => setDriverNameOrCode(e.target.value)}
              placeholder={t('مثال: سائق 08 أو أحمد', 'e.g., Driver 08 or Ahmed')}
              className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-1.5">
              {t('مدة العمل في توصيل الطلبات', 'Time working as a delivery driver')}
            </label>
            <select
              value={experiencePeriod}
              onChange={(e) => setExperiencePeriod(e.target.value)}
              className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-medium"
            >
              <option value="" disabled>
                {t('اختَر مدة العمل...', 'Select duration...')}
              </option>
              {[
                { val: 'أقل من 3 أشهر', en: 'Less than 3 months' },
                { val: '3–6 أشهر', en: '3–6 months' },
                { val: '6–12 شهرًا', en: '6–12 months' },
                { val: 'أكثر من سنة', en: 'Over 1 year' },
              ].map((opt) => (
                <option key={opt.val} value={opt.val}>
                  {lang === 'en' ? opt.en : opt.val}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deliveries count */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-[#063B44]">
              {t('متوسط عدد طلبات التوصيل التي تسلمها يوميًا', 'Average daily deliveries without mascots')}
            </label>
            <span className="text-xs font-mono font-bold bg-[#BAEBF1]/60 text-[#063B44] px-2.5 py-1 rounded-lg tabular-nums">
              {dailyDeliveriesAvg} {t('طلبات يوميًا', 'orders/day')}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            value={dailyDeliveriesAvg}
            onChange={(e) => setDailyDeliveriesAvg(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#007C8D]"
          />
        </div>

        {/* Common Items */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-2">
            {t('ما هي نوع الطلبات التي توصلها غالبًا بدون شخصيات؟', 'Which items do you usually deliver without mascots?')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {deliveryItemsList.map((item) => {
              const isChecked = commonDeliveryItems.includes(item.val);
              return (
                <button
                  type="button"
                  key={item.val}
                  onClick={() => handleToggleItem(item.val)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                    isChecked
                      ? 'bg-[#BAEBF1]/35 text-[#063B44] border-[#01AFC5]'
                      : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/20'
                  }`}
                >
                  <span>{lang === 'en' ? item.en : item.val}</span>
                  {isChecked && <CheckCircle2 className="w-4 h-4 text-[#007C8D] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lateness Question */}
        <div className="bg-[#FEF4E3]/65 border border-[#FEC448]/60 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-sm font-bold text-[#063B44] block">
                {t(
                  'كم من كل 10 طلبات تصل فيها متأخرًا عن الموعد المحدد؟',
                  'Out of 10 deliveries, how many times do you arrive late?'
                )}
              </label>
              <span className="text-xs text-slate-600">
                {t('سجل الرقم الواقعي بحرية لتحسين جدول الرحلات', 'Enter your realistic average to help fix route timing')}
              </span>
            </div>
            <span className="text-xs font-mono font-bold bg-[#FEC448] text-[#063B44] px-3 py-1 rounded-lg tabular-nums">
              {lateArrivalOutOfTen} {t('من كل 10 طلبات', 'out of 10')}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={10}
            value={lateArrivalOutOfTen}
            onChange={(e) => setLateArrivalOutOfTen(Number(e.target.value))}
            className="w-full h-2 bg-white/80 rounded-lg appearance-none cursor-pointer accent-[#007C8D]"
          />

          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-1">
              {t(
                'بماذا تبرر التأخير للعميل عند الوصول؟ وما هو السبب الأكثر تكرارًا؟',
                'How do you justify the delay to the customer, and what is the main cause?'
              )}
            </label>
            <textarea
              rows={2}
              value={lateArrivalJustification}
              onChange={(e) => setLateArrivalJustification(e.target.value)}
              placeholder={t(
                'مثال: زحام الطرق، تأخر استلام الكيك من المتجر، عدم دقة موقع العميل بالخريطة...',
                'e.g., traffic congestion, store delay, inaccurate map pin...'
              )}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
            />
          </div>
        </div>

        {/* Door Opener & Entry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-2">
              {t('من يفتح لك الباب ويستلم الطلب غالبًا؟', 'Who usually opens the door and receives the order?')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'الأم', en: 'The mother' },
                { val: 'الأب', en: 'The father' },
                { val: 'الخادمة', en: 'The maid' },
                { val: 'الحارس', en: 'The guard' },
                { val: 'الطفل نفسه', en: 'The child' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setDoorOpener(opt.val)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                    doorOpener === opt.val
                      ? 'bg-[#007C8D] text-white border-[#007C8D]'
                      : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                  }`}
                >
                  {lang === 'en' ? opt.en : opt.val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-2">
              {t('هل يطلب العميل دخولك للمنزل لوضع أو ترتيب الهدية؟', 'Does the customer ask you to enter the home to set up the gift?')}
            </label>
            <div className="space-y-1.5">
              {[
                { val: 'أحيانًا يطلبون وضع الصندوق بالداخل', en: 'Sometimes ask to place the box inside' },
                { val: 'نعم يطلبون المساعدة في الفك أو التجهيز', en: 'Yes, ask for setup assistance' },
                { val: 'لا، التسليم عند الباب الخارجي دائمًا', en: 'No, always handed at the front door' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setClientRequiresEntry(opt.val)}
                  className={`w-full py-2 px-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                    lang === 'en' ? 'text-left' : 'text-right'
                  } ${
                    clientRequiresEntry === opt.val
                      ? 'bg-[#BAEBF1]/35 text-[#063B44] border-[#01AFC5] font-bold'
                      : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/20'
                  }`}
                >
                  {lang === 'en' ? opt.en : opt.val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Photos */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-bold text-[#063B44] flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#007C8D] shrink-0" />
              <span>
                {t(
                  'كم من كل 10 طلبات يتم فيها تصوير استلام الهدية أو فرحة الطفل؟',
                  'Out of 10 deliveries, how often is handover/child photo requested?'
                )}
              </span>
            </label>
            <span className="text-xs font-mono font-bold text-[#063B44] bg-[#BAEBF1]/50 px-2 py-0.5 rounded tabular-nums shrink-0">
              {photoProofFrequencyOutOfTen} / 10
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={photoProofFrequencyOutOfTen}
            onChange={(e) => setPhotoProofFrequencyOutOfTen(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#007C8D]"
          />
        </div>

        {/* Pricing */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-2 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#007C8D] shrink-0" />
            <span>
              {t(
                'ما هي التعليقات التي تسمعها من العملاء عن الأسعار؟',
                'What comments do you hear from customers about prices?'
              )}
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { val: 'غالية جدا', en: 'Very expensive' },
              { val: 'غالية', en: 'Expensive' },
              { val: 'معقولة', en: 'Reasonable' },
              { val: 'لا توجد تعليقات', en: 'No comments' },
            ].map((opt) => (
              <button
                type="button"
                key={opt.val}
                onClick={() => setPricingCommentsHeard(opt.val)}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  pricingCommentsHeard === opt.val
                    ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                    : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                }`}
              >
                {lang === 'en' ? opt.en : opt.val}
              </button>
            ))}
          </div>
        </div>

        {/* App & Map complaints */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#007C8D] shrink-0" />
            <span>
              {t(
                'سؤال عن شكوى أو انزعاج من العملاء بخصوص التطبيق أو الموقع: عن ماذا يشتكون بالضبط؟',
                'Customer complaints regarding the app or website: what do they complain about specifically?'
              )}
            </span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            {t(
              'مشاكل الخريطة، دقة اللوكيشن، تتبع السائق، واجهة الحجز، أو بطء الدفع:',
              'Map pins, location accuracy, driver tracking, booking UX, or payment errors:'
            )}
          </p>
          <textarea
            rows={2}
            value={appMapComplaints}
            onChange={(e) => setAppMapComplaints(e.target.value)}
            placeholder={t(
              'اكتب ملاحظات العملاء على الخريطة أو التطبيق...',
              'Write customer feedback on maps or app...'
            )}
            className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
          />
        </div>

        {/* CS feedback */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-2 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-[#007C8D] shrink-0" />
            <span>
              {t(
                'ما هي تعليقات العملاء التي تسمعها عن خدمة العملاء؟',
                'What customer feedback do you hear regarding Customer Service?'
              )}
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            {[
              { val: 'تأخر في الرد', en: 'Delayed reply' },
              { val: 'عدم الاستجابة', en: 'No response' },
              { val: 'خدمة ممتازة', en: 'Excellent service' },
              { val: 'أخرى', en: 'Other' },
            ].map((opt) => (
              <button
                type="button"
                key={opt.val}
                onClick={() => setCustomerServiceFeedbackOption(opt.val)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  customerServiceFeedbackOption === opt.val
                    ? 'bg-[#007C8D] text-white border-[#007C8D]'
                    : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                }`}
              >
                {lang === 'en' ? opt.en : opt.val}
              </button>
            ))}
          </div>

          {customerServiceFeedbackOption === 'أخرى' && (
            <input
              type="text"
              value={customerServiceFeedbackCustom}
              onChange={(e) => setCustomerServiceFeedbackCustom(e.target.value)}
              placeholder={t(
                'اذكر تفاصيل تعليق العميل عن خدمة العملاء...',
                'Specify customer comment about support...'
              )}
              className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
            />
          )}
        </div>

        {/* Roadblocks & Suggestions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-1">
              {t('ما أكبر عائق تواجهه في توصيل الطلبات الميدانية؟', 'Biggest roadblock during deliveries?')}
            </label>
            <input
              type="text"
              value={biggestRoadblock}
              onChange={(e) => setBiggestRoadblock(e.target.value)}
              placeholder={t('مثال: البوابات المغلقة، مواقف السيارات...', 'e.g., Gated compounds, parking...')}
              className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-1">
              {t('اقتراحك لإدارة العمليات لتحسين مسارات التوصيل', 'Suggestion to Operations for smoother routes')}
            </label>
            <input
              type="text"
              value={suggestionsForOps}
              onChange={(e) => setSuggestionsForOps(e.target.value)}
              placeholder={t(
                'مثال: تجميع الطلبات لنفس الحي في نافذة واحدة...',
                'e.g., Grouping orders in the same neighborhood...'
              )}
              className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
            />
          </div>
        </div>

        {submitError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit */}
        <div className="pt-4 border-t border-[#BAEBF1]/60 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            {t('يتم حفظ الرد مباشرة في قاعدة بيانات kidzy kpi,s', 'Saved directly to kidzy kpi,s database')}
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-[#007C8D] hover:bg-[#005866] disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? t('جاري الإرسال...', 'Submitting...') : t('إرسال استبيان السائق', 'Submit Driver Survey')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
