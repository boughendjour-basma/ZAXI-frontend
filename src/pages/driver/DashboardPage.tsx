import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Car, DollarSign, Users, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function DriverDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Welcome, {user?.name ?? 'Driver'}!
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Single-Driver Platform Administration & Live Dispatch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="teal" className="px-3 py-1 text-xs font-bold">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Platform Admin
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Today's Rides</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">0</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Today's Revenue</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">0 DZD</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Registered Customers</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">0</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Completion Rate</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">100%</p>
          </div>
        </Card>
      </div>

      {/* Current Ride & Live Incoming Requests Stub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="h-5 w-5 text-teal-500" /> Current Ride
          </h3>
          <p className="text-sm text-slate-400">No active ride right now. You are ready to accept incoming requests.</p>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" /> Incoming Booking Requests
          </h3>
          <p className="text-sm text-slate-400">Real-time socket listener enabled. Pending requests will appear here instantly.</p>
        </Card>
      </div>
    </div>
  );
}
