import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { Users, Search, Phone, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  totalTrips: number;
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function DriverCustomersPage() {
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverCustomers', page],
    queryFn: () => DriverService.getCustomers({ page, limit: 15 }),
  });

  const rawData = res?.data?.data;
  const customers: CustomerItem[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.customers)
    ? (rawData as any).customers
    : [];

  const pagination = (rawData as any)?.pagination ?? { page: 1, totalPages: 1 };

  // Client-side search filter
  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
          Répertoire des clients
        </h1>
        <p className="text-xs text-[#888] mt-0.5">
          Liste des clients inscrits sur la plateforme ZAXI
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#888] absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Rechercher par nom ou numéro de téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
        />
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-4 bg-white rounded-2xl border border-[#FFE0A0] animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-[#F5F5F5] rounded w-1/3" />
                <div className="h-3 bg-white rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            Impossible de charger le répertoire des clients.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredCustomers.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-[#FFE0A0] space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF3D6] flex items-center justify-center mx-auto text-[#FF9900]">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">
              Aucun client trouvé
            </h3>
            <p className="text-xs text-[#888] mt-1 max-w-xs mx-auto">
              Aucun client ne correspond à votre recherche.
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
                className="p-4 bg-white rounded-2xl border border-[#FFE0A0] shadow-2xs hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF3D6] text-[#FF9900] font-extrabold flex items-center justify-center text-sm">
                    {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#1A1A1A]">
                      {c.name || 'Client ZAXI'}
                    </h4>
                    <p className="text-xs text-[#888] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#FF9900]" /> +213 {c.phone}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-bold text-[#1A1A1A] block">
                    {c.totalTrips ?? 0} courses
                  </span>
                  <span className="text-[10px] text-[#FF9900] font-medium">
                    Compte Actif
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
                className="px-3 py-1.5 rounded-xl border border-[#FFE0A0] disabled:opacity-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Précédent
              </button>
              <span className="text-[#888]">
                Page {page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-xl border border-[#FFE0A0] disabled:opacity-50 flex items-center gap-1"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#FFE0A0] pb-3">
              <h3 className="text-base font-extrabold text-[#1A1A1A]">
                Fiche Client
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-full bg-white text-[#888]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF3D6] text-[#FF9900] font-black flex items-center justify-center mx-auto text-xl">
                {selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <h4 className="text-base font-bold text-[#1A1A1A]">
                {selectedCustomer.name}
              </h4>
            </div>

            <div className="p-3 bg-white rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-[#888]">Téléphone</span>
                <span className="font-bold text-[#1A1A1A]">+213 {selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-[#888]">Inscrit le</span>
                <span className="font-semibold text-[#1A1A1A]">{formatDate(selectedCustomer.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#888]">Nombre de courses</span>
                <span className="font-bold text-[#FF9900]">{selectedCustomer.totalTrips ?? 0}</span>
              </div>
            </div>

            {selectedCustomer.phone && (
              <a
                href={`tel:${selectedCustomer.phone}`}
                className="w-full py-2.5 bg-[#FF9900] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs"
              >
                <Phone className="w-4 h-4" /> Appeler le client (+213 {selectedCustomer.phone})
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
