import React, { useState } from 'react';
import { CustomerServiceSurveyResponse } from '../types/survey';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';
import { getFriendlyFirestoreSubmitError } from '../services/surveyFirestore';
import { KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';
import {
  Headphones,
  Send,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Smartphone,
  Clock,
  Check,
  Link2,
} from 'lucide-react';

interface CustomerServiceSurveyViewProps {
  onSubmit: (response: CustomerServiceSurveyResponse) => Promise<void> | void;
  isStandalone?: boolean;
}

export const CustomerServiceSurveyView: React.FC<CustomerServiceSurveyViewProps> = ({
  onSubmit,
  isStandalone = false,
}) => {
  const { lang, dir, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agentNameOrCode, setAgentNameOrCode] = useState('');
  const [shiftType, setShiftType] = useState('');
  const [dailyTicketsCount, setDailyTicketsCount] = useState<number>(0);
  const [topInquiryTypes, setTopInquiryTypes] = useState<string[]>([]);

  const [pricingCommentsReceived, setPricingCommentsReceived] = useState<string>('');
  const [commonClientComplaintsAboutCS, setCommonClientComplaintsAboutCS] = useState<string[]>([]);
  const [otherCSComplaint, setOtherCSComplaint] = useState('');
  const [complaintsAboutCSDetails, setComplaintsAboutCSDetails] = useState('');
  const [appWebsiteComplaintsDetails, setAppWebsiteComplaintsDetails] = useState('');

  const [cancellationReasons, setCancellationReasons] = useState<string[]>([]);
  const [unservedDemands, setUnservedDemands] = useState<string[]>([]);
  const [toolsNeededToImprove, setToolsNeededToImprove] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const inquiryOptions = [
    { val: 'حجز زيارات الشخصيات', en: 'Booking character visits' },
    { val: 'الاستفسار عن الأسعار والعروض', en: 'Pricing & offers inquiries' },
    { val: 'تتبع موعد وصول السائق / الشخصية', en: 'Tracking driver / mascot arrival' },
    { val: 'طلب توصيل هدايا بدون شخصية', en: 'Gift-only delivery bookings' },
    { val: 'تعديل الموعد أو العنوان', en: 'Modifying date, time, or address' },
    { val: 'شكاوى تأخير أو عدم رضا', en: 'Delay or service complaints' },
  ];

  const csComplaintsOptions = [
    { val: 'تأخر في الرد', en: 'Slow response time' },
    { val: 'عدم الاستجابة السريعة في أوقات الذروة', en: 'Lack of response during peak hours' },
    { val: 'نقص المعلومات عن حالة السائق المباشرة', en: 'No live driver ETA details' },
    { val: 'صعوبة حل المشكلة فورياً', en: 'Difficulty resolving issues immediately' },
  ];

  const cancellationOptions = [
    { val: 'تأخر المندوب أو الشخصية عن الموعد', en: 'Driver or character ran late' },
    { val: 'ارتفاع السعر بعد المقارنة', en: 'Price felt too high' },
    { val: 'عدم توفر الشخصية المفضلة للطفل', en: 'Preferred character unavailable' },
    { val: 'تغير خطط العائلة أو نوم الطفل', en: 'Family plans changed / child asleep' },
    { val: 'مشكلة في الدفع الإلكتروني', en: 'Online payment failure' },
  ];

  const demandOptions = [
    { val: 'توفير كيك مخصص وحلويات مع الطلب', en: 'Custom cakes & sweets with delivery' },
    { val: 'باقات بالونات هيليوم وضيافة كاملة', en: 'Helium balloons & full party hosting' },
    { val: 'مدة زيارة أطول (نصف ساعة أو ساعة كاملة)', en: 'Longer visits (30 or 60 mins)' },
    { val: 'شخصيات كرتونية وأبطال إضافيين غير متوفرين', en: 'Additional cartoon heroes unavailable' },
    { val: 'ألعاب ومسابقات تفاعلية ومهرجين', en: 'Interactive games & party hosts' },
  ];

  const toggleArrayItem = (
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setAgentNameOrCode('');
    setShiftType('');
    setDailyTicketsCount(0);
    setTopInquiryTypes([]);
    setPricingCommentsReceived('');
    setCommonClientComplaintsAboutCS([]);
    setOtherCSComplaint('');
    setComplaintsAboutCSDetails('');
    setAppWebsiteComplaintsDetails('');
    setCancellationReasons([]);
    setUnservedDemands([]);
    setToolsNeededToImprove('');
    setGeneralNotes('');
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const finalCSComplaints = [...commonClientComplaintsAboutCS];
    if (otherCSComplaint.trim()) {
      finalCSComplaints.push(`أخرى: ${otherCSComplaint.trim()}`);
    }

    const payload: CustomerServiceSurveyResponse = {
      id: `cs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      submittedAt: new Date().toISOString(),
      agentNameOrCode: agentNameOrCode.trim(),
      shiftType,
      dailyTicketsCount: Number(dailyTicketsCount) || 0,
      topInquiryTypes,
      pricingCommentsReceived,
      commonClientComplaintsAboutCS: finalCSComplaints,
      complaintsAboutCSDetails: complaintsAboutCSDetails.trim(),
      appWebsiteComplaintsDetails: appWebsiteComplaintsDetails.trim(),
      cancellationReasons,
      unservedDemands,
      toolsNeededToImprove: toolsNeededToImprove.trim(),
      generalNotes: generalNotes.trim(),
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
          'تعذر إرسال الاستبيان لقاعدة البيانات حاليًا. يرجى المحاولة مرة أخرى.',
          'Unable to submit survey right now. Please try again.'
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
            {t('شكرًا لكِ / لك على تعبئة الاستبيان!', 'Thank You for Submitting!')}
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {t(
              'تم حفظ ردك بنجاح في قاعدة بيانات kidzy kpi,s. مساهمتك القيمة تساعدنا في تذليل العقبات التقنية وتحسين تجربة العملاء.',
              'Your feedback has been saved in kidzy kpi,s. It helps us remove technical blockers and empower customer support.'
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-[#007C8D] hover:bg-[#005866] text-white font-bold rounded-xl transition shadow-md cursor-pointer"
            >
              {t('إرسال رد إضافي', 'Submit Another Response')}
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
                  {t('قسم خدمة العملاء – kidzy kpi,s', 'Customer Support Team – kidzy kpi,s')}
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

      {/* Header card */}
      <div className="bg-gradient-to-br from-[#005866] via-[#007C8D] to-[#019DB2] rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <KidzyWordmark variant="cream" className="h-7 w-auto mb-3" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/25 shrink-0">
                <Headphones className="w-8 h-8 text-[#FEC448]" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#BAEBF1] mb-1">
                  <span dir="ltr" className="font-bold text-white">kidzy kpi,s</span>
                  <span aria-hidden="true">·</span>
                  <span>{t('استبيان فريق الدعم والعملاء', 'Support Team Survey')}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  {t('استبيان قسم خدمة العملاء', 'Customer Service Survey')}
                </h1>
              </div>
            </div>
            <p className="text-[#BAEBF1] text-sm sm:text-base leading-relaxed">
              {t(
                'أنتم خط الدفاع الأول ونبض تجربة العائلة. يهدف هذا الاستبيان لمعرفة الشكاوى الفعلية بخصوص التطبيق والموقع، ملاحظات الأسعار، وضغط التذاكر، لنطور الأدوات التي تسهل عملكم اليومي.',
                'You are the front line of family care. This survey captures real app/website complaints, pricing feedback, and ticket pressure so we can equip your team better.'
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
            <span>{t('1. معلومات الوردية وحجم التواصل', '1. Shift & Daily Volume')}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-[#063B44] mb-2">
                {t('اسم ممثل الخدمة أو الكود التعريفي (اختياري)', 'Support agent name or code (optional)')}
              </label>
              <input
                type="text"
                placeholder={t('مثال: سارة - خدمة عملاء', 'e.g., Sara - CS')}
                value={agentNameOrCode}
                onChange={(e) => setAgentNameOrCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] focus:border-[#01AFC5] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#063B44] mb-2">
                {t('وردية العمل المعتادة', 'Usual work shift')}
              </label>
              <select
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] focus:border-[#01AFC5] outline-none transition bg-white"
              >
                <option value="" disabled>
                  {t('اختاري فترة الوردية...', 'Select shift...')}
                </option>
                <option value="صباحية (9 ص – 5 م)">
                  {t('صباحية (9 ص – 5 م)', 'Morning (9 AM – 5 PM)')}
                </option>
                <option value="مسائية (4 م – 12 منتصف الليل)">
                  {t('مسائية (4 م – 12 منتصف الليل)', 'Evening (4 PM – 12 AM)')}
                </option>
                <option value="وردية عطلة نهاية الأسبوع (الخميس والجمعة والسبت)">
                  {t('وردية عطلة نهاية الأسبوع', 'Weekend Shift (Thu–Sat)')}
                </option>
                <option value="مرنة / عن بُعد">
                  {t('مرنة / عن بُعد', 'Flexible / Remote')}
                </option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-[#063B44]">
                {t(
                  'متوسط عدد المحادثات والتذاكر التي تتعاملين معها يوميًا',
                  'Average number of chats & tickets handled daily'
                )}
              </label>
              <span className="text-base font-bold text-[#063B44] bg-[#BAEBF1]/50 px-3 py-1 rounded-lg tabular-nums">
                {dailyTicketsCount} {t('محادثة', 'tickets')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={dailyTicketsCount}
              onChange={(e) => setDailyTicketsCount(Number(e.target.value))}
              className="w-full accent-[#007C8D] h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#063B44] mb-3">
              {t('أنواع الطلبات والاستفسارات الأكثر تكرارًا (اختاري كل ما ينطبق):', 'Most frequent inquiry types:')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inquiryOptions.map((opt) => {
                const checked = topInquiryTypes.includes(opt.val);
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => toggleArrayItem(opt.val, topInquiryTypes, setTopInquiryTypes)}
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
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#BAEBF1]/80 space-y-8">
          <h2 className="text-xl font-bold text-[#063B44] mb-6 flex items-center gap-2 pb-3 border-b border-[#BAEBF1]/50">
            <DollarSign className="w-5 h-5 text-[#007C8D] shrink-0" />
            <span>
              {t('2. الأسعار، التطبيق، وملاحظات خدمة العملاء', '2. Pricing, App & Support Insights')}
            </span>
          </h2>

          {/* Pricing sentiment */}
          <div>
            <label className="block text-sm font-bold text-[#063B44] mb-2">
              {t(
                'ما هي التعليقات التي تسمعينها عن الأسعار من العملاء في المحادثات؟',
                'What pricing feedback do you hear from customers?'
              )}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { val: 'غالية جدا', en: 'Very expensive' },
                { val: 'غالية', en: 'Expensive' },
                { val: 'معقولة', en: 'Reasonable' },
                { val: 'لا توجد تعليقات', en: 'No comments' },
              ].map((sentiment) => {
                const isSelected = pricingCommentsReceived === sentiment.val;
                return (
                  <button
                    key={sentiment.val}
                    type="button"
                    onClick={() => setPricingCommentsReceived(sentiment.val)}
                    className={`p-3.5 rounded-xl border text-center font-semibold text-sm transition cursor-pointer ${
                      isSelected
                        ? 'border-[#007C8D] bg-[#007C8D] text-white shadow-md'
                        : 'border-slate-200 bg-[#F7FAFB] hover:bg-[#BAEBF1]/25 text-[#063B44]'
                    }`}
                  >
                    {lang === 'en' ? sentiment.en : sentiment.val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CS complaints */}
          <div className="pt-4 border-t border-[#BAEBF1]/50">
            <label className="block text-sm font-bold text-[#063B44] mb-2">
              {t('ما هي تعليقات العملاء عن خدمة العملاء؟', 'What do customers say about Customer Service?')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {csComplaintsOptions.map((opt) => {
                const checked = commonClientComplaintsAboutCS.includes(opt.val);
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() =>
                      toggleArrayItem(opt.val, commonClientComplaintsAboutCS, setCommonClientComplaintsAboutCS)
                    }
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

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('شكاوى أخرى عن خدمة العملاء (اذكريها):', 'Other CS complaints (specify):')}
              </label>
              <input
                type="text"
                placeholder={t('اذكري أي ملاحظات أخرى بخصوص الخدمة...', 'List any other support comments...')}
                value={otherCSComplaint}
                onChange={(e) => setOtherCSComplaint(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] outline-none text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t(
                  'تفاصيل إضافية: كيف تتعاملين مع شكاوى خدمة العملاء حاليًا وما الصعوبة؟',
                  'Additional context: How do you currently handle support complaints?'
                )}
              </label>
              <textarea
                rows={2}
                placeholder={t(
                  'مثال: يطلبون ردًا فوريًا أثناء التوصيل بينما السائق يقود السيارة...',
                  'e.g., Clients demand live driver updates while drivers are in transit...'
                )}
                value={complaintsAboutCSDetails}
                onChange={(e) => setComplaintsAboutCSDetails(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] outline-none text-sm transition"
              />
            </div>
          </div>

          {/* App/Website complaints */}
          <div className="pt-4 border-t border-[#BAEBF1]/50">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-[#007C8D] shrink-0" />
              <label className="text-sm font-bold text-[#063B44]">
                {t(
                  'سؤال عن شكوى أو انزعاج من العملاء بخصوص التطبيق أو الموقع: عن ماذا يشتكون بالضبط؟',
                  'Customer complaints regarding the app or website: what specifically do they report?'
                )}
              </label>
            </div>
            <textarea
              required
              rows={4}
              placeholder={t(
                'مثال: عدم دقة اللوكيشن على الخريطة، بطء تحميل الصور، ارتباك بشأن الهدايا المشمولة، مشاكل الدفع...',
                'e.g., inaccurate location pin, slow character gallery, payment errors...'
              )}
              value={appWebsiteComplaintsDetails}
              onChange={(e) => setAppWebsiteComplaintsDetails(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] focus:border-[#01AFC5] outline-none text-sm transition leading-relaxed"
            />
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#BAEBF1]/80 space-y-6">
          <h2 className="text-xl font-bold text-[#063B44] mb-4 flex items-center gap-2 pb-3 border-b border-[#BAEBF1]/50">
            <AlertCircle className="w-5 h-5 text-[#007C8D] shrink-0" />
            <span>
              {t('3. أسباب الإلغاء والطلبات الإضافية غير المتوفرة', '3. Cancellations & Unserved Requests')}
            </span>
          </h2>

          <div>
            <label className="block text-sm font-semibold text-[#063B44] mb-3">
              {t('أسباب إلغاء الحجوزات الأكثر شيوعًا من واقع المحادثات:', 'Most frequent cancellation reasons:')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cancellationOptions.map((opt) => {
                const checked = cancellationReasons.includes(opt.val);
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => toggleArrayItem(opt.val, cancellationReasons, setCancellationReasons)}
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
            <label className="block text-sm font-semibold text-[#063B44] mb-3">
              {t(
                'طلبات وخدمات يسأل عنها العملاء بكثرة ولكنها غير متوفرة حاليًا (فرص توسع):',
                'Frequently requested services not currently available (growth opportunities):'
              )}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demandOptions.map((opt) => {
                const checked = unservedDemands.includes(opt.val);
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => toggleArrayItem(opt.val, unservedDemands, setUnservedDemands)}
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
                'ما الأدوات أو الصلاحيات التي تنقص فريق خدمة العملاء لتحسين سرعة الخدمة؟',
                'What tools or permissions would speed up your support workflow?'
              )}
            </label>
            <textarea
              rows={2}
              placeholder={t(
                'مثال: شاشة تتبع فوري لموقع سيارة السائق، لوحة جاهزة للردود السريعة...',
                'e.g., Live driver map panel, instant compensation voucher tool...'
              )}
              value={toolsNeededToImprove}
              onChange={(e) => setToolsNeededToImprove(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] outline-none text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#063B44] mb-2">
              {t('ملاحظة أو رسالة ختامية للإدارة', 'Final note or message for management')}
            </label>
            <textarea
              rows={2}
              placeholder={t('اكتبي أي مقترح أو فكرة تساعدنا في تطوير التجربة...', 'Write any suggestion...')}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#01AFC5] outline-none text-sm transition"
            />
          </div>
        </div>

        {submitError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-4 bg-[#007C8D] hover:bg-[#005866] disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3 text-base sm:text-lg whitespace-nowrap cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span>
              {isSubmitting ? t('جاري الإرسال...', 'Submitting...') : t('إرسال استبيان خدمة العملاء', 'Submit CS Survey')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
