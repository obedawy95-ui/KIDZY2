import React from 'react';
import { ActiveAppTab } from '../types/survey';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';
import { KidzyMonogram } from './KidzyBrandMark';
import {
  ClipboardList,
  Timer,
  HeartHandshake,
  BarChart3,
  Code2,
  Truck,
  Headphones,
  Compass,
  Share2,
  ShieldCheck,
  LogIn,
  UserCheck,
  Globe,
  Smile,
  Megaphone,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveAppTab;
  onTabChange: (tab: ActiveAppTab) => void;
  postVisitCount: number;
  staffSurveyCount: number;
  driversCount?: number;
  csCount?: number;
  opsCount?: number;
  onOpenShareModal: () => void;
  isFirebaseAdminSignedIn: boolean;
  adminEmail?: string | null;
  onOpenAdminLogin: () => void;
  onLogoutAdmin?: () => void;
  isGuestMode?: boolean;
  isLockedGuestLink?: boolean;
  onEnterGuestMode?: () => void;
  onExitGuestMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  postVisitCount,
  staffSurveyCount,
  driversCount = 0,
  csCount = 0,
  opsCount = 0,
  onOpenShareModal,
  isFirebaseAdminSignedIn,
  adminEmail,
  onOpenAdminLogin,
  onLogoutAdmin,
  isGuestMode = false,
  isLockedGuestLink = false,
  onEnterGuestMode,
  onExitGuestMode,
}) => {
  const { t } = useLanguage();
  const isStrictGuest = isGuestMode && !isFirebaseAdminSignedIn;

  const allNavItems: {
    id: ActiveAppTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    adminOnly?: boolean;
  }[] = [
    { id: 'post-visit-log', label: t('مذكرة الزيارة (30ث)', '30s Log'), icon: Timer, badge: postVisitCount },
    { id: 'staff-survey', label: t('استبيان الشخصيات', 'Staff Survey'), icon: ClipboardList, badge: staffSurveyCount },
    { id: 'mother-survey', label: t('استبيان الأمهات', 'Mothers'), icon: HeartHandshake },
    { id: 'drivers-survey', label: t('السائقين', 'Drivers'), icon: Truck, badge: driversCount },
    { id: 'customer-service-survey', label: t('خدمة العملاء', 'Support'), icon: Headphones, badge: csCount },
    { id: 'operations-survey', label: t('العمليات', 'Operations'), icon: Compass, badge: opsCount },
    {
      id: 'analytics',
      label: t('الاستجابات والتحليلات', 'Responses & KPIs'),
      icon: BarChart3,
      badge: postVisitCount + staffSurveyCount + driversCount + csCount + opsCount,
    },
    {
      id: 'digital-kpi',
      label: t('الأداء الرقمي (GA4)', 'Digital (GA4)'),
      icon: Globe,
    },
    {
      id: 'ux-kpi',
      label: t('تجربة المستخدم (UX)', 'UX & Heatmaps'),
      icon: Smile,
    },
    {
      id: 'media-kpi',
      label: t('الميديا والحملات', 'Media KPIs'),
      icon: Megaphone,
    },
    { id: 'gas-studio', label: t('Apps Script', 'Apps Script'), icon: Code2, adminOnly: true },
  ];

  const navItems = isStrictGuest ? allNavItems.filter((item) => !item.adminOnly) : allNavItems;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#BAEBF1] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Single-line Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <KidzyMonogram variant="tile-teal" size={36} />
            <span
              dir="ltr"
              className="text-lg font-extrabold tracking-tight text-[#063B44] font-['Nunito','Plus_Jakarta_Sans',sans-serif] whitespace-nowrap shrink-0"
            >
              kidzy kpi,s
            </span>
          </div>

          {/* Zone 2: Navigation Tabs */}
          <nav
            className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-full"
            aria-label={t('التنقل الرئيسي', 'Main Navigation')}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#007C8D] text-white shadow-xs'
                      : 'text-[#063B44]/80 hover:text-[#063B44] hover:bg-[#BAEBF1]/35'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-[#FEC448]' : 'text-[#007C8D]'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 rounded-full tabular-nums ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#BAEBF1]/60 text-[#063B44]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher variant="subtle" />

            {!isStrictGuest && (
              <button
                type="button"
                onClick={onOpenShareModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#063B44] bg-[#FEF4E3] hover:bg-[#FEC448]/35 border border-[#FEC448]/70 rounded-xl transition shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                title={t('مشاركة الروابط المخصصة للمستلمين', 'Share guest & survey links')}
              >
                <Share2 className="w-3.5 h-3.5 text-[#007C8D] shrink-0" />
                <span className="hidden sm:inline">{t('مشاركة الروابط', 'Share Links')}</span>
              </button>
            )}

            {isFirebaseAdminSignedIn ? (
              onLogoutAdmin && (
                <button
                  type="button"
                  onClick={onLogoutAdmin}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-emerald-700 hover:text-red-700 bg-emerald-50 hover:bg-red-50 border border-emerald-200 hover:border-red-200 rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer"
                  title={adminEmail || t('تسجيل الخروج', 'Sign out')}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">{t('خروج', 'Sign Out')}</span>
                </button>
              )
            ) : isStrictGuest ? (
              !isLockedGuestLink && onExitGuestMode ? (
                <button
                  type="button"
                  onClick={onExitGuestMode}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-[#063B44] bg-[#FEF4E3] hover:bg-[#FEC448]/40 border border-[#FEC448] rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer"
                  title={t('الخروج من معاينة الزائر والعودة لواجهة المشروع', 'Exit guest preview')}
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#007C8D] shrink-0" />
                  <span className="hidden md:inline">{t('إنهاء وضع الزائر', 'Exit Guest')}</span>
                </button>
              ) : (
                <span className="hidden md:inline text-xs font-bold text-[#007C8D] whitespace-nowrap shrink-0">
                  {t('وضع الزائر · بدون تسجيل', 'Guest · No Login')}
                </span>
              )
            ) : (
              <>
                {onEnterGuestMode && (
                  <button
                    type="button"
                    onClick={onEnterGuestMode}
                    className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-[#063B44] bg-white hover:bg-[#FEF4E3] border border-[#FEC448]/80 rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer"
                    title={t('الاستجابة كزائر بدون بريد إلكتروني أو كلمة مرور', 'Respond as guest without email/password')}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#007C8D] shrink-0" />
                    <span className="hidden lg:inline">{t('وضع الزائر', 'Guest Mode')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenAdminLogin}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-[#063B44] bg-[#BAEBF1]/40 hover:bg-[#BAEBF1]/70 border border-[#01AFC5]/45 rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer"
                  title={t('دخول المشرف عبر Google', 'Admin Google Sign-in')}
                >
                  <LogIn className="w-3.5 h-3.5 text-[#007C8D] shrink-0" />
                  <span className="hidden lg:inline">{t('دخول المشرف', 'Admin')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
