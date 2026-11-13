import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { ADMIN_EMAIL, auth } from '../firebase';
import { verifyAdminAccess } from '../services/surveyFirestore';
import {
  clearWorkspaceAccessToken,
  createWorkspaceGoogleProvider,
  setWorkspaceAccessToken,
} from '../services/googleWorkspace';
import { useLanguage } from '../context/LanguageContext';
import { KidzyMonogram } from './KidzyBrandMark';
import { ShieldAlert, LogIn, LogOut, X, ShieldCheck, UserCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onContinueAsGuest?: () => void;
  currentUser: User | null;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onContinueAsGuest,
  currentUser,
}) => {
  const { lang, dir, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = createWorkspaceGoogleProvider();
      const result = await signInWithPopup(auth, provider);
      const allowed = await verifyAdminAccess(result.user);
      if (allowed) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          setWorkspaceAccessToken(credential.accessToken);
        }
        onSuccess();
        onClose();
      } else {
        clearWorkspaceAccessToken();
        await signOut(auth);
        setErrorMsg(
          t(
            `الحساب (${result.user.email || 'غير معروف'}) غير مخوّل بصلاحية المشرف. يُسمح فقط لحساب مالك المشروع (${ADMIN_EMAIL}) بالاطلاع على الاستجابات.`,
            `Account (${result.user.email || 'unknown'}) is not authorized as Admin. Only the project owner (${ADMIN_EMAIL}) may view responses.`
          )
        );
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg(t('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.', 'Sign-in window closed before completing authentication.'));
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg(
          t(
            'المتصفح حظر نافذة تسجيل الدخول المنبثقة. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مجددًا.',
            'Pop-up blocked by browser. Please allow pop-ups and try again.'
          )
        );
      } else {
        setErrorMsg(
          t(
            'تعذر تسجيل الدخول عبر Google. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.',
            'Unable to sign in with Google. Check your internet connection and try again.'
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    clearWorkspaceAccessToken();
    await signOut(auth);
    setErrorMsg(null);
  };

  const handleGuestContinue = () => {
    if (onContinueAsGuest) {
      onContinueAsGuest();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#063B44]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir={dir}
    >
      <div
        className={`bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#BAEBF1] space-y-6 ${
          lang === 'en' ? 'text-left' : 'text-right'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <KidzyMonogram variant="tile-teal" size={44} />
            <div>
              <h2 className="text-xl font-bold text-[#063B44]">
                {t('دخول المشرف أو المتابعة كزائر', 'Admin Sign-In or Guest Response')}
              </h2>
              <p className="text-xs text-slate-500">
                {t(
                  'توثيق حساب المالك للتحليلات، أو الإجابة مباشرة كزائر',
                  'Owner verification for analytics, or answer directly as a guest'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#063B44] p-1.5 rounded-xl hover:bg-[#BAEBF1]/30 transition-colors cursor-pointer"
            aria-label={t('إغلاق', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="p-4 bg-[#FEF4E3] rounded-2xl border border-[#FEC448]/60 text-xs text-[#063B44] leading-relaxed space-y-2">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#007C8D] shrink-0" />
            <span>{t('تعبئة الاستبيان متاحة للجميع بدون تسجيل دخول', 'No Account Required to Submit Surveys')}</span>
          </div>
          <p>
            {t(
              `لتعبئة وإرسال أي استبيان لا يُطلب منكِ بريد إلكتروني أو رقم سري — اضغطي «الاستجابة كزائر» أدناه. أما الاطلاع على التحليلات والاستجابات الفردية فمحصور بحساب المشرف (${ADMIN_EMAIL}).`,
              `No email or password is required to fill out and submit surveys — click "Respond as Guest" below. Viewing analytics and individual records is restricted to the project owner (${ADMIN_EMAIL}).`
            )}
          </p>
        </div>

        {currentUser && (
          <div className="p-3 bg-[#F7FAFB] border border-[#BAEBF1] rounded-xl flex items-center justify-between text-xs gap-2">
            <span className="text-[#063B44] truncate">
              {t('الحساب الحالي:', 'Signed in as:')}{' '}
              <strong className="font-mono">{currentUser.email}</strong>
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('تبديل', 'Switch')}</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-1">
          {onContinueAsGuest && (
            <button
              type="button"
              onClick={handleGuestContinue}
              className="w-full py-3.5 px-4 bg-[#FEC448] hover:bg-[#f5b62f] text-[#063B44] font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>
                {t(
                  'الاستجابة كزائر (بدون بريد إلكتروني أو كلمة مرور)',
                  'Continue as Guest (No Email or Password)'
                )}
              </span>
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-4 bg-[#007C8D] hover:bg-[#005866] disabled:opacity-60 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>
              {loading
                ? t('جاري التحقق عبر Google...', 'Verifying with Google...')
                : t('تسجيل الدخول بحساب Google للمشرف فقط', 'Admin Sign-In with Google Only')}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#063B44] font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {t('إلغاء', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
