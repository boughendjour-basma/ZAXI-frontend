import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, Navigation, Car, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function CustomerHomePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Banner */}
      <Card variant="glass" className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-0 shadow-lg shadow-teal-500/20">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> ZAXI Premium
            </span>
            <h2 className="text-xl font-black mt-2">Where to, {user?.name?.split(' ')[0] ?? 'Rider'}?</h2>
            <p className="text-xs text-white/80 mt-1">Book your private ride with instant confirmation.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white shrink-0">
            <Car className="h-6 w-6" />
          </div>
        </div>
      </Card>

      {/* Destination search stub */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <div className="w-3 h-3 rounded-full bg-teal-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Current Location</p>
          </div>
          <MapPin className="h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Destination</p>
            <p className="text-sm font-medium text-slate-400 truncate">Where are you going?</p>
          </div>
          <Navigation className="h-4 w-4 text-teal-500" />
        </div>

        <Button fullWidth size="lg">
          Search Destination (Phase 2)
        </Button>
      </Card>

      <div className="text-center text-xs text-slate-400 py-4">
        Phase 1 Architecture Ready — Booking Flow coming in Phase 2
      </div>
    </div>
  );
}
