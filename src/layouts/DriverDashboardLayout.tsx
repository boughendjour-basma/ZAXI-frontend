import { useState, type ReactNode } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import {
  LayoutDashboard,
  Car,
  History,
  Users,
  Megaphone,
  DollarSign,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import logoUrl from '@/assets/logo.png';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { to: '/driver/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="h-5 w-5" /> },
  { to: '/driver/today', label: "Aujourd'hui", icon: <Car className="h-5 w-5" /> },
  { to: '/driver/history', label: 'Historique', icon: <History className="h-5 w-5" /> },
  { to: '/driver/customers', label: 'Clients', icon: <Users className="h-5 w-5" /> },
  { to: '/driver/pricing', label: 'Tarification', icon: <DollarSign className="h-5 w-5" /> },
  { to: '/driver/announcements', label: 'Annonces', icon: <Megaphone className="h-5 w-5" /> },
  { to: '/driver/statistics', label: 'Statistiques', icon: <BarChart3 className="h-5 w-5" /> },
  { to: '/driver/audit-logs', label: "Logs d'audit", icon: <ScrollText className="h-5 w-5" /> },
  { to: '/driver/settings', label: 'Paramètres', icon: <Settings className="h-5 w-5" /> },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#FFE0A0]">
        <img src={logoUrl} alt="ZAXI" className="h-9 w-auto object-contain" />
        <span className="text-[10px] text-[#FF9900] font-bold uppercase tracking-wide bg-[#FFF3D6] px-2 py-0.5 rounded-full border border-[#FFE0A0]">
          Driver
        </span>
      </div>

      {/* Driver profile mini */}
      <div className="px-4 py-4 border-b border-[#FFE0A0]">
        <div className="flex items-center gap-3 bg-[#FFFBF0] rounded-2xl p-3 border border-[#FFE0A0]">
          <Avatar name={user?.name} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A1A] truncate">
              {user?.name ?? 'Driver'}
            </p>
            <p className="text-xs text-[#888] truncate">{user?.phone}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Driver navigation">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/driver/dashboard'}
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
                <span className={cn('shrink-0', !isActive && 'group-hover:scale-110 transition-transform')}>{icon}</span>
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

export function DriverDashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: profileRes } = useQuery({
    queryKey: ['driverProfileAvailability'],
    queryFn: () => DriverService.getProfile(),
    staleTime: 0,
  });

  const rawDriver = (profileRes?.data?.data as any)?.driver ?? (profileRes?.data?.data as any) ?? profileRes?.data;
  const driverIsOnline: boolean = rawDriver?.isOnline === true;

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
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA]">
        {/* ── App Header — solid orange, curved bottom corners matching client profile ──────────────────── */}
        <header className="sticky top-0 z-30 bg-[#FF9900] rounded-b-2xl shadow-md border-b border-[#FF8800]">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 max-w-2xl mx-auto">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-2xl hover:bg-slate-900/10 transition-colors text-slate-950"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <h1
                className="text-xl font-black text-slate-950 tracking-normal leading-tight text-left"
                style={{ fontFamily: "'Libre Bodoni', Georgia, serif" }}
              >
                Bienvenue&nbsp;{user?.name || 'Chauffeur'}
              </h1>
            </div>

            {/* Spacer */}
            <div className="flex-1" />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#F8F9FA]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
