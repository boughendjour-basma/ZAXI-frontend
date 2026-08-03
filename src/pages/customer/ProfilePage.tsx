import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Phone, Shield } from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Profile</h1>

      <Card className="flex flex-col items-center text-center p-6 space-y-3">
        <Avatar name={user?.name} size="xl" />
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {user?.name ?? 'Customer'}
          </h2>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
            <Phone className="h-3.5 w-3.5" /> +213 {user?.phone}
          </p>
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</h3>
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Role</span>
          <span className="font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
            <Shield className="h-4 w-4" /> Customer
          </span>
        </div>
      </Card>

      <Button
        variant="danger"
        fullWidth
        leftIcon={<LogOut className="h-4 w-4" />}
        onClick={logout}
      >
        Sign Out
      </Button>
    </div>
  );
}
