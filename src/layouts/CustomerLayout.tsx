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
    { to: '/', label: 'Accueil', icon: <Home className="h-5 w-5" />, end: true },
    { to: '/history', label: 'Mes courses', icon: <Clock className="h-5 w-5" /> },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { to: '/profile', label: 'Profil', icon: <User className="h-5 w-5" /> },
  ];

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#FFE0A0]">
          <img src={logoUrl} alt="ZAXI" className="h-9 w-auto object-contain" />
          <span className="text-[10px] text-[#FF9900] font-bold uppercase tracking-wide bg-[#FFF3D6] px-2 py-0.5 rounded-full border border-[#FFE0A0]">
            Client
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
                {user?.name ?? 'Client'}
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
                  {isActive && <ChevronRight className="h-4 w-4 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[#FFE0A0]">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
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

        {/* ── App Header — yellow, curved bottom corners ──────────────────── */}
        <header
          className="sticky top-0 z-30"
          style={{
            backgroundColor: '#FF9900',
            borderBottomLeftRadius: '28px',
            borderBottomRightRadius: '28px',
            boxShadow: '0 4px 24px rgba(255,153,0,0.25)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px 20px 20px',
            }}
          >
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-black/10 transition-colors text-black"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <img
              src={logoUrl}
              alt="ZAXI"
              className="h-8 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))' }}
            />

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Availability badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: driverIsOnline ? 'rgba(0,0,0,0.13)' : 'rgba(0,0,0,0.08)',
                borderRadius: '30px',
                padding: '6px 12px',
              }}
            >
              {/* Dot */}
              <span style={{ position: 'relative', display: 'inline-flex', width: 9, height: 9, flexShrink: 0 }}>
                {driverIsOnline && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
                      opacity: 0.65,
                    }}
                  />
                )}
                <span
                  style={{
                    position: 'relative',
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    backgroundColor: driverIsOnline ? '#22c55e' : '#ef4444',
                    display: 'inline-block',
                  }}
                />
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#000', whiteSpace: 'nowrap' }}>
                {driverIsOnline ? 'Disponible' : 'Indisponible'}
              </span>
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
