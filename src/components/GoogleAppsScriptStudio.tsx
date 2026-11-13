import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  FileCode,
  BookOpen,
  ClipboardList,
  Timer,
  HeartHandshake,
  Truck,
  Headphones,
  Compass,
} from 'lucide-react';
import { generateGoogleAppsScript, ScriptGeneratorOptions } from '../utils/surveyLogic';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';
import { KidzyPatternDecor, KidzyWordmark } from './KidzyBrandMark';

export const GoogleAppsScriptStudio: React.FC = () => {
  const { dir, t } = useLanguage();

  const [options, setOptions] = useState<ScriptGeneratorOptions>({
    companyName: 'kidzy kpi,s',
    fixSetCollectEmail: true,
    visitDurationMinutes: 10,
    allowVoiceResponseNote: true,
  });

  const [copied, setCopied] = useState(false);
  const [selectedFunc, setSelectedFunc] = useState<string>('createStaffForm');

  const generatedScript = generateGoogleAppsScript(options);

  const functionsList = [
    {
      id: 'createStaffForm',
      name: 'createStaffForm',
      label: t('استبيان موظفات الشخصيات', 'Character Staff Survey'),
      desc: t(
        'النموذج المحدث المكون من 7 أقسام مركزة وميدانية (مع إخفاء قسم الأدوات والأفكار)',
        'Updated 7-section character survey including new child & mom awareness questions'
      ),
      icon: ClipboardList,
      color: 'text-[#007C8D] bg-[#BAEBF1]/45',
    },
    {
      id: 'createPostVisitLog',
      name: 'createPostVisitLog',
      label: t('مذكرة ما بعد الزيارة (30ث)', 'Post-Visit Log (30s)'),
      desc: t(
        'مذكرة الميدان فائقة السرعة لتسجيل مجريات الزيارة بعد الخروج مباشرة',
        'Ultra-fast post-visit field logger completed right after leaving the visit'
      ),
      icon: Timer,
      color: 'text-[#063B44] bg-[#FEF4E3]',
    },
    {
      id: 'createMothersSurvey',
      name: 'createMothersSurvey',
      label: t('استبيان الأمهات القصير', 'Mothers Short Survey'),
      desc: t(
        'استبيان العائلة المختصر مع تقييم الوقت والأسعار واشتراك واتساب الاختياري',
        'Brief family feedback form covering rating, 10-min duration, and pricing'
      ),
      icon: HeartHandshake,
      color: 'text-rose-700 bg-rose-50',
    },
    {
      id: 'createDriversForm',
      name: 'createDriversForm',
      label: t('استبيان السائقين والتوصيل', 'Drivers & Delivery Survey'),
      desc: t(
        'مخصص لتوصيلات الهدايا، البالونات، والكيك بدون شخصيات كرتونية',
        'For non-character orders delivered directly by drivers'
      ),
      icon: Truck,
      color: 'text-[#005866] bg-[#BAEBF1]/35',
    },
    {
      id: 'createCustomerServiceForm',
      name: 'createCustomerServiceForm',
      label: t('استبيان قسم خدمة العملاء', 'Customer Service Survey'),
      desc: t(
        'شكاوى التطبيق، الأسعار، تعليقات الخدمة، وأسباب الإلغاء الشائعة',
        'Captures app issues, pricing sentiment, support feedback, and cancellations'
      ),
      icon: Headphones,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      id: 'createOperationsForm',
      name: 'createOperationsForm',
      label: t('استبيان العمليات والتشغيل', 'Operations & Dispatch Survey'),
      desc: t(
        'اختناقات التوجيه، معدلات تأخير السائقين والشخصيات، وصيانة الأزياء',
        'Dispatch bottlenecks, driver/staff punctuality, and costume readiness'
      ),
      icon: Compass,
      color: 'text-[#063B44] bg-slate-100',
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const safeName = (options.companyName || 'kidzy_kpis').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '_');
    const blob = new Blob([generatedScript], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kidzy_kpis_${safeName}.gs`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir={dir}>
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#063B44] via-[#005866] to-[#007C8D] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <KidzyPatternDecor variant="dark-banner" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <KidzyWordmark variant="cream" className="h-7 w-auto mb-1" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#01AFC5]/25 text-[#BAEBF1] text-xs font-bold px-3 py-1 rounded-full border border-[#BAEBF1]/30 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#FEC448]" />
                {t('استوديو Google Apps Script – 6 نماذج', 'Google Apps Script Studio – 6 Forms')}
              </span>
              <span className="text-[#BAEBF1] text-xs">
                {t('متوافق 100% مع Google Forms & Sheets', '100% Google Forms & Sheets Compatible')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {t('مُوَلّد نماذج Google Forms لـ ', 'Google Forms Generator for ')}
              <span dir="ltr" className="font-['Nunito',sans-serif]">
                kidzy kpi,s
              </span>
            </h1>
            <p className="text-slate-100/90 text-sm max-w-2xl leading-relaxed">
              {t(
                'كود برمجي واحد ينشئ 6 نماذج استبيان رسمية محدثة بنقرة واحدة داخل Google Apps Script، مع معالجة خطأ setCollectEmail وتوليد روابط التعديل والمشاركة تلقائيًا.',
                'A single script generating all 6 synchronized Google Forms in one click, complete with setCollectEmail safety protection and instant share links.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <LanguageSwitcher variant="glass" />

            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#007C8D] hover:bg-[#019DB2] text-white border border-white/15 active:scale-95'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t('تم نسخ الكود!', 'Copied!') : t('نسخ الكود بالكامل', 'Copy All Code')}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#FEC448]" />
              <span>{t('تحميل ملف .gs', 'Download .gs')}</span>
            </button>

            <a
              href="https://script.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FEC448] hover:bg-[#f5b62f] text-[#063B44] rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm"
            >
              <span>{t('فتح Google Apps Script', 'Open Apps Script')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Available Functions Explorer */}
      <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-[#063B44] mb-2 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[#007C8D]" />
          <span>
            {t(
              'الدوال البرمجية الست المتاحة داخل الكود (اختاري دالة لتشغيلها):',
              '6 Ready-to-Run Generator Functions:'
            )}
          </span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {t(
            'عند تشغيل أي دالة في script.google.com ستنشئ النموذج فورًا وتطبع رابط التعديل ورابط المشاركة في سجل التنفيذ (Execution log)',
            'Running any function in script.google.com creates the Google Form and logs both the edit URL and responder link.'
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {functionsList.map((fn) => {
            const Icon = fn.icon;
            const isSelected = selectedFunc === fn.name;
            return (
              <div
                key={fn.id}
                onClick={() => setSelectedFunc(fn.name)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#007C8D] bg-[#BAEBF1]/25 shadow-sm'
                    : 'border-slate-200 bg-[#F7FAFB] hover:bg-[#BAEBF1]/15'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2.5 rounded-xl ${fn.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#063B44]">{fn.label}</h3>
                    <code
                      dir="ltr"
                      className="text-[11px] font-mono text-[#007C8D] bg-white px-1.5 py-0.5 rounded border border-[#BAEBF1] inline-block"
                    >
                      {fn.name}()
                    </code>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">{fn.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration & Options */}
      <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
          <Sliders className="w-5 h-5 text-[#007C8D]" />
          <h2 className="text-base font-bold text-[#063B44]">
            {t('خيارات تخصيص الكود وإصلاح التوافق', 'Script Customization & Compatibility Options')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-1.5">
              {t('اسم الخدمة أو العلامة في النماذج', 'Brand Name Inside Forms')}
            </label>
            <input
              type="text"
              dir="ltr"
              value={options.companyName}
              onChange={(e) => setOptions({ ...options, companyName: e.target.value })}
              className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2 text-sm text-[#063B44] font-semibold focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
            />
            <span className="text-[11px] text-slate-600 mt-1 block">
              {t('يظهر في عناوين النماذج ومقدمتها', 'Appears in form headers and intro text')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-1.5">
              {t('مدة الزيارة المعتمدة بالدقائق', 'Standard Visit Duration (mins)')}
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={options.visitDurationMinutes}
              onChange={(e) => setOptions({ ...options, visitDurationMinutes: Number(e.target.value) })}
              className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2 text-sm text-[#063B44] font-semibold focus:outline-none focus:ring-2 focus:ring-[#01AFC5] font-mono tabular-nums"
            />
            <span className="text-[11px] text-slate-600 mt-1 block">
              {t('يضبط مقاييس الأسئلة وتقسيم الوقت (افتراضي 10)', 'Sets time breakdown scales (default 10)')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#063B44] mb-1.5">
              {t('خيار الإجابة بالرسائل الصوتية عبر واتساب', 'WhatsApp Voice Reply Notice')}
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="voice-toggle"
                checked={options.allowVoiceResponseNote}
                onChange={(e) => setOptions({ ...options, allowVoiceResponseNote: e.target.checked })}
                className="w-4 h-4 rounded accent-[#007C8D] focus:ring-[#01AFC5] cursor-pointer"
              />
              <label htmlFor="voice-toggle" className="text-xs font-medium text-[#063B44] cursor-pointer">
                {t('تضمين تنبيه قبول الرسائل الصوتية في المقدمة', 'Include voice memo option in intro')}
              </label>
            </div>
            <span className="text-[11px] text-slate-600 mt-1 block">
              {t('يسهل على الموظفات الإجابة السريعة', 'Makes long reflections easier for staff')}
            </span>
          </div>
        </div>

        {/* Workspace Compatibility Fix Banner */}
        <div
          className={`mt-6 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            options.fixSetCollectEmail
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-[#FEF4E3] border-[#FEC448]/70 text-[#063B44]'
          }`}
        >
          <div className="flex items-start gap-3">
            {options.fixSetCollectEmail ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#007C8D] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold">
                  {options.fixSetCollectEmail
                    ? t('تم تفعيل الحل الوقائي لخطأ setCollectEmail (موصى به)', 'setCollectEmail Fix Enabled (Recommended)')
                    : t('تنبيه: سطر setCollectEmail مفعل حاليًا', 'Warning: setCollectEmail Active')}
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-current font-mono">
                  Google Workspace Compatible
                </span>
              </div>
              <p className="text-xs opacity-90 mt-1 leading-relaxed">
                {t(
                  'في حسابات Google Workspace الحديثة، قد ينتج خطأ إذا حاول السكريبت استدعاء دالة setCollectEmail(false). هذا الخيار يعلقها بأمان.',
                  'Recent Google Workspace accounts throw TypeError on setCollectEmail(false). Keeping this enabled prevents runtime crashes.'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOptions({ ...options, fixSetCollectEmail: !options.fixSetCollectEmail })}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-current hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
          >
            {options.fixSetCollectEmail
              ? t('تعطيل الحماية', 'Disable Fix')
              : t('تفعيل الحماية', 'Enable Fix')}
          </button>
        </div>
      </div>

      {/* Step-by-Step Instructions */}
      <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
          <BookOpen className="w-5 h-5 text-[#007C8D]" />
          <h2 className="text-base font-bold text-[#063B44]">
            {t('دليل التشغيل خطوة بخطوة في Google Apps Script', 'Quick 3-Step Deployment Guide')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#F7FAFB] border border-[#BAEBF1]/80 rounded-xl p-4 relative">
            <div className="w-7 h-7 bg-[#007C8D] text-white rounded-lg flex items-center justify-center font-bold text-xs mb-3 tabular-nums">
              1
            </div>
            <h3 className="text-sm font-bold text-[#063B44] mb-1">
              {t('فتح وإنشاء مشروع جديد', 'Create New Project')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'افتح script.google.com واضغط على «مشروع جديد» (New Project).',
                'Open script.google.com and click New Project.'
              )}
            </p>
          </div>

          <div className="bg-[#F7FAFB] border border-[#BAEBF1]/80 rounded-xl p-4 relative">
            <div className="w-7 h-7 bg-[#007C8D] text-white rounded-lg flex items-center justify-center font-bold text-xs mb-3 tabular-nums">
              2
            </div>
            <h3 className="text-sm font-bold text-[#063B44] mb-1">
              {t('لصق الكود وحفظه', 'Paste & Save Script')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'احذف أي كود قديم في المحرر، الصق الكود المنسوخ ثم اضغط حفظ (Ctrl + S).',
                'Replace the boilerplate code with the generated script and press Ctrl+S.'
              )}
            </p>
          </div>

          <div className="bg-[#F7FAFB] border border-[#BAEBF1]/80 rounded-xl p-4 relative">
            <div className="w-7 h-7 bg-[#007C8D] text-white rounded-lg flex items-center justify-center font-bold text-xs mb-3 tabular-nums">
              3
            </div>
            <h3 className="text-sm font-bold text-[#063B44] mb-1">
              {t('اختيار الدالة والتشغيل', 'Select & Run Function')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'اختر الدالة المطلوبة واضغط «تشغيل» ثم انسخ الروابط من سجل التنفيذ (Execution log).',
                'Pick createStaffForm or any form function, click Run, and copy URLs from the Execution log.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-[#063B44] text-slate-100 rounded-3xl border border-[#005866] overflow-hidden shadow-2xl">
        <div className="bg-[#042a31] px-5 py-3 border-b border-[#005866] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#FEC448]" />
            <span className="text-xs font-mono font-bold text-slate-200">kidzy_kpis_AllInOne.gs</span>
            <span className="text-[10px] bg-[#005866] text-[#BAEBF1] px-2 py-0.5 rounded font-mono">
              Google FormApp API
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-white bg-[#007C8D] hover:bg-[#019DB2] px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#FEC448]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t('تم النسخ!', 'Copied!') : t('نسخ الكود', 'Copy Code')}</span>
          </button>
        </div>

        <div dir="ltr" className="p-4 overflow-x-auto max-h-[500px] text-xs font-mono text-slate-200 leading-relaxed text-left">
          <pre>{generatedScript}</pre>
        </div>
      </div>
    </div>
  );
};
