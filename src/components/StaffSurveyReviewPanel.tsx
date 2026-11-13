import React, { useState } from 'react';
import { StaffSurveyResponse } from '../types/survey';
import { useLanguage } from '../context/LanguageContext';
import {
  buildStaffSurveyReviewDigest,
  MOM_INQUIRY_TOPICS,
  StaffBreakdownItem,
} from '../utils/sheetsSerializer';
import { STAFF_TOTAL_QUESTIONS_COUNT } from '../utils/surveyLogic';
import {
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  ListTodo,
  MessageSquareQuote,
  AlertTriangle,
  Users,
  CheckCircle2,
  Eye,
  LogIn,
  UserCheck,
} from 'lucide-react';

interface StaffSurveyReviewPanelProps {
  staffSurveys: StaffSurveyResponse[];
  isAdminAuthenticated?: boolean;
  onOpenAdminLogin?: () => void;
  onOpenIndividualStaffResponses: () => void;
  onOpenGoogleSheetsSync: () => void;
  onCreateFollowUpTask?: (title: string, notes: string) => void;
}

export const StaffSurveyReviewPanel: React.FC<StaffSurveyReviewPanelProps> = ({
  staffSurveys,
  isAdminAuthenticated = false,
  onOpenAdminLogin,
  onOpenIndividualStaffResponses,
  onOpenGoogleSheetsSync,
  onCreateFollowUpTask,
}) => {
  const { lang, dir, t } = useLanguage();
  const [selectedSituationIdx, setSelectedSituationIdx] = useState(0);

  const digest = buildStaffSurveyReviewDigest(staffSurveys);
  const alloc = digest.averages.timeAllocation;
  const activeSituation = digest.difficultSituations[selectedSituationIdx] || digest.difficultSituations[0];

  const renderBreakdownBlock = (title: string, items: StaffBreakdownItem[], accent = 'bg-[#01AFC5]') => (
    <div className="bg-white rounded-2xl border border-[#BAEBF1] p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-[#063B44] pb-3 mb-3 border-b border-slate-100">{title}</h3>
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            {t('لا توجد إجابات مسجلة لهذا البند بعد', 'No recorded answers yet')}
          </p>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.label} className="text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-[#063B44] truncate">{item.label}</span>
                  <span className="font-mono font-bold text-[#007C8D] tabular-nums shrink-0">
                    {item.pct}% ({item.count})
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${accent} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in" dir={dir}>
      {/* Review Header & Quick Actions */}
      <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#007C8D] font-bold">
            <span>{t('مراجعة استبيان موظفات الشخصيات', 'Character Staff Survey Review')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {t(`${STAFF_TOTAL_QUESTIONS_COUNT} سؤالًا منشورًا (7 أقسام)`, `${STAFF_TOTAL_QUESTIONS_COUNT} active questions (7 sections)`)}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t('القسم 7 و8 القدامى متوقفان عن النشر', 'Legacy Sec 7–8 unpublished')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#063B44]">
            {t('نتائج وجودة استجابات استبيان الشخصية', 'Character Survey Responses & Quality Audit')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            {t(
              'مراجعة شاملة للاستجابات الحية الواردة من الموظفات عبر الأقسام السبعة، مقارنة الأسئلة الإلزامية (*)، وتحليل الملاحظات الميدانية المباشرة مع إمكانية مزامنتها فورًا إلى Google Sheets.',
              'Comprehensive review of live character staff submissions across all 7 active sections, starred required completeness, qualitative field quotes, and instant Google Sheets sync.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenIndividualStaffResponses}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F7FAFB] hover:bg-[#BAEBF1]/30 text-[#063B44] border border-[#BAEBF1] rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#007C8D]" />
            <span>{t('تصفح الردود الفردية', 'Inspect Individual Rows')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenGoogleSheetsSync}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#007C8D] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FEC448]" />
            <span>{t('مزامنة مع Google Sheets', 'Sync to Google Sheets')}</span>
          </button>
        </div>
      </div>

      {/* Guest Review Notice when not signed in as Admin */}
      {!isAdminAuthenticated && (
        <div className="bg-[#BAEBF1]/25 border border-[#01AFC5]/40 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#063B44]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#007C8D] shrink-0" />
            <span>
              {t(
                'استعراض مباشر كزائر — استجابات الشخصيات معروضة مباشرة من السحابة بدون تسجيل.',
                'Direct guest review — Character survey responses are loaded directly from cloud without sign-in.'
              )}
            </span>
          </div>
          {onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="px-3 py-1.5 bg-white hover:bg-[#BAEBF1]/40 text-[#063B44] border border-[#01AFC5]/50 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#007C8D]" />
              <span>{t('دخول المشرف للمزامنة والحذف', 'Admin Login')}</span>
            </button>
          )}
        </div>
      )}

      {digest.totalResponses === 0 ? (
        <div className="bg-white rounded-3xl border border-[#BAEBF1] p-12 text-center space-y-3">
          <ClipboardCheck className="w-12 h-12 mx-auto text-[#01AFC5]/50" />
          <h3 className="text-base font-bold text-[#063B44]">
            {t('لا توجد استجابات مسجلة في استبيان الشخصيات حتى الآن', 'No Character Staff Survey Responses Yet')}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t(
              'نموذج استبيان الشخصيات مفعّل وجاهز لاستقبال ردود الموظفات كزائرات (18 سؤالًا إلزاميًا من أصل 55 سؤالًا مع التحقق الكامل وحفظ قاعدة البيانات). فور إرسال أول استجابة ستظهر مراجعتها كاملة هنا.',
              'The Character Staff Survey form is active and ready to receive guest submissions (18 starred required questions out of 55 with live validation). Insights will populate here immediately after the first submission.'
            )}
          </p>
        </div>
      ) : (
        <>
          {/* Response Completeness & Core KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-5">
              <span className="text-xs font-semibold text-slate-500 block">
                {t('إجمالي استجابات الشخصيات', 'Total Staff Responses')}
              </span>
              <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                {digest.totalResponses}
              </div>
              <span className="text-[11px] text-[#007C8D] font-semibold mt-1 block tabular-nums">
                {t(
                  `${digest.fullyCompletedRequiredCount} مكتمل (${digest.requiredTargetCount}/${digest.requiredTargetCount} *)`,
                  `${digest.fullyCompletedRequiredCount} fully completed (${digest.requiredTargetCount}/${digest.requiredTargetCount} *)`
                )}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-5">
              <span className="text-xs font-semibold text-slate-500 block">
                {t('كفاية الـ 10 دقائق (من 5)', '10-Min Sufficiency (1–5)')}
              </span>
              <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                {digest.averages.isTenMinutesEnough}
                {digest.averages.isTenMinutesEnough !== '—' && (
                  <span className="text-xs font-normal text-slate-500"> / 5</span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block tabular-nums">
                {t(
                  `متوسط التجاوز: ${digest.averages.overflowFrequency}/10 (${digest.averages.overflowMinutesAvg} د)`,
                  `Avg overflow: ${digest.averages.overflowFrequency}/10 (${digest.averages.overflowMinutesAvg}m)`
                )}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-5">
              <span className="text-xs font-semibold text-slate-500 block">
                {t('سؤال بقية الأطفال عن هدايا', 'Other Kids Gift Requests')}
              </span>
              <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                {digest.averages.otherChildrenGiftAskOutOfTen}
                {digest.averages.otherChildrenGiftAskOutOfTen !== '—' && (
                  <span className="text-xs font-normal text-slate-500"> / 10</span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block tabular-nums">
                {t(
                  `سؤال الأهل عن ألعاب بالسيارة: ${digest.averages.extraToysInCarAskOutOfTen}/10`,
                  `Extra car toys asks: ${digest.averages.extraToysInCarAskOutOfTen}/10`
                )}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-5">
              <span className="text-xs font-semibold text-slate-500 block">
                {t('تصوير الأطفال · معدل التأخير', 'Photo Rate · Arrival Lateness')}
              </span>
              <div className="text-2xl font-black text-[#063B44] font-mono tabular-nums mt-1">
                {digest.averages.photoFrequencyOutOfTen}/10{' '}
                <span className="text-slate-300 text-base font-normal">·</span>{' '}
                <span className="text-[#007C8D]">{digest.averages.lateArrivalOutOfTen}/10</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block tabular-nums">
                {t(
                  `متوسط الزيارات اليومية: ${digest.averages.dailyVisitsAvg}`,
                  `Avg daily visits: ${digest.averages.dailyVisitsAvg}`
                )}
              </span>
            </div>
          </div>

          {/* 10-Minute Breakdown & Child Arrival Reactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-[#063B44] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#007C8D]" />
                  <span>{t('متوسط توزيع الـ 10 دقائق الميداني', 'Average 10-Min Time Breakdown')}</span>
                </h3>
                <span className="text-xs font-mono font-bold text-[#007C8D] tabular-nums">
                  {alloc.total} / 10 {t('دقيقة', 'mins')}
                </span>
              </div>

              {alloc.sampleCount === 0 ? (
                <p className="text-xs text-slate-400">
                  {t('لم تقم أي موظفة بتعبئة توزيع الدقائق بعد.', 'No time allocation distributions entered yet.')}
                </p>
              ) : (
                <>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${(alloc.entrance / Math.max(alloc.total, 10)) * 100}%` }}
                      className="bg-[#063B44]"
                      title={t('دخول', 'Entrance')}
                    />
                    <div
                      style={{ width: `${(alloc.gift / Math.max(alloc.total, 10)) * 100}%` }}
                      className="bg-[#FEC448]"
                      title={t('فتح الهدية', 'Gift')}
                    />
                    <div
                      style={{ width: `${(alloc.play / Math.max(alloc.total, 10)) * 100}%` }}
                      className="bg-[#007C8D]"
                      title={t('لعب', 'Play')}
                    />
                    <div
                      style={{ width: `${(alloc.photos / Math.max(alloc.total, 10)) * 100}%` }}
                      className="bg-[#01AFC5]"
                      title={t('صور', 'Photos')}
                    />
                    <div
                      style={{ width: `${(alloc.farewell / Math.max(alloc.total, 10)) * 100}%` }}
                      className="bg-[#48CBD9]"
                      title={t('وداع', 'Farewell')}
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center pt-1">
                    {[
                      { label: t('دخول', 'Entrance'), val: alloc.entrance, dot: 'bg-[#063B44]' },
                      { label: t('الهدية', 'Gift'), val: alloc.gift, dot: 'bg-[#FEC448]' },
                      { label: t('اللعب', 'Play'), val: alloc.play, dot: 'bg-[#007C8D]' },
                      { label: t('الصور', 'Photos'), val: alloc.photos, dot: 'bg-[#01AFC5]' },
                      { label: t('الوداع', 'Farewell'), val: alloc.farewell, dot: 'bg-[#48CBD9]' },
                    ].map((stage) => (
                      <div key={stage.label} className="p-2 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/60">
                        <span className="text-[11px] font-semibold text-slate-600 block">{stage.label}</span>
                        <span className="text-sm font-black text-[#063B44] font-mono tabular-nums">
                          {stage.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-[#063B44] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#007C8D]" />
                  <span>{t('ردود فعل الأطفال عند الدخول (متوسط من 10)', 'Child Arrival Reactions (Avg / 10)')}</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('فرح مباشر', 'Immediate Joy'), val: digest.averages.childReactions.directJoy },
                  { label: t('خجل أو ترقب', 'Shyness'), val: digest.averages.childReactions.shyness },
                  { label: t('خوف أو بكاء', 'Fear/Crying'), val: digest.averages.childReactions.fearOrCrying },
                  { label: t('تعلق شديد', 'Attachment'), val: digest.averages.childReactions.extremeAttachment },
                ].map((c) => (
                  <div key={c.label} className="p-3 bg-[#F7FAFB] rounded-xl border border-[#BAEBF1]/60 text-center">
                    <span className="text-[11px] font-semibold text-slate-600 block">{c.label}</span>
                    <span className="text-lg font-black text-[#063B44] font-mono tabular-nums mt-1 block">
                      {c.val === '—' ? '—' : `${c.val}/10`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Categorized Breakdowns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderBreakdownBlock(t('1. مدة العمل في الخدمة *', '1. Performer Tenure *'), digest.breakdowns.workDuration)}
            {renderBreakdownBlock(t('5. نوع المنزل غالبًا *', '5. Home / Venue Type *'), digest.breakdowns.housingType)}
            {renderBreakdownBlock(t('6. من يفتح الباب غالبًا *', '6. Who Opens Door *'), digest.breakdowns.doorOpener)}
            {renderBreakdownBlock(t('8. من يستلم الهدية عادةً *', '8. Gift Recipient *'), digest.breakdowns.giftRecipient)}
            {renderBreakdownBlock(
              t('هدايا أو ألعاب من شركات أخرى *', 'Competitor Gifts Observed *'),
              digest.breakdowns.seenCompetitorGifts,
              'bg-[#063B44]'
            )}
            {renderBreakdownBlock(
              t('17. رد فعل الطفل عند فتح الهدية *', '17. Child Gift Opening Reaction *'),
              digest.breakdowns.giftOpeningReaction
            )}
            {renderBreakdownBlock(
              t('أكثر من يتبادل الحديث مع الشخصية *', 'Primary Conversation Partner *'),
              digest.breakdowns.primaryConversationPartner
            )}
            {renderBreakdownBlock(
              t('هل تعلم الأمهات أن الزيارة 10 دقائق؟ *', 'Do Moms Know 10-Min Limit? *'),
              digest.breakdowns.momsKnowTenMinLimit,
              'bg-[#FEC448]'
            )}
            {renderBreakdownBlock(
              t('26. التعليقات الشائعة عن الأسعار *', '26. Pricing Sentiment *'),
              digest.breakdowns.pricingSentiment,
              'bg-emerald-600'
            )}
            {renderBreakdownBlock(
              t('تعليقات العملاء عن خدمة العملاء *', 'Customer Service Feedback *'),
              digest.breakdowns.customerServiceFeedback
            )}
            {renderBreakdownBlock(
              t('33. تصرف الموظفة عند طلب وقت إضافي *', '33. Overtime Action *'),
              digest.breakdowns.momOvertimeStaffAction,
              'bg-[#007C8D]'
            )}
            {renderBreakdownBlock(
              t('51. ما يمكن تقديمه للأسرة ولا نقدمه الآن *', '51. Potential Services *'),
              digest.breakdowns.potentialServices,
              'bg-[#01AFC5]'
            )}
          </div>

          {/* Q25 Topic Inquiry Frequency Table */}
          <div className="bg-white rounded-2xl border border-[#BAEBF1] p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#063B44]">
              {t('25. مصفوفة تكرار أسئلة الأمهات (المواضيع الخمسة المعتمدة)', '25. Mother Inquiry Frequency Across 5 Topics')}
            </h3>
            <div className="overflow-x-auto">
              <table className={`w-full text-xs border-collapse ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className="border-b border-[#BAEBF1] bg-[#F7FAFB] text-[#063B44]">
                    <th className="py-2.5 px-3 font-bold">{t('الموضوع', 'Topic')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('لا يحدث', 'Never')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('1–3 مرات', '1–3 times')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('4–6 مرات', '4–6 times')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('7–10 مرات', '7–10 times')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('إجمالي الردود', 'Total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {digest.momInquiriesMatrix.map((row, i) => (
                    <tr key={row.topicKey || i} className="hover:bg-[#BAEBF1]/15">
                      <td className="py-2.5 px-3 font-bold text-[#063B44]">
                        {lang === 'en' ? row.labelEn : row.labelAr}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">{row.counts['لا يحدث'] || 0}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">{row.counts['1–3 مرات'] || 0}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">{row.counts['4–6 مرات'] || 0}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">{row.counts['7–10 مرات'] || 0}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#007C8D] tabular-nums">
                        {row.totalAnswered}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Q37–Q40 Difficult Situations Playbook Review */}
          <div className="bg-white rounded-2xl border border-[#BAEBF1] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#063B44] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FEC448]" />
                  <span>
                    {t('مراجعة المواقف الصعبة 37–40: التصرف (أ) والعبارة المنطوقة (ب)', 'Difficult Situations 37–40: Action (A) & Exact Phrase (B)')}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t('تم إزالة الفقرة (ج) وعرض التصرف والعبارة الفعلية لكل موظفة', 'Displays real field Actions (A) and Exact Phrases (B) without retired part (C)')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {digest.difficultSituations.map((sit, idx) => (
                <button
                  type="button"
                  key={sit.situationId}
                  onClick={() => setSelectedSituationIdx(idx)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedSituationIdx === idx
                      ? 'bg-[#007C8D] text-white'
                      : 'bg-[#F7FAFB] text-[#063B44] border border-[#BAEBF1] hover:bg-[#BAEBF1]/30'
                  }`}
                >
                  {t(`س${sit.number}`, `Q${sit.number}`)} ({sit.entries.length})
                </button>
              ))}
            </div>

            {activeSituation && (
              <div className="space-y-3 pt-1">
                <p className="text-xs font-bold text-[#007C8D]">
                  {activeSituation.number}. {lang === 'en' ? activeSituation.titleEn : activeSituation.titleAr}
                </p>
                {activeSituation.entries.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {t('لم تدوّن الموظفات إجابات نصية لهذا الموقف بعد.', 'No text answers submitted for this situation yet.')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeSituation.entries.map((ent) => (
                      <div key={ent.responseId} className="p-4 rounded-xl bg-[#F7FAFB] border border-[#BAEBF1]/70 space-y-2 text-xs">
                        <div className="text-[11px] text-slate-500 font-medium">{ent.areaOrTenure}</div>
                        {ent.action && (
                          <div>
                            <span className="font-bold text-[#007C8D]">{t('(أ) التصرف: ', '(A) Action: ')}</span>
                            <span className="text-[#063B44]">{ent.action}</span>
                          </div>
                        )}
                        {ent.phrase && (
                          <div>
                            <span className="font-bold text-[#007C8D]">{t('(ب) العبارة: ', '(B) Phrase: ')}</span>
                            <span className="text-[#063B44]">"{ent.phrase}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Qualitative Field Insights & First Things to Change */}
          <div className="bg-white rounded-2xl border border-[#BAEBF1] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#063B44] flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-[#007C8D]" />
                <span>
                  {t('أبرز الإجابات المفتوحة: أول تغيير مقترح ورسائل الميدان', 'Key Open Answers: First Change Proposals & Field Notes')}
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First thing to change */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#007C8D]">
                  {t('لو كان القرار بيد الموظفة: أول شيء تقترح تغييره *', 'First Thing Staff Would Change *')} ({digest.qualitative.firstThingToChange.length})
                </h4>
                {digest.qualitative.firstThingToChange.length === 0 ? (
                  <p className="text-xs text-slate-400">{t('لا توجد إجابات بعد', 'No entries yet')}</p>
                ) : (
                  digest.qualitative.firstThingToChange.map((item) => (
                    <div key={item.responseId} className="p-3.5 rounded-xl bg-[#FEF4E3]/70 border border-[#FEC448]/60 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span>{item.meta}</span>
                        {onCreateFollowUpTask && (
                          <button
                            type="button"
                            onClick={() =>
                              onCreateFollowUpTask(
                                t(`مقترح موظفة شخصية: ${item.text.slice(0, 60)}`, `Staff suggestion: ${item.text.slice(0, 60)}`),
                                `${item.meta}\n${item.text}`
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007C8D] hover:text-[#063B44] cursor-pointer"
                          >
                            <ListTodo className="w-3.5 h-3.5" />
                            <span>{t('تحويل لمهمة', 'To Task')}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-[#063B44] leading-relaxed">"{item.text}"</p>
                    </div>
                  ))
                )}
              </div>

              {/* Moms unaware reaction + replies to other children */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#007C8D]">
                  {t('ردة فعل الأمهات غير العالمات بالـ 10 دقائق + الرد على بقية الأطفال', 'Unaware Mom Reactions & Replies to Other Kids')}
                </h4>
                {digest.qualitative.momsUnawareTenMinReaction.length === 0 &&
                digest.qualitative.otherChildrenGiftReply.length === 0 &&
                digest.qualitative.messageToLeadership.length === 0 ? (
                  <p className="text-xs text-slate-400">{t('لا توجد ملاحظات نصية بعد', 'No written notes yet')}</p>
                ) : (
                  <div className="space-y-2.5">
                    {digest.qualitative.momsUnawareTenMinReaction.map((item) => (
                      <div key={`unaware-${item.responseId}`} className="p-3 rounded-xl bg-[#F7FAFB] border border-[#BAEBF1]/80 text-xs space-y-1">
                        <span className="font-bold text-[#007C8D] block text-[11px]">
                          {t('ردة فعل أم عند معرفة مدة الـ 10 دقائق', 'Reaction when unaware of 10-min limit')} · {item.meta}
                        </span>
                        <p className="text-[#063B44]">"{item.text}"</p>
                      </div>
                    ))}
                    {digest.qualitative.otherChildrenGiftReply.map((item) => (
                      <div key={`otherkids-${item.responseId}`} className="p-3 rounded-xl bg-[#F7FAFB] border border-[#BAEBF1]/80 text-xs space-y-1">
                        <span className="font-bold text-[#007C8D] block text-[11px]">
                          {t('رد الموظفة على بقية الأطفال', 'Reply to other kids asking for gifts')} · {item.meta}
                        </span>
                        <p className="text-[#063B44]">"{item.text}"</p>
                      </div>
                    ))}
                    {digest.qualitative.messageToLeadership.map((item) => (
                      <div key={`lead-${item.responseId}`} className="p-3 rounded-xl bg-[#F7FAFB] border border-[#BAEBF1]/80 text-xs space-y-1">
                        <span className="font-bold text-[#063B44] flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-[#007C8D]" />
                          {t('رسالة للإدارة', 'Message to leadership')} · {item.meta}
                        </span>
                        <p className="text-[#063B44]">"{item.text}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
