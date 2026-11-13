import React, { useState, useEffect } from 'react';
import { PostVisitLog } from '../types/survey';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';
import { getFriendlyFirestoreSubmitError } from '../services/surveyFirestore';
import { KidzyMonogram, KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';
import { Timer, CheckCircle2, Send, AlertCircle, Clock, Link2 } from 'lucide-react';

interface PostVisitLogViewProps {
  onSaveLog: (log: PostVisitLog) => Promise<void> | void;
  recentLogs: PostVisitLog[];
  isStandalone?: boolean;
}

export const PostVisitLogView: React.FC<PostVisitLogViewProps> = ({
  onSaveLog,
  recentLogs,
  isStandalone = false,
}) => {
  const { lang, dir, t } = useLanguage();
  const [characterName, setCharacterName] = useState('');
  const [childAgeGroup, setChildAgeGroup] = useState('');
  const [actualDurationMinutes, setActualDurationMinutes] = useState(10);
  const [requestedExtraTime, setRequestedExtraTime] = useState(false);
  const [extraTimeNotes, setExtraTimeNotes] = useState('');
  const [topMomQuestion, setTopMomQuestion] = useState('');
  const [missedOpportunities, setMissedOpportunities] = useState<string[]>([]);
  const [atmosphereRating, setAtmosphereRating] = useState(0);
  const [staffNameOrCode, setStaffNameOrCode] = useState('');

  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const ageGroups = [
    { val: 'أقل من 3', en: 'Under 3' },
    { val: '3–5', en: '3–5 yrs' },
    { val: '6–9', en: '6–9 yrs' },
    { val: '10 فأكثر', en: '10+ yrs' },
  ];

  const characters = [
    { val: 'دبدوب العسل', en: 'Honey Bear' },
    { val: 'أرنوب السريع', en: 'Speedy Bunny' },
    { val: 'أميرة الفراشات', en: 'Butterfly Princess' },
    { val: 'سبايدرمان كيدزي', en: 'Kidzy Spider Hero' },
    { val: 'ميكي وميني', en: 'Mickey & Minnie' },
    { val: 'شخصية أخرى', en: 'Other Character' },
  ];

  const opportunities = [
    { val: 'سؤال عن سعر', en: 'Price inquiry' },
    { val: 'سؤال عن حفلة', en: 'Birthday / party inquiry' },
    { val: 'اهتمام ظاهر للطفل', en: 'Visible child excitement / interest' },
    { val: 'أخ أو أخت', en: 'Sibling(s) wanting to join' },
    { val: 'مناسبة قادمة', en: 'Upcoming occasion mentioned' },
    { val: 'لا شيء', en: 'None' },
  ];

  const commonQuestions = [
    { val: 'هل تسوون باقات لأعياد الميلاد؟', en: 'Do you offer birthday party packages?' },
    { val: 'كم سعر الزيارة الشهرية أو المتكررة؟', en: 'What is the price of repeat/monthly visits?' },
    { val: 'هل عندكم كيك وحلويات مع الشخصية؟', en: 'Do you provide cake & sweets with the mascot?' },
    { val: 'هل الشخصية تقدر تقعد ربع ساعة زيادة؟', en: 'Can the character stay 15 minutes longer?' },
  ];

  const handleToggleOpportunity = (oppVal: string) => {
    if (oppVal === 'لا شيء') {
      setMissedOpportunities(['لا شيء']);
      return;
    }
    const filtered = missedOpportunities.filter((o) => o !== 'لا شيء');
    if (filtered.includes(oppVal)) {
      setMissedOpportunities(filtered.filter((o) => o !== oppVal));
    } else {
      setMissedOpportunities([...filtered, oppVal]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!characterName) {
      setSubmitError(
        t('يرجى اختيار الشخصية الكرتونية التي ارتديتها في الزيارة.', 'Please select the character worn for the visit.')
      );
      return;
    }
    if (!childAgeGroup) {
      setSubmitError(t('يرجى اختيار الفئة العمرية للطفل.', 'Please select the child age group.'));
      return;
    }
    if (atmosphereRating < 1 || atmosphereRating > 5) {
      setSubmitError(t('يرجى تقييم أجواء الزيارة العامة من 1 إلى 5.', 'Please rate overall visit atmosphere from 1 to 5.'));
      return;
    }

    const newLog: PostVisitLog = {
      id: `pvl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      characterName,
      staffNameOrCode: staffNameOrCode.trim(),
      childAgeGroup,
      actualDurationMinutes,
      requestedExtraTime,
      extraTimeNotes: requestedExtraTime ? extraTimeNotes.trim() : undefined,
      topMomQuestion: topMomQuestion.trim(),
      missedOpportunities,
      atmosphereRating,
    };

    setIsSubmitting(true);
    try {
      await onSaveLog(newLog);
      setTimerRunning(false);
      setSubmittedSuccessfully(true);

      setTimeout(() => {
        setSubmittedSuccessfully(false);
        setSecondsElapsed(0);
        setTimerRunning(true);
        setRequestedExtraTime(false);
        setExtraTimeNotes('');
        setTopMomQuestion('');
        setMissedOpportunities([]);
        setAtmosphereRating(0);
      }, 2800);
    } catch (error) {
      setSubmitError(
        getFriendlyFirestoreSubmitError(
          error,
          lang,
          'تعذر إرسال المذكرة لقاعدة البيانات حاليًا. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
          'Unable to submit the log right now. Check connection and try again.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir={dir}>
      {/* Standalone direct link banner */}
      {isStandalone && (
        <div className="mb-6 p-4 bg-[#FEF4E3] border border-[#FEC448]/60 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Link2 className="w-4 h-4 text-[#007C8D] shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#063B44]">
                {t('أنتِ الآن في الرابط المباشر لـ ', 'You are viewing the direct link for ')}
                <span className="font-bold">
                  {t('مذكرة ما بعد الزيارة السريعة (30 ثانية)', 'Post-Visit Quick Log (30 Seconds)')}
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

      {/* Header Info */}
      <div className="bg-gradient-to-br from-[#005866] via-[#007C8D] to-[#019DB2] text-white rounded-2xl p-6 shadow-md mb-8 relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <KidzyWordmark variant="cream" className="h-7 w-auto mb-1" />
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#BAEBF1]">
              <span className="font-bold text-[#FEC448] flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                {t('هدف: 30 ثانية فقط', 'Goal: 30 seconds only')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t('تُملأ بعد كل زيارة مباشرة', 'Complete right after each visit')}</span>
              <span aria-hidden="true">·</span>
              <span dir="ltr" className="font-bold text-white">kidzy kpi,s</span>
            </div>
            <h1 className="text-2xl font-bold">
              {t('مذكرة ما بعد الزيارة – kidzy kpi,s', 'Post-Visit Log – kidzy kpi,s')}
            </h1>
            <p className="text-[#BAEBF1] text-sm max-w-xl">
              {t(
                'تُملأ فور الانتهاء من الزيارة لالتقاط ما قد ينساه الاستبيان الطويل. لا تذكري أسماء العملاء أو عناوينهم.',
                'Filled immediately after leaving the home to capture fresh visit insights. Do not enter client names or addresses.'
              )}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
            <LanguageSwitcher variant="glass" />

            {/* Live Stopwatch */}
            <div className="bg-white/10 backdrop-blur-md border border-white/25 rounded-xl px-4 py-2.5 text-center min-w-[128px]">
              <span className="text-[11px] text-[#BAEBF1] block">{t('وقت التعبئة الحالي', 'Elapsed time')}</span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-[#FEC448]" />
                <span className="text-xl font-extrabold font-mono tabular-nums text-white">{secondsElapsed}s</span>
              </div>
              <span
                className={`text-[10px] font-semibold mt-0.5 block ${
                  secondsElapsed <= 30 ? 'text-[#BAEBF1]' : 'text-[#FEC448]'
                }`}
              >
                {secondsElapsed <= 30
                  ? t('تحت الهدف (30ث)', 'Within 30s goal')
                  : t('خذي وقتك بدقة', 'Take your time accurately')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {submittedSuccessfully && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-5 mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-base">
              {t(
                `تم إرسال المذكرة بنجاح في ${secondsElapsed} ثانية!`,
                `Log submitted successfully in ${secondsElapsed}s!`
              )}
            </h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              {t(
                'شكرًا لكِ، أُضيفت البيانات فورًا إلى لوحة تحليلات kidzy kpi,s.',
                'Thank you! Data has been added to kidzy kpi,s analytics.'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#BAEBF1] shadow-xs p-6 sm:p-8 space-y-7">
        {/* Row 1: Character & Staff Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-2">
              {t('الشخصية التي ارتديتها في الزيارة', 'Character costume worn during visit')}
            </label>
            <select
              required
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-medium"
            >
              <option value="" disabled>
                {t('اختاري الشخصية الكرتونية...', 'Select character...')}
              </option>
              {characters.map((char) => (
                <option key={char.val} value={char.val}>
                  {lang === 'en' ? char.en : char.val}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-2">
              {t('رمز الموظفة أو الاسم المستعار (اختياري)', 'Staff code or nickname (optional)')}
            </label>
            <input
              type="text"
              value={staffNameOrCode}
              onChange={(e) => setStaffNameOrCode(e.target.value)}
              placeholder={t('مثال: موظفة 04 أو سارة', 'e.g., Staff 04 or Sara')}
              className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-medium"
            />
          </div>
        </div>

        {/* Question 1: Child Age Group */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-2">
            {t('1. الفئة العمرية للطفل', '1. Child Age Group')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ageGroups.map((age) => {
              const isSelected = childAgeGroup === age.val;
              return (
                <button
                  type="button"
                  key={age.val}
                  onClick={() => setChildAgeGroup(age.val)}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-sm'
                      : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/30 hover:border-[#01AFC5]/50'
                  }`}
                >
                  {lang === 'en' ? age.en : age.val}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 2: Actual Duration (Minutes) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-[#063B44]">
              {t('2. المدة الفعلية للزيارة بالدقائق', '2. Actual Visit Duration (minutes)')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <span className="text-xs font-extrabold px-3 py-1 bg-[#BAEBF1]/60 text-[#063B44] rounded-lg tabular-nums">
              {actualDurationMinutes} {t('دقيقة', 'min')}
              {actualDurationMinutes > 10 &&
                ` (+${actualDurationMinutes - 10} ${t('دقيقة زيادة', 'min overtime')})`}
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={45}
            step={1}
            value={actualDurationMinutes}
            onChange={(e) => setActualDurationMinutes(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#007C8D]"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2">
            <span>{t('سريعة (5 د)', 'Quick (5m)')}</span>
            <span className="font-bold text-[#007C8D]">{t('المعيار (10 د)', 'Standard (10m)')}</span>
            <span>{t('ممددة (15 د)', 'Extended (15m)')}</span>
            <span>{t('طويلة (30+ د)', 'Long (30m+)')}</span>
          </div>

          <div className="flex gap-2 mt-2">
            {[10, 12, 15, 20].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setActualDurationMinutes(preset)}
                className={`text-xs px-2.5 py-1 rounded-md border font-semibold cursor-pointer tabular-nums ${
                  actualDurationMinutes === preset
                    ? 'bg-[#FEF4E3] text-[#063B44] border-[#FEC448]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-[#BAEBF1]/20'
                }`}
              >
                {preset} {t('دقيقة', 'min')}
              </button>
            ))}
          </div>
        </div>

        {/* Question 3: Was extra time requested? */}
        <div className="bg-[#FEF4E3]/55 border border-[#FEC448]/60 rounded-xl p-4">
          <label className="block text-sm font-bold text-[#063B44] mb-2">
            {t('3. هل طُلب وقت إضافي من قِبل الأم أو الأسرة؟', '3. Did the mother or family request extra time?')}{' '}
            <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRequestedExtraTime(false)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                !requestedExtraTime
                  ? 'bg-[#063B44] text-white border-[#063B44]'
                  : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
              }`}
            >
              {t('لا، التزمنا بالوقت', 'No, stayed on time')}
            </button>
            <button
              type="button"
              onClick={() => setRequestedExtraTime(true)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                requestedExtraTime
                  ? 'bg-[#FEC448] text-[#063B44] border-[#FEC448] shadow-xs'
                  : 'bg-white text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/25'
              }`}
            >
              {t('نعم، طُلب وقت إضافي', 'Yes, extra time requested')}
            </button>
          </div>

          {requestedExtraTime && (
            <div className="mt-4 pt-3 border-t border-[#FEC448]/50">
              <label className="block text-xs font-bold text-[#063B44] mb-1">
                {t(
                  'إن كانت الإجابة نعم: ماذا حدث؟ (سبب الطلب، وكيف تصرفتِ؟)',
                  'If yes: what happened? (Reason requested and how you responded)'
                )}
              </label>
              <textarea
                rows={2}
                value={extraTimeNotes}
                onChange={(e) => setExtraTimeNotes(e.target.value)}
                placeholder={t(
                  'مثال: الأم طلبت البقاء لتصوير فيديو مع الجدة، والطفل بكى عند الوداع...',
                  'e.g., Mother asked to stay for a video with grandma...'
                )}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
              />
            </div>
          )}
        </div>

        {/* Question 4: Top Mom Question */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">
            {t('4. أبرز سؤال سألته الأم أثناء الزيارة', '4. Top question asked by the mother during the visit')}
          </label>
          <p className="text-xs text-slate-600 mb-2">
            {t(
              'ما السؤال الذي ركزت عليه الأم أو أظهرت اهتمامًا شديدًا به؟',
              'What question did the mother focus on or show strong interest in?'
            )}
          </p>
          <input
            type="text"
            value={topMomQuestion}
            onChange={(e) => setTopMomQuestion(e.target.value)}
            placeholder={t('اكتبي السؤال بنص تقريبي...', 'Write her approximate question...')}
            className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-medium"
          />

          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[11px] text-slate-600 self-center">
              {t('أسئلة شائعة:', 'Quick fill:')}
            </span>
            {commonQuestions.map((q) => (
              <button
                type="button"
                key={q.val}
                onClick={() => setTopMomQuestion(q.val)}
                className="text-[11px] bg-[#FEF4E3]/70 hover:bg-[#BAEBF1]/45 text-[#063B44] px-2.5 py-1 rounded-md border border-[#FEC448]/50 transition-colors cursor-pointer"
              >
                {lang === 'en' ? q.en : q.val}
              </button>
            ))}
          </div>
        </div>

        {/* Question 5: Untapped Opportunities */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-1">
            {t('5. فرصة لم نستفد منها (يمكن اختيار أكثر من إجابة)', '5. Missed opportunity (select all that apply)')}
          </label>
          <p className="text-xs text-slate-600 mb-2.5">
            {t(
              'لحظة شعرتِ فيها أننا كان يمكن أن نبيع خدمة أو نسعد الأسرة بشيء إضافي:',
              'Moments where an extra service or upsell could have delighted the family:'
            )}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {opportunities.map((opp) => {
              const isChecked = missedOpportunities.includes(opp.val);
              return (
                <button
                  type="button"
                  key={opp.val}
                  onClick={() => handleToggleOpportunity(opp.val)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    lang === 'en' ? 'text-left' : 'text-right'
                  } ${
                    isChecked
                      ? 'bg-[#BAEBF1]/35 text-[#063B44] border-[#01AFC5]'
                      : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      isChecked ? 'bg-[#007C8D] border-[#007C8D] text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span>{lang === 'en' ? opp.en : opp.val}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 6: Atmosphere Rating (1 to 5) */}
        <div>
          <label className="block text-sm font-bold text-[#063B44] mb-2">
            {t('6. أجواء الزيارة العامة', '6. Overall Visit Atmosphere')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { val: 1, ar: 'سيئة', en: 'Poor', emoji: '😞' },
              { val: 2, ar: 'متوترة', en: 'Tense', emoji: '😐' },
              { val: 3, ar: 'مقبولة', en: 'Okay', emoji: '🙂' },
              { val: 4, ar: 'ممتازة', en: 'Great', emoji: '😊' },
              { val: 5, ar: 'أسطورية', en: 'Amazing', emoji: '🥳' },
            ].map((rating) => {
              const isSelected = atmosphereRating === rating.val;
              return (
                <button
                  type="button"
                  key={rating.val}
                  onClick={() => setAtmosphereRating(rating.val)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FEF4E3] border-[#FEC448] text-[#063B44] shadow-xs ring-2 ring-[#FEC448]'
                      : 'bg-[#F7FAFB] border-slate-200 text-slate-600 hover:bg-[#BAEBF1]/20'
                  }`}
                >
                  <span className="text-2xl">{rating.emoji}</span>
                  <span className="text-[11px] font-bold">{lang === 'en' ? rating.en : rating.ar}</span>
                </button>
              );
            })}
          </div>
        </div>

        {submitError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 border-t border-[#BAEBF1]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <KidzyMonogram variant="teal" size={20} />
            <span>
              {t(
                'يتم إرسال السجل مباشرة وحفظه في قاعدة بيانات kidzy kpi,s.',
                'Submitted directly to the kidzy kpi,s database.'
              )}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#007C8D] hover:bg-[#005866] disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? t('جاري الحفظ...', 'Saving...') : t('إرسال المذكرة الآن (30 ثانية)', 'Submit Log Now (30s)')}</span>
          </button>
        </div>
      </form>

      {/* Recent Submissions Feed (Admin only) */}
      {recentLogs.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#063B44] flex items-center gap-2">
              <span>{t('سجلاتك الأخيرة اليوم', 'Recent Logs Today')}</span>
              <span className="text-xs bg-[#BAEBF1]/60 text-[#063B44] px-2 py-0.5 rounded-full font-mono tabular-nums">
                {recentLogs.length}
              </span>
            </h3>
          </div>

          <div className="space-y-3">
            {recentLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="bg-white border border-[#BAEBF1] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#BAEBF1]/60 text-[#063B44] font-bold flex items-center justify-center shrink-0">
                    {log.characterName?.charAt(0) || 'K'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <span>{log.characterName || t('زيارة ميدانية', 'Field Visit')}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="text-slate-500 font-normal">
                        {t('عمر', 'Age')} {log.childAgeGroup}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 truncate max-w-md">
                      {log.topMomQuestion || t('لم يتم تسجيل سؤال محدد', 'No specific question noted')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-semibold px-2 py-1 bg-slate-100 rounded text-slate-700 tabular-nums">
                    {log.actualDurationMinutes} {t('دقيقة', 'min')}
                  </span>
                  <span className="font-bold text-amber-600 tabular-nums">{log.atmosphereRating}/5 ★</span>
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString(lang === 'en' ? 'en-US' : 'ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
