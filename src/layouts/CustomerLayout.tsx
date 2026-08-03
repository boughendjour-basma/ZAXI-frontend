import { Outlet, NavLink } from 'react-router-dom';
import { Home, Clock, Bell, User } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Avatar } from '@/components/ui/Avatar';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

export function CustomerLayout() {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 max-w-md mx-auto relative">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">Z</span>
          </div>
          <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight">ZAXI</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Avatar name={user?.name} size="sm" />
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800"
        aria-label="Customer navigation"
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 relative',
                  isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400',
                )
              }
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'relative p-1.5 rounded-xl transition-all duration-200',
                    isActive && 'bg-teal-50 dark:bg-teal-950',
                  )}>
                    <Icon className="h-5 w-5" />
                    {label === 'Alerts' && unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold">{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
