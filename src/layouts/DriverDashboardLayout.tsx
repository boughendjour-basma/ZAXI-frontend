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
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { to: '/driver/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { to: '/driver/today', label: "Today's Rides", icon: <Car className="h-5 w-5" /> },
  { to: '/driver/history', label: 'Ride History', icon: <History className="h-5 w-5" /> },
  { to: '/driver/customers', label: 'Customers', icon: <Users className="h-5 w-5" /> },
  { to: '/driver/announcements', label: 'Announcements', icon: <Megaphone className="h-5 w-5" /> },
  { to: '/driver/pricing', label: 'Pricing', icon: <DollarSign className="h-5 w-5" /> },
  { to: '/driver/statistics', label: 'Statistics', icon: <BarChart3 className="h-5 w-5" /> },
  { to: '/driver/audit-logs', label: 'Audit Logs', icon: <ScrollText className="h-5 w-5" /> },
  { to: '/driver/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-lg">Z</span>
        </div>
        <div>
          <div className="font-black text-slate-900 dark:text-white leading-tight">ZAXI</div>
          <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wide">Driver Panel</div>
        </div>
      </div>

      {/* Driver profile mini */}
      <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3">
          <Avatar name={user?.name} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user?.name ?? 'Driver'}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.phone}</p>
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
                  ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
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
      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <ThemeToggle className="w-full justify-start px-3 py-2.5 gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-2xl" />
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function DriverDashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 sticky top-0 h-screen overflow-hidden">
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
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl lg:hidden overflow-y-auto"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">Z</span>
            </div>
            <span className="font-black text-slate-900 dark:text-white text-sm">ZAXI Driver</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
