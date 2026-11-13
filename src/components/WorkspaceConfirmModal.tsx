import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, X, Check } from 'lucide-react';

export interface WorkspaceConfirmPayload {
  title: string;
  description: string;
  targetLabel: string;
  affectedDetails: string[];
  confirmButtonText: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => Promise<void> | void;
}

interface WorkspaceConfirmModalProps {
  pending: WorkspaceConfirmPayload | null;
  busy: boolean;
  onCancel: () => void;
}

export const WorkspaceConfirmModal: React.FC<WorkspaceConfirmModalProps> = ({
  pending,
  busy,
  onCancel,
}) => {
  const { dir, t } = useLanguage();

  if (!pending) return null;

  const isDanger = pending.tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 bg-[#063B44]/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir={dir}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#BAEBF1] space-y-5 ${
          dir === 'rtl' ? 'text-right' : 'text-left'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isDanger
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-[#FEF4E3] text-[#063B44] border border-[#FEC448]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#063B44]">{pending.title}</h3>
              <p className="text-xs text-[#007C8D] font-bold mt-0.5">{pending.targetLabel}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="text-slate-400 hover:text-[#063B44] p-1.5 rounded-xl hover:bg-[#BAEBF1]/30 transition-colors cursor-pointer disabled:opacity-40"
            aria-label={t('إغلاق', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#063B44]/90 leading-relaxed">{pending.description}</p>

        {pending.affectedDetails.length > 0 && (
          <div className="bg-[#F7FAFB] border border-[#BAEBF1] rounded-2xl p-4 space-y-1.5">
            <span className="text-xs font-bold text-[#007C8D] block">
              {t('تفاصيل العناصر والبيانات المتأثرة:', 'Affected items & data scope:')}
            </span>
            <ul className="space-y-1 text-xs text-[#063B44]">
              {pending.affectedDetails.map((detail, idx) => (
                <li key={idx} className="leading-relaxed">
                  • {detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#063B44] text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {t('إلغاء', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void pending.onConfirm()}
            className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#007C8D] hover:bg-[#005866]'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {busy ? t('جاري التنفيذ...', 'Processing...') : pending.confirmButtonText}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
