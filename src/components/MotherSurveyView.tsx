import React, { useState } from 'react';
import { MotherSurveyResponse } from '../types/survey';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';
import { getFriendlyFirestoreSubmitError } from '../services/surveyFirestore';
import { KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';
import { Heart, Star, MessageCircle, Send, AlertCircle, Link2 } from 'lucide-react';

interface MotherSurveyViewProps {
  onSaveResponse: (response: MotherSurveyResponse) => Promise<void> | void;
  recentSurveys?: MotherSurveyResponse[];
  isStandalone?: boolean;
}

export const MotherSurveyView: React.FC<MotherSurveyViewProps> = ({
  onSaveResponse,
  isStandalone = false,
}) => {
  const { lang, dir, t } = useLanguage();
  const [experienceRating, setExperienceRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [wasTenMinutesEnough, setWasTenMinutesEnough] = useState('');
  const [interestedInPaidExtension, setInterestedInPaidExtension] = useState('');
  const [pricingFeedback, setPricingFeedback] = useState('');
  const [customerServiceSatisfaction, setCustomerServiceSatisfaction] = useState('');
  const [appExperienceFeedback, setAppExperienceFeedback] = useState('');
  const [missingWishes, setMissingWishes] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (experienceRating < 1 || experienceRating > 5) {
      setSubmitError(
        t(
          'يرجى اختيار تقييم تجربة الزيارة بالنجوم (من 1 إلى 5) قبل الإرسال.',
          'Please rate the visit experience using stars (1 to 5) before submitting.'
        )
      );
      return;
    }

    const newSurvey: MotherSurveyResponse = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      experienceRating,
      wasTenMinutesEnough,
      interestedInPaidExtension,
      pricingFeedback,
      customerServiceSatisfaction,
      appExperienceFeedback: appExperienceFeedback.trim(),
      missingWishes: missingWishes.trim(),
      whatsappOptIn,
      whatsappPhone: whatsappOptIn ? whatsappPhone.trim() : undefined,
    };

    setIsSubmitting(true);
    try {
      await onSaveResponse(newSurvey);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        getFriendlyFirestoreSubmitError(
          error,
          lang,
          'تعذر إرسال رأيك لقاعدة البيانات حاليًا. يرجى المحاولة مرة أخرى.',
          'Unable to submit your response right now. Please try again.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setExperienceRating(0);
    setWasTenMinutesEnough('');
    setInterestedInPaidExtension('');
    setPricingFeedback('');
    setCustomerServiceSatisfaction('');
    setMissingWishes('');
    setAppExperienceFeedback('');
    setWhatsappOptIn(false);
    setWhatsappPhone('');
    setSubmitError(null);
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
            <div className="w-16 h-16 bg-[#FEF4E3] text-[#007C8D] rounded-full flex items-center justify-center mx-auto mb-5 border border-[#FEC448]/60">
              <Heart className="w-8 h-8 fill-[#FEC448] text-[#FEC448]" />
            </div>
            <h2 className="text-2xl font-black text-[#063B44] mb-2">
              {t('شكرًا لكِ يا أمّنا الغالية!', 'Thank You, Dear Mother!')}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {t(
                'سعدنا جدًا بزيارة بيتكم ورسم الابتسامة على وجه طفلكم. رأيكِ الثمين يساعد فريق kidzy kpi,s على تطوير لحظات الفرح لتكون أجمل في المرات القادمة.',
                'We loved visiting your home and bringing a smile to your child. Your feedback helps kidzy kpi,s craft even happier experiences next time.'
              )}
            </p>

            <div className="bg-[#FEF4E3] rounded-2xl p-4 text-xs text-[#063B44] mb-8 border border-[#FEC448]/60 w-full">
              {whatsappOptIn && whatsappPhone
                ? t(
                    `تم تفعيل اشتراكك في أفكار هدايا كيدزي عبر الرقم: ${whatsappPhone}`,
                    `Subscribed to gift ideas via WhatsApp: ${whatsappPhone}`
                  )
                : t(
                    'نسعد دائمًا باستقبالكم في زيارات كيدزي القادمة!',
                    'We look forward to seeing you again in upcoming visits!'
                  )}
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-[#007C8D] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {t('تعبئة استبيان لزيارة أخرى', 'Submit another response')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir={dir}>
      {/* Standalone direct link banner */}
      {isStandalone && (
        <div className="mb-6 p-4 bg-[#FEF4E3] border border-[#FEC448]/60 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Link2 className="w-4 h-4 text-[#007C8D] shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#063B44]">
                {t('أنتِ الآن في الرابط المباشر لـ ', 'You are viewing the direct link for ')}
                <span className="font-bold">
                  {t('استبيان الأمهات – kidzy kpi,s', 'Mothers Survey – kidzy kpi,s')}
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

      {/* Intro Banner */}
      <div className="bg-gradient-to-br from-[#005866] via-[#007C8D] to-[#01AFC5] text-white rounded-3xl p-6 sm:p-8 shadow-lg mb-8 relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="mb-3">
              <KidzyWordmark
                variant="cream"
                className="h-8 w-auto"
                showTagline
                taglineBilingual="MAKE THEIR DAY. THE KIDZY WAY."
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-[#BAEBF1]">
              <span dir="ltr" className="font-bold text-white">kidzy kpi,s</span>
              <span aria-hidden="true">·</span>
              <span>{t('استبيان الأمهات', 'Mothers Survey')}</span>
              <span aria-hidden="true">·</span>
              <span>{t('مدة الإجابة: دقيقة واحدة', '1 minute to complete')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
              {t('رأيكِ في زيارة كيدزي', 'Your Feedback on the Visit')}
            </h1>
            <p className="text-[#BAEBF1] text-xs sm:text-sm max-w-lg leading-relaxed">
              {t(
                'شكرًا لاستقبالنا في بيتكم العامر. هذا الاستبيان القصير لا يطلب أي بيانات شخصية عن طفلكم، وهو وسيلتنا لنسمع منكِ كيف نجعل التجربة أفضل.',
                'Thank you for welcoming us into your home. This short survey collects no personal child details and helps us make every visit better.'
              )}
            </p>
          </div>

          <LanguageSwitcher variant="glass" />
        </div>
      </div>

      {/* Main Survey Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#BAEBF1] shadow-sm p-6 sm:p-8 space-y-7">
        {/* Q1: Experience Rating */}
        <div className="text-center pb-6 border-b border-[#BAEBF1]/50">
          <label className="block text-base font-bold text-[#063B44] mb-1">
            {t('1. كيف كانت تجربة الزيارة بشكل عام؟', '1. How was your overall visit experience?')}{' '}
            <span className="text-rose-600">*</span>
          </label>
          <p className="text-xs text-slate-600 mb-4">
            {t(
              'تقييمك لفرحة الطفل وتفاعل الشخصية وجودة الهدية',
              'Rate your child’s joy, character interaction, and gift quality'
            )}
          </p>

          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || experienceRating) >= star;
              return (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setExperienceRating(star)}
                  className="p-1.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  aria-label={t(`تقييم ${star} من 5 نجوم`, `Rate ${star} of 5 stars`)}
                >
                  <Star
                    className={`w-9 h-9 sm:w-11 sm:h-11 transition-colors ${
                      active ? 'fill-[#FEC448] text-[#FEC448]' : 'text-slate-300 stroke-[1.5]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <span className="text-xs font-bold text-[#007C8D] mt-2 block">
            {experienceRating === 5 && t('تجربة ساحرة وفرحة لا تُنسى!', 'Magical & unforgettable joy!')}
            {experienceRating === 4 && t('ممتازة وجميلة', 'Great & lovely')}
            {experienceRating === 3 && t('جيدة مقبولة', 'Good / acceptable')}
            {experienceRating === 2 && t('تحتاج تحسينات', 'Needs improvement')}
            {experienceRating === 1 && t('غير مرضية', 'Unsatisfactory')}
          </span>
        </div>

        {/* Q2: Was 10 minutes enough? */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-2">
            {t('2. هل كانت العشر دقائق كافية لطفلكِ؟', '2. Were the 10 minutes enough for your child?')}{' '}
            <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                val: 'نعم، كافية',
                en: 'Yes, sufficient',
                hint: 'وقت مناسب دون ملل',
                hintEn: 'Just right without getting bored',
              },
              {
                val: 'أحتاج وقتًا أكثر',
                en: 'Needed more time',
                hint: 'مرت سريعة والطفل يبي يلعب',
                hintEn: 'Went by fast; child wanted to play longer',
              },
              {
                val: 'كانت أطول من اللازم',
                en: 'Too long',
                hint: 'الطفل تعب أو انشغل',
                hintEn: 'Child got tired or distracted',
              },
            ].map((opt) => {
              const isSelected = wasTenMinutesEnough === opt.val;
              return (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setWasTenMinutesEnough(opt.val)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    lang === 'en' ? 'text-left' : 'text-right'
                  } ${
                    isSelected
                      ? 'bg-[#BAEBF1]/35 text-[#063B44] border-[#01AFC5] ring-2 ring-[#01AFC5]/25'
                      : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/20'
                  }`}
                >
                  <div className="font-bold text-xs sm:text-sm">{lang === 'en' ? opt.en : opt.val}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{lang === 'en' ? opt.hintEn : opt.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Q3: Paid extension interest */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-2">
            {t(
              '3. لو عُرض عليكِ تمديد الزيارة أو حجز وقت أطول بمقابل، هل تهتمين؟',
              '3. If offered a paid extension or longer booking option, would you be interested?'
            )}{' '}
            <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { val: 'نعم', en: 'Yes', emoji: '😍' },
              { val: 'ربما', en: 'Maybe', emoji: '🤔' },
              { val: 'لا', en: 'No', emoji: '✋' },
            ].map((opt) => {
              const isSelected = interestedInPaidExtension === opt.val;
              return (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setInterestedInPaidExtension(opt.val)}
                  className={`py-3 px-4 rounded-2xl border text-center font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-sm'
                      : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{lang === 'en' ? opt.en : opt.val}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Q4: Missing Wishes */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-1">
            {t(
              '4. ما الذي كنتِ تتمنين أن تجديه في الزيارة ولم تجديه؟',
              '4. What did you wish was included in the visit that wasn’t?'
            )}
          </label>
          <p className="text-xs text-slate-600 mb-2">
            {t(
              'أفكار تحبين توفرها (كيك، بالونات مخصصة، تصوير احترافي، ألعاب تناسب اهتمام طفلك...)',
              'Ideas you’d love (cake, custom balloons, professional photos, extra toys for your child’s interests...)'
            )}
          </p>
          <textarea
            rows={3}
            value={missingWishes}
            onChange={(e) => setMissingWishes(e.target.value)}
            placeholder={t(
              'اكتبي أي فكرة أو ملاحظة تخطر ببالك بكل صراحة...',
              'Share any honest idea or suggestion...'
            )}
            className="w-full bg-[#F7FAFB] border border-slate-300 rounded-2xl p-3.5 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
          />
        </div>

        {/* Pricing, CS, and App feedback */}
        <div className="bg-[#FEF4E3]/70 border border-[#FEC448]/60 rounded-2xl p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-1.5">
              {t('ما رأيك في أسعار الخدمة والباقات؟', 'What do you think of our pricing and packages?')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: 'غالية جدا', en: 'Very expensive' },
                { val: 'غالية', en: 'Expensive' },
                { val: 'معقولة', en: 'Reasonable' },
                { val: 'لا توجد تعليقات', en: 'No comments' },
              ].map((pOpt) => (
                <button
                  type="button"
                  key={pOpt.val}
                  onClick={() => setPricingFeedback(pOpt.val)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    pricingFeedback === pOpt.val
                      ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                      : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/30'
                  }`}
                >
                  {lang === 'en' ? pOpt.en : pOpt.val}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#FEC448]/40">
            <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-1.5">
              {t(
                'كيف كانت تجربتك في التواصل مع خدمة عملاء كيدزي؟',
                'How was your communication experience with customer support?'
              )}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: 'خدمة ممتازة وسريعة', en: 'Excellent & fast' },
                { val: 'تأخر في الرد', en: 'Delayed response' },
                { val: 'عدم استجابة فورية', en: 'No immediate reply' },
              ].map((csOpt) => (
                <button
                  type="button"
                  key={csOpt.val}
                  onClick={() => setCustomerServiceSatisfaction(csOpt.val)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    customerServiceSatisfaction === csOpt.val
                      ? 'bg-[#007C8D] text-white border-[#007C8D]'
                      : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/30'
                  }`}
                >
                  {lang === 'en' ? csOpt.en : csOpt.val}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#FEC448]/40">
            <label className="block text-xs sm:text-sm font-bold text-[#063B44] mb-1">
              {t(
                'هل واجهتِ أي صعوبة أو انزعاج في الموقع أو التطبيق عند الحجز أو الدفع؟',
                'Did you face any difficulty on the app or website during booking or payment?'
              )}
            </label>
            <input
              type="text"
              value={appExperienceFeedback}
              onChange={(e) => setAppExperienceFeedback(e.target.value)}
              placeholder={t(
                'مثال: صعوبة اختيار الوقت المناسب، أو أي ملاحظة أخرى...',
                'e.g., difficulty choosing the time slot, or other feedback...'
              )}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
            />
          </div>
        </div>

        {/* Q5: WhatsApp Opt-in */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-bold text-emerald-950 block">
                {t(
                  '5. هل ترغبين في استلام أفكار هدايا وعروض مميزة على واتساب؟',
                  '5. Would you like to receive gift ideas and special offers via WhatsApp?'
                )}
              </label>
              <p className="text-xs text-emerald-800 mt-1">
                {t(
                  'اختيار «نعم» هو موافقتكِ على الاشتراك، ويمكنكِ الإيقاف في أي وقت بكلمة «إيقاف».',
                  'Choosing Yes opts you in; you can opt out at any time.'
                )}
              </p>

              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setWhatsappOptIn(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    whatsappOptIn
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {t('نعم، أرغب في الاشتراك', 'Yes, subscribe me')}
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappOptIn(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    !whatsappOptIn
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t('لا، شكرًا', 'No, thank you')}
                </button>
              </div>

              {whatsappOptIn && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    {t(
                      'رقم واتساب الخاص بكِ (لن نستخدمه إلا لهذا الغرض)',
                      'Your WhatsApp number (used solely for this purpose)'
                    )}
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-left font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {submitError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#007C8D] hover:bg-[#005866] disabled:opacity-60 text-white text-sm sm:text-base font-extrabold rounded-2xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? t('جاري الإرسال...', 'Submitting...')
                : t('إرسال رأيي الآن', 'Submit Feedback')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
