import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { useTranslation } from '@/store/languageStore';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt?: string;
  totalTrips?: number;
}

export default function DriverCustomersPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const { t, language, isRTL } = useTranslation();

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverCustomers', page],
    queryFn: () => DriverService.getCustomers({ page, limit: 20 }),
  });

  const rawData = res?.data?.data;
  const customers: CustomerItem[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.customers)
    ? (rawData as any).customers
    : [];

  const pagination = (rawData as any)?.pagination ?? { page: 1, totalPages: 1 };

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 px-5 max-w-lg mx-auto space-y-5 text-start">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {t.driver.customers.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {t.driver.customers.subtitle}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className={cn('w-4 h-4 text-slate-400 absolute top-3.5', isRTL ? 'right-3.5' : 'left-3.5')} />
        <input
          type="text"
          placeholder={t.driver.customers.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'w-full text-xs py-3 rounded-2xl border border-slate-100 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#FF9900] shadow-xs',
            isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
          )}
        />
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-4 bg-white rounded-[22px] border border-slate-100 animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            {t.common.error}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            {t.common.confirm}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredCustomers.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-[22px] border border-slate-100 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-[#FF9900]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              {t.driver.customers.noCustomers}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">
              {language === 'ar' ? 'لا يوجد زبائن يطابقون بحثك.' : 'Aucun client ne correspond à votre recherche.'}
            </p>
          </div>
        </div>
      )}

      {/* Customers List */}
      {!isLoading && !isError && filteredCustomers.length > 0 && (
        <div className="space-y-3">
          <div className="grid gap-2.5">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-xs hover:border-[#FF9900] transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#FF9900] font-black flex items-center justify-center text-sm shrink-0">
                    {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      {c.name || t.header.client}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#FF9900]" /> {c.phone}
                    </p>
                  </div>
                </div>

                <div className="text-end text-xs shrink-0">
                  <span className="font-extrabold text-slate-900 block">
                    {c.totalTrips ?? 0} {t.profile.totalRides}
                  </span>
                  <span className="text-[10px] text-[#FF9900] font-bold">
                    {language === 'ar' ? 'حساب نشط' : 'Compte Actif'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1 bg-white cursor-pointer"
              >
                <ChevronLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} /> {language === 'ar' ? 'السابق' : 'Précédent'}
              </button>
              <span className="text-slate-400 font-bold">
                {language === 'ar' ? `صفحة ${page} من ${pagination.totalPages}` : `Page ${page} / ${pagination.totalPages}`}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1 bg-white cursor-pointer"
              >
                {language === 'ar' ? 'التالي' : 'Suivant'} <ChevronRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-start"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#FF9900] font-black flex items-center justify-center text-base">
                  {selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {selectedCustomer.name || t.header.client}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {language === 'ar' ? 'حساب موثق' : 'Compte Vérifié'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">{t.profile.phone}</span>
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="font-extrabold text-[#FF9900] flex items-center gap-1 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {selectedCustomer.phone}
                  </a>
                </div>

                {selectedCustomer.createdAt && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400 font-bold">{language === 'ar' ? 'تاريخ التسجيل' : 'Inscrit le'}</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(selectedCustomer.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="py-3 px-3 rounded-2xl bg-[#FF9900] text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Phone className="w-4 h-4" /> {t.tracking.call}
                </a>
                <a
                  href={`https://wa.me/${selectedCustomer.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-3 rounded-2xl bg-emerald-500 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
