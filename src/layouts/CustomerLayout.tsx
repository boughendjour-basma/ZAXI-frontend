import { useState, type ReactNode } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Clock, Bell, User, LogOut, Menu, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/hooks/useAuth';
import { DriverService } from '@/services/driver.service';
import { useTranslation } from '@/store/languageStore';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import logoUrl from '@/assets/logo.png';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  badge?: number;
}

export function CustomerLayout() {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, isRTL } = useTranslation();

  // ── Driver availability (poll every 30s) ─────────────────────────────────
  const { data: driverProfileRes } = useQuery({
    queryKey: ['publicDriverProfile'],
    queryFn: () => DriverService.getPublicProfile(),
    refetchInterval: 30_000,
    staleTime: 0,
  });
  const rawDriver = driverProfileRes?.data?.data?.driver ?? (driverProfileRes?.data as any);
  const driverIsOnline: boolean = rawDriver?.isOnline === true;

  const navItems: NavItem[] = [
    { to: '/', label: t.nav.home, icon: <Home className="h-5 w-5" />, end: true },
    { to: '/history', label: t.nav.rides, icon: <Clock className="h-5 w-5" /> },
    {
      to: '/notifications',
      label: t.nav.notifications,
      icon: <Bell className="h-5 w-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { to: '/profile', label: t.nav.profile, icon: <User className="h-5 w-5" /> },
  ];

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex flex-col h-full bg-white text-start">
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#FFE0A0]">
          <img src={logoUrl} alt="ZAXI" className="h-9 w-auto object-contain" />
          <span className="text-[10px] text-[#FF9900] font-bold uppercase tracking-wide bg-[#FFF3D6] px-2 py-0.5 rounded-full border border-[#FFE0A0]">
            {t.nav.clientTag}
          </span>
        </div>

        {/* Customer profile mini */}
        <div className="px-4 py-4 border-b border-[#FFE0A0]">
          <div className="flex items-center gap-3 bg-[#FFFBF0] rounded-2xl p-3 border border-[#FFE0A0]">
            {/* Avatar initials */}
            <div className="w-10 h-10 rounded-full bg-[#FF9900] flex items-center justify-center text-black font-bold text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? 'C'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                {user?.name ?? t.header.client}
              </p>
              <p className="text-xs text-[#888] truncate">{user?.phone}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Customer navigation">
          {navItems.map(({ to, label, icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-[#FF9900] text-black font-bold shadow-md'
                    : 'text-[#555] hover:bg-[#FFFBF0] hover:text-[#1A1A1A]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('shrink-0 relative', !isActive && 'group-hover:scale-110 transition-transform')}>
                    {icon}
                    {badge !== undefined && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className={cn('h-4 w-4 opacity-60', isRTL && 'rotate-180')} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer: Language Switcher above Logout */}
        <div className="px-3 py-3 border-t border-[#FFE0A0] space-y-2">
          {/* Language Switcher Button */}
          <LanguageSelector />

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all duration-200 cursor-pointer"
          >
            <LogOut className={cn('h-5 w-5', isRTL && 'rotate-180')} />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#FFFBF0]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-[#FFE0A0] sticky top-0 h-screen overflow-hidden shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl lg:hidden overflow-y-auto border-r border-[#FFE0A0]"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── App Header — solid orange, curved bottom corners ──────────────────── */}
        <header className="sticky top-0 z-30 bg-[#FF9900] rounded-b-2xl shadow-md border-b border-[#FF8800]">
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3.5 max-w-2xl mx-auto">
            {/* Left: Hamburger + Title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-1.5 -ml-1 rounded-xl hover:bg-black/10 transition-colors text-slate-950 shrink-0"
                aria-label="Open navigation"
              >
                <Menu className="h-6 w-6 text-slate-950" />
              </button>

              <h1
                className="text-lg sm:text-xl font-black text-slate-950 tracking-normal leading-tight text-left truncate"
                style={{ fontFamily: "'Libre Bodoni', Georgia, serif" }}
              >
                {t.header.welcome}&nbsp;{user?.name || t.header.client}
              </h1>
            </div>

            {/* Right: Availability Status Pill */}
            <div className="flex items-center shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E57E00]/40 border border-[#E57E00]/20 shadow-xs">
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full shrink-0',
                    driverIsOnline ? 'bg-[#34C759]' : 'bg-[#FF3B30]'
                  )}
                />
                <span className="text-xs sm:text-[13px] font-bold text-slate-950 tracking-tight select-none">
                  {driverIsOnline ? t.header.available : t.header.unavailable}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
