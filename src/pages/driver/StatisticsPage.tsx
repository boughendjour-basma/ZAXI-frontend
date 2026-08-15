import { useQuery } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import {
  DollarSign,
  TrendingUp,
  Users,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function DriverStatisticsPage() {
  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverStatisticsDetailed'],
    queryFn: () => DriverService.getStatistics(),
  });

  const rawStats = (res?.data?.data as any) ?? (res?.data as any) ?? {};
  const stats = {
    totalRevenue: rawStats.totalRevenue ?? 0,
    dailyRevenue: rawStats.dailyRevenue ?? 0,
    monthlyRevenue: rawStats.monthlyRevenue ?? 0,
    totalRides: rawStats.totalRides ?? 0,
    completedRides: rawStats.completedRides ?? 0,
    cancelledRides: rawStats.cancelledRides ?? 0,
    averageDistanceKm: rawStats.averageDistanceKm ?? 0,
    totalCustomers: rawStats.totalCustomers ?? 0,
    activeCustomers: rawStats.activeCustomers ?? 0,
    averageRating: rawStats.averageRating ?? 5.0,
  };

  const completionRate =
    stats.totalRides > 0
      ? Math.round((stats.completedRides / stats.totalRides) * 100)
      : 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
            Statistiques & Indicateurs Performance
          </h1>
          <p className="text-xs text-[#888] mt-0.5">
            Analyses et métriques globales de l'activité ZAXI
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-4 bg-white rounded-3xl animate-pulse space-y-2">
              <div className="h-4 bg-[#F5F5F5] rounded w-1/2" />
              <div className="h-6 bg-white rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            Impossible de charger les statistiques.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl"
          >
            Réessayer
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-6">
          {/* Revenue Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 flex items-center justify-between bg-[#FF9900] text-black shadow-lg">
              <div>
                <span className="text-xs text-black/80 font-black uppercase tracking-wider">Recette Totale</span>
                <h3 className="text-2xl font-black mt-1">{stats.totalRevenue} DA</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-black" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#888] font-bold uppercase tracking-wider">Recette du Mois</span>
                <h3 className="text-2xl font-black text-[#1A1A1A] mt-1">{stats.monthlyRevenue} DA</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3D6] flex items-center justify-center text-[#FF9900]">
                <TrendingUp className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#888] font-bold uppercase tracking-wider">Recette du Jour</span>
                <h3 className="text-2xl font-black text-[#1A1A1A] mt-1">{stats.dailyRevenue} DA</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3D6] flex items-center justify-center text-[#FF9900]">
                <DollarSign className="w-6 h-6" />
              </div>
            </Card>
          </div>

          {/* Operational Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[#FF9900]">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Courses Réussies</span>
              </div>
              <p className="text-2xl font-black text-[#1A1A1A]">{stats.completedRides}</p>
              <span className="text-[10px] text-[#888] font-medium">Taux de réussite : {completionRate}%</span>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-500">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Courses Annulées</span>
              </div>
              <p className="text-2xl font-black text-[#1A1A1A]">{stats.cancelledRides}</p>
              <span className="text-[10px] text-[#888] font-medium">Sur {stats.totalRides} réservations au total</span>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-xs font-bold uppercase">Satisfaction Clients</span>
              </div>
              <p className="text-2xl font-black text-[#1A1A1A]">{stats.averageRating} / 5</p>
              <span className="text-[10px] text-[#888] font-medium">Basé sur les évaluations clients</span>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-sky-500">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Clients Inscrits</span>
              </div>
              <p className="text-2xl font-black text-[#1A1A1A]">{stats.totalCustomers}</p>
              <span className="text-[10px] text-[#888] font-medium">{stats.activeCustomers} clients actifs</span>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
