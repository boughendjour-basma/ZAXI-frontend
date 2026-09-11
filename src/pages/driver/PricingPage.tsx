import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { useTranslation } from '@/store/languageStore';
import { Save, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverPricingPage() {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();

  const [cityFlatFare, setCityFlatFare] = useState<number>(300);
  const [outsideRatePerKm, setOutsideRatePerKm] = useState<number>(45);

  const { data: pricingRes, isLoading } = useQuery({
    queryKey: ['driverPricing'],
    queryFn: () => DriverService.getPricing(),
  });

  useEffect(() => {
    const raw = pricingRes?.data?.data ?? pricingRes?.data;
    const data = raw as any;
    if (data) {
      if (data.cityFlatFare !== undefined) setCityFlatFare(data.cityFlatFare);
      if (data.outsideRatePerKm !== undefined) setOutsideRatePerKm(data.outsideRatePerKm);
    }
  }, [pricingRes]);

  const updatePricingMutation = useMutation({
    mutationFn: (data: { cityFlatFare: number; outsideRatePerKm: number }) =>
      DriverService.updatePricing(data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تحديث جدول الأسعار بنجاح !' : 'Grille tarifaire mise à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['driverPricing'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء تحديث الأسعار.' : 'Erreur lors de la mise à jour des tarifs.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricingMutation.mutate({
      cityFlatFare,
      outsideRatePerKm,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 px-5 max-w-lg mx-auto space-y-5 text-start">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {t.driver.pricing.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {t.driver.pricing.subtitle}
        </p>
      </div>

      {isLoading && (
        <div className="p-6 bg-white rounded-[22px] border border-slate-100 animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      )}

      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-5 bg-white rounded-[22px] border border-slate-100 space-y-4 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {language === 'ar' ? 'جدول الأسعار (د.ج)' : 'Grille Tarifaire (DZD)'}
            </h3>

            <div className="space-y-4">
              {/* Flat city fare */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t.driver.pricing.cityFlatFare}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={cityFlatFare}
                    onChange={(e) => setCityFlatFare(Number(e.target.value))}
                    className="w-full text-xs p-3 pr-12 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">{t.common.currency}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'ar' ? 'سعر ثابت لجميع الرحلات داخل المدينة.' : 'Prix fixe pour toutes les courses intra-muros.'}
                </p>
              </div>

              {/* Per km rate */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t.driver.pricing.outsideRateKm}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={outsideRatePerKm}
                    onChange={(e) => setOutsideRatePerKm(Number(e.target.value))}
                    className="w-full text-xs p-3 pr-16 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-900 font-bold outline-none focus:border-[#FF9900] focus:bg-white"
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">{t.common.currency} / {t.common.kilometers}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'ar' ? 'يتم حسابه تلقائياً بناءً على مسافة GPS.' : 'Calculé automatiquement selon la distance GPS.'}
                </p>
              </div>
            </div>

            {/* Info notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs text-slate-700 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#FF9900]" />
              <span className="font-medium text-[11px]">
                {language === 'ar'
                  ? 'يقوم نظام الحساب في ZAXI بتطبيق التسعيرة الحضرية تلقائياً إذا كانت الرحلة داخل برج بوعريريج، أو تسعيرة الكيلومتر إذا كانت الوجهة خارج المدينة.'
                  : 'Le moteur de calcul ZAXI applique automatiquement le Tarif Urbain si le trajet reste dans Bordj Bou Arréridj, ou le Tarif au Kilomètre si la destination est hors-ville.'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={updatePricingMutation.isPending}
            className="w-full py-3.5 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            {updatePricingMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t.driver.pricing.savePricing}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
