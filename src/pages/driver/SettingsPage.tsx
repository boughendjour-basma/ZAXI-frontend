import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Settings, LogOut } from 'lucide-react';

export default function DriverSettingsPage() {
  const { logout } = useAuth();

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Settings</h1>

      <Card className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-teal-500" /> Account & Security
        </h2>
        <p className="text-xs text-slate-400">
          Manage your driver profile, vehicle details, and security preferences.
        </p>

        <Button
          variant="danger"
          fullWidth
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={logout}
        >
          Sign Out of Driver Admin
        </Button>
      </Card>
    </div>
  );
}
