import { useState, type ReactNode } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
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
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#FFE0A0]">
        <div className="w-9 h-9 rounded-xl bg-[#FF9900] flex items-center justify-center shadow-sm">
          <span className="text-black font-black text-lg">Z</span>
        </div>
        <div>
          <div className="font-black text-[#1A1A1A] leading-tight">ZAXI</div>
          <div className="text-[10px] text-[#FF9900] font-bold uppercase tracking-wide">Driver Panel</div>
        </div>
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-[#FFE0A0] shadow-sm lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-[#FFF3D6] transition-colors text-[#555]"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF9900] flex items-center justify-center shadow-sm">
              <span className="text-black font-black text-xs">Z</span>
            </div>
            <span className="font-black text-[#1A1A1A] text-sm">ZAXI Driver</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
