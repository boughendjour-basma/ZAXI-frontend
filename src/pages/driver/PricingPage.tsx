import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import type { DriverPricing } from '@/services/driver.service';
import { DollarSign, Save, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverPricingPage() {
  const queryClient = useQueryClient();

  const { data: pricingRes, isLoading } = useQuery({
    queryKey: ['driverPricingSettings'],
    queryFn: () => DriverService.getPricing(),
  });

  const rawData = pricingRes?.data?.data ?? (pricingRes?.data as any) ?? {};
  const pricingData: DriverPricing = {
    baseFare: rawData.baseFare ?? 150,
    perKmRate: rawData.perKmRate ?? 40,
    perMinuteRate: rawData.perMinuteRate ?? 5,
    minimumFare: rawData.minimumFare ?? 150,
    currency: rawData.currency ?? 'DZD',
  };

  const [baseFare, setBaseFare] = useState<number>(150);
  const [perKmRate, setPerKmRate] = useState<number>(40);
  const [minimumFare, setMinimumFare] = useState<number>(150);

  useEffect(() => {
    if (pricingData) {
      setBaseFare(pricingData.baseFare);
      setPerKmRate(pricingData.perKmRate);
      setMinimumFare(pricingData.minimumFare);
    }
  }, [pricingRes]);

  const updatePricingMutation = useMutation({
    mutationFn: (data: Partial<DriverPricing>) => DriverService.updatePricing(data),
    onSuccess: () => {
      toast.success('Grille tarifaire mise à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['driverPricingSettings'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erreur lors de la mise à jour des tarifs.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (baseFare <= 0 || perKmRate <= 0 || minimumFare <= 0) {
      toast.error('Les montants doivent être supérieurs à 0 DA.');
      return;
    }

    updatePricingMutation.mutate({
      baseFare,
      perKmRate,
      minimumFare,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
          Configuration des Tarifs
        </h1>
        <p className="text-xs text-[#888] mt-0.5">
          Définissez le tarif urbain forfaitaire et le tarif au kilomètre hors-ville
        </p>
      </div>

      {isLoading && (
        <div className="p-6 bg-white rounded-3xl animate-pulse space-y-4">
          <div className="h-6 bg-[#F5F5F5] rounded w-1/3" />
          <div className="h-4 bg-white rounded w-2/3" />
        </div>
      )}

      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-[#FFE0A0] space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#FF9900]" /> Grille Tarifaire (DZD)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Flat city fare */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">
                  Tarif Urbain Forfaitaire (BBA ville)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={baseFare}
                    onChange={(e) => setBaseFare(Number(e.target.value))}
                    className="w-full text-xs p-3 pr-12 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[#888]">DA</span>
                </div>
                <p className="text-[10px] text-[#888] font-medium">Prix fixe pour toutes les courses intra-muros.</p>
              </div>

              {/* Per km rate */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">
                  Tarif Hors-Ville (par km)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={perKmRate}
                    onChange={(e) => setPerKmRate(Number(e.target.value))}
                    className="w-full text-xs p-3 pr-12 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[#888]">DA / km</span>
                </div>
                <p className="text-[10px] text-[#888] font-medium">Calculé automatiquement selon la distance GPS.</p>
              </div>

              {/* Minimum fare */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888]">
                  Tarif Minimum par Course
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={minimumFare}
                    onChange={(e) => setMinimumFare(Number(e.target.value))}
                    className="w-full text-xs p-3 pr-12 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-[#888]">DA</span>
                </div>
              </div>
            </div>

            {/* Info notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-xs text-[#1A1A1A] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#FF9900]" />
              <span>
                Le moteur de calcul geofencing ZAXI applique automatiquement le Tarif Urbain si le trajet reste dans Bordj Bou Arréridj, ou le Tarif au Kilomètre si la destination est hors-ville.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={updatePricingMutation.isPending}
            className="w-full py-3.5 bg-[#FF9900] text-black font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {updatePricingMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Enregistrer la grille tarifaire
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
