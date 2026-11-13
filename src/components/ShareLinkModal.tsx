import React, { useEffect, useState } from 'react';
import { SurveyTypeKey } from '../types/survey';
import { getGuestHubShareUrl, getGuestResponsesShareUrl, getSurveyShareUrl } from '../utils/surveyLogic';
import { useLanguage } from '../context/LanguageContext';
import { KidzyMonogram } from './KidzyBrandMark';
import { Copy, Check, ExternalLink, MessageCircle, UserCheck, Info } from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSurveyKey?: SurveyTypeKey;
  onSelectSurveyToShare?: (key: SurveyTypeKey) => void;
}

export const SURVEY_METADATA: Record<
  SurveyTypeKey,
  {
    title: string;
    titleEn: string;
    shortDesc: string;
    shortDescEn: string;
    targetAudience: string;
    targetAudienceEn: string;
    badgeColor: string;
  }
> = {
  'post-visit-log': {
    title: 'مذكرة ما بعد الزيارة (30 ثانية)',
    titleEn: 'Post-Visit Log (30 Seconds)',
    shortDesc: 'رابط مباشر وسريع للموظفات بعد انتهاء كل زيارة',
    shortDescEn: 'Fast direct link for character staff immediately after each visit',
    targetAudience: 'موظفات الشخصيات الميدانية',
    targetAudienceEn: 'Field Character Staff',
    badgeColor: 'bg-[#FEF4E3] text-[#063B44] border-[#FEC448]',
  },
  'staff-survey': {
    title: 'استبيان موظفات الشخصيات الشامل',
    titleEn: 'Character Staff Comprehensive Survey',
    shortDesc: 'رابط سري ومجهول لدراسة مجرى الزيارة وتفاصيل الميدان (7 أقسام)',
    shortDescEn: 'Anonymous confidential survey exploring the 10-min visit & field insights (7 sections)',
    targetAudience: 'الموظفات الميدانيات',
    targetAudienceEn: 'Field Mascot Staff',
    badgeColor: 'bg-[#BAEBF1]/60 text-[#063B44] border-[#01AFC5]',
  },
  'mother-survey': {
    title: 'استبيان الأمهات ورضا العملاء',
    titleEn: 'Mothers Experience Survey',
    shortDesc: 'رابط خفيف (5 أسئلة) يرسل للأم بعد الزيارة عبر واتساب',
    shortDescEn: 'Short 5-question feedback link sent to mothers after visits',
    targetAudience: 'الأمهات وأولياء الأمور',
    targetAudienceEn: 'Mothers & Parents',
    badgeColor: 'bg-rose-50 text-rose-900 border-rose-200',
  },
  'drivers-survey': {
    title: 'استبيان السائقين وتوصيل الطلبات',
    titleEn: 'Drivers & Direct Delivery Survey',
    shortDesc: 'خاص بالطلبات التي يوصلها السائقون بدون شخصيات كرتونية',
    shortDescEn: 'Dedicated to driver-only deliveries (gifts, cakes, balloons without mascots)',
    targetAudience: 'سائقو التوصيل الميداني',
    targetAudienceEn: 'Delivery Drivers',
    badgeColor: 'bg-sky-50 text-sky-900 border-sky-200',
  },
  'customer-service-survey': {
    title: 'استبيان قسم خدمة العملاء',
    titleEn: 'Customer Service Team Survey',
    shortDesc: 'رصد شكاوى التطبيق، تفاعل العملاء، والطلبات غير المتوفرة',
    shortDescEn: 'Tracks pricing remarks, app/website issues, and unserved customer requests',
    targetAudience: 'فريق خدمة العملاء والدعم',
    targetAudienceEn: 'Customer Support Team',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  },
  'operations-survey': {
    title: 'استبيان العمليات والتشغيل',
    titleEn: 'Operations & Dispatch Survey',
    shortDesc: 'تحليل اختناقات الجدولة، التوصيل، وصيانة الأزياء',
    shortDescEn: 'Analyzes scheduling bottlenecks, dispatch latency, and costume readiness',
    targetAudience: 'مشرفو العمليات واللوجستيات',
    targetAudienceEn: 'Operations & Dispatch Coordinators',
    badgeColor: 'bg-slate-100 text-[#063B44] border-slate-300',
  },
};

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  activeSurveyKey = 'staff-survey',
  onSelectSurveyToShare,
}) => {
  const { lang, dir, t } = useLanguage();
  const [selectedKey, setSelectedKey] = useState<SurveyTypeKey>(activeSurveyKey || 'staff-survey');
  const [shareScope, setShareScope] = useState<'single' | 'guest-hub' | 'guest-responses'>('single');
  const [allowGuestAccess, setAllowGuestAccess] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && activeSurveyKey) {
      setSelectedKey(activeSurveyKey);
    }
  }, [isOpen, activeSurveyKey]);

  if (!isOpen) return null;

  const currentMeta = SURVEY_METADATA[selectedKey];
  const shareUrl =
    shareScope === 'guest-responses'
      ? getGuestResponsesShareUrl()
      : shareScope === 'guest-hub'
      ? getGuestHubShareUrl()
      : getSurveyShareUrl(selectedKey, undefined, { guest: allowGuestAccess });

  const titleText =
    shareScope === 'guest-responses'
      ? t('رابط استعراض الإجابات والتحليلات كزائر', 'Guest Responses & Analytics Link')
      : shareScope === 'guest-hub'
      ? t('رابط الزائر الشامل للاستبيانات', 'Guest Surveys Link')
      : lang === 'en'
      ? currentMeta.titleEn
      : currentMeta.title;
  const descText =
    shareScope === 'guest-responses'
      ? t(
          'يفتح للمستلم مباشرة شاشة الاستجابات والتحليلات ومراجعة استبيان الشخصيات كزائر دون اشتراط حساب Google أو إيميل.',
          'Directly opens live survey responses, analytics, and staff survey review as a guest without requiring Google login or email.'
        )
      : shareScope === 'guest-hub'
      ? t(
          'يفتح للمستلم صفحة الاستبيانات كزائر فقط للاختيار والتعبئة دون ظهور التحليلات أو أزرار الإدارة.',
          'Opens survey forms in Guest Mode so recipients can respond without analytics, admin controls, or sign-in.'
        )
      : lang === 'en'
      ? currentMeta.shortDescEn
      : currentMeta.shortDesc;
  const targetText =
    shareScope === 'guest-responses'
      ? t('المستلمون والمشرفون لمراجعة الردود (بدون تسجيل)', 'Recipients & Reviewers (No Sign-In)')
      : shareScope === 'guest-hub'
      ? t('أي مشارك كزائر (بدون تسجيل دخول)', 'Any Guest Respondent (No Sign-In)')
      : lang === 'en'
      ? currentMeta.targetAudienceEn
      : currentMeta.targetAudience;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const guestMessageLine =
    shareScope === 'guest-responses'
      ? t(
          '\nيمكنكِ استعراض وقراءة جميع الإجابات والتحليلات مباشرة كزائر دون الحاجة لتسجيل الدخول ببريد إلكتروني أو حساب Google.',
          '\nYou can view and review all survey responses and analytics directly as a guest with no email or Google sign-in required.'
        )
      : allowGuestAccess || shareScope === 'guest-hub'
      ? t(
          '\nيمكنكِ الإجابة مباشرة كزائر دون الحاجة لتسجيل الدخول ببريد إلكتروني أو كلمة مرور.',
          '\nYou can answer directly as a guest with no email or password sign-in required.'
        )
      : '';

  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    t(
      `مرحبًا بكِ في ${titleText} – kidzy kpi,s:${guestMessageLine}\n${shareUrl}`,
      `Welcome to ${titleText} – kidzy kpi,s:${guestMessageLine}\n${shareUrl}`
    )
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#063B44]/60 backdrop-blur-xs flex items-center justify-center p-4"
      dir={dir}
    >
      <div
        className={`bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#BAEBF1] animate-in zoom-in-95 duration-200 space-y-5 ${
          lang === 'en' ? 'text-left' : 'text-right'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#BAEBF1]/60">
          <div className="flex items-center gap-3">
            <KidzyMonogram variant="tile-teal" size={40} />
            <div>
              <h2 className="text-lg font-bold text-[#063B44]">
                {t('مشاركة رابط الاستجابة كزائر', 'Share Guest Response Link')}
              </h2>
              <p className="text-xs text-slate-500">
                {t(
                  'يتيح للمستلم التعبئة والإرسال فورًا بدون إيميل أو رقم سري أو وصول للتحليلات',
                  'Lets recipients answer right away with no email, password, or analytics access'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('إغلاق', 'Close')}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#BAEBF1]/40 flex items-center justify-center text-[#063B44] font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Guest Scope Selector */}
        <div>
          <label className="block text-xs font-bold text-[#063B44] mb-2">
            {t('نوع الرابط للمستلم:', 'Recipient Link Type:')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setShareScope('single')}
              className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                lang === 'en' ? 'text-left' : 'text-right'
              } ${
                shareScope === 'single'
                  ? 'bg-[#007C8D] text-white border-[#007C8D]'
                  : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:border-[#01AFC5]'
              }`}
            >
              <span className="block">{t('استبيان منفرد للتعبئة', 'Single Survey Form')}</span>
              <span className={`text-[11px] font-normal block mt-0.5 ${shareScope === 'single' ? 'text-[#BAEBF1]' : 'text-slate-500'}`}>
                {t('يعرض الاستبيان المختار فقط لتعبئته', 'Shows selected survey to fill')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShareScope('guest-hub');
                setAllowGuestAccess(true);
              }}
              className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                lang === 'en' ? 'text-left' : 'text-right'
              } ${
                shareScope === 'guest-hub'
                  ? 'bg-[#007C8D] text-white border-[#007C8D]'
                  : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:border-[#01AFC5]'
              }`}
            >
              <span className="block">{t('جميع الاستبيانات كزائر', 'All Surveys in Guest Mode')}</span>
              <span className={`text-[11px] font-normal block mt-0.5 ${shareScope === 'guest-hub' ? 'text-[#BAEBF1]' : 'text-slate-500'}`}>
                {t('يختار المستلم أي استبيان ويعبئه', 'Recipient picks any form to fill')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShareScope('guest-responses');
                setAllowGuestAccess(true);
              }}
              className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                lang === 'en' ? 'text-left' : 'text-right'
              } ${
                shareScope === 'guest-responses'
                  ? 'bg-[#007C8D] text-white border-[#007C8D]'
                  : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:border-[#01AFC5]'
              }`}
            >
              <span className="block">{t('استعراض الإجابات كزائر', 'View Responses as Guest')}</span>
              <span className={`text-[11px] font-normal block mt-0.5 ${shareScope === 'guest-responses' ? 'text-[#BAEBF1]' : 'text-slate-500'}`}>
                {t('يفتح الردود والتحليلات مباشرة دون إيميل', 'Opens live responses without login')}
              </span>
            </button>
          </div>
        </div>

        {/* Survey Picker (visible for single isolated link) */}
        {shareScope === 'single' && (
          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-2">
              {t('اختاري الاستبيان المطلوب مشاركته:', 'Select survey to share:')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(SURVEY_METADATA) as SurveyTypeKey[]).map((key) => {
                const item = SURVEY_METADATA[key];
                const isSelected = selectedKey === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => {
                      setSelectedKey(key);
                      if (onSelectSurveyToShare) onSelectSurveyToShare(key);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all truncate cursor-pointer ${
                      lang === 'en' ? 'text-left' : 'text-right'
                    } ${
                      isSelected
                        ? 'bg-[#007C8D] text-white border-[#007C8D] shadow-xs'
                        : 'bg-[#F7FAFB] text-[#063B44] border-slate-200 hover:bg-[#BAEBF1]/30 hover:border-[#01AFC5]/50'
                    }`}
                  >
                    <span className="truncate block">{lang === 'en' ? item.titleEn : item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Guest Access Toggle (visible for single survey) */}
        {shareScope === 'single' && (
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#01AFC5]/45 cursor-pointer hover:bg-[#BAEBF1]/20 transition">
            <input
              type="checkbox"
              checked={allowGuestAccess}
              onChange={(e) => setAllowGuestAccess(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#007C8D] rounded cursor-pointer"
            />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-[#063B44] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#007C8D] shrink-0" />
                <span>
                  {t(
                    'تفعيل الاستجابة كزائر (بدون تسجيل دخول أو بريد إلكتروني أو كلمة مرور)',
                    'Allow response as Guest (no email or password login required)'
                  )}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {t(
                  'عند التفعيل، يفتح الرابط بوضع الزائر الخالص وتُحجب أي أزرار تسجيل دخول أو تحليلات عن المستلم.',
                  'When enabled, recipients enter pure Guest Mode with all sign-in prompts and analytics hidden.'
                )}
              </p>
            </div>
          </label>
        )}

        {/* Survey Card Summary */}
        <div className="p-4 bg-[#FEF4E3]/80 border border-[#FEC448]/60 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
            <span className="font-semibold">
              {t('الفئة المستهدفة:', 'Audience:')} {targetText}
            </span>
            <span className="font-mono font-bold text-[#007C8D]">
              {shareScope === 'guest-responses'
                ? 'tab=analytics&guest=1'
                : shareScope === 'guest-hub'
                ? 'guest=1'
                : allowGuestAccess
                ? `${selectedKey} · guest`
                : selectedKey}
            </span>
          </div>
          <h3 className="font-bold text-[#063B44] text-sm">{titleText}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{descText}</p>
        </div>

        {/* URL Box & Actions */}
        <div>
          <label className="block text-xs font-bold text-[#063B44] mb-1.5">
            {t(
              'رابط المستلم المباشر:',
              'Direct respondent link:'
            )}
          </label>
          <div className="flex items-center gap-2 bg-[#F7FAFB] border border-[#01AFC5]/45 rounded-2xl p-2 pl-3">
            <input
              type="text"
              readOnly
              dir="ltr"
              value={shareUrl}
              className="w-full bg-transparent text-xs text-[#063B44] font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#007C8D] hover:bg-[#005866] text-white active:scale-95'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('تم النسخ!', 'Copied!') : t('نسخ الرابط', 'Copy Link')}</span>
            </button>
          </div>
        </div>

        {/* Platform Public Share Tip */}
        <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <Info className="w-4 h-4 text-[#007C8D] shrink-0 mt-0.5" />
          <span>
            {t(
              'تنبيه: عند إرسال الرابط لأشخاص من خارج المنصة، تأكدي من مشاركة رابط النشر العام للتطبيق (وليس رابط المعاينة المؤقت للتطوير) حتى لا تطلب المنصة منهم تسجيل الدخول بحساب Google.',
              'Tip: When sending to external recipients, share the publicly published app URL (not the private dev preview URL) so the platform opens directly in Guest Mode.'
            )}
          </span>
        </div>

        {/* Direct Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>{t('مشاركة عبر واتساب', 'Share on WhatsApp')}</span>
          </a>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#063B44] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4 text-[#FEC448] shrink-0" />
            <span>{t('معاينة كزائر', 'Preview as Guest')}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
