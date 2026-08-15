import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Clock, Bell, User } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Avatar } from '@/components/ui/Avatar';

const navItems = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/history', label: 'Mes courses', icon: Clock },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profil', icon: User },
];

export function CustomerLayout() {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-white max-w-md mx-auto relative">
      {/* Top Header */}
      {!isHome && (
        <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 bg-white border-b border-[#FFE0A0] shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF9900] flex items-center justify-center shadow-sm">
              <span className="text-black font-black text-sm">Z</span>
            </div>
            <span className="font-black text-[#1A1A1A] text-lg tracking-tight">ZAXI</span>
          </div>
          <Avatar name={user?.name} size="sm" />
        </header>
      )}

      {/* Page content */}
      <main className="flex-1 overflow-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white border-t border-[#FFE0A0] shadow-lg"
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
                    ? 'text-[#FF9900] font-bold'
                    : 'text-[#999] hover:text-[#555]',
                )
              }
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'relative p-1.5 rounded-xl transition-all duration-200',
                      isActive && 'bg-[#FFF3D6] text-[#FF9900]',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label === 'Notifications' && unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold">{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF9900] rounded-full" />
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
