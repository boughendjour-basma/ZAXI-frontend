import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { ScrollText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export interface AuditLogItem {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
  createdAt: string;
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function DriverAuditLogsPage() {
  const [page, setPage] = useState<number>(1);

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverAuditLogs', page],
    queryFn: () => DriverService.getAuditLogs({ page, limit: 20 }),
  });

  const rawData = res?.data?.data;
  const logs: AuditLogItem[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.logs)
    ? (rawData as any).logs
    : [];

  const pagination = (rawData as any)?.pagination ?? { page: 1, totalPages: 1 };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
          Journal d'Audit Système
        </h1>
        <p className="text-xs text-[#888] mt-0.5">
          Historique immuable des actions de sécurité et modifications plateforme
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-4 bg-white rounded-2xl border border-[#FFE0A0] animate-pulse space-y-2"
            >
              <div className="h-4 bg-[#F5F5F5] rounded w-1/3" />
              <div className="h-3 bg-white rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            Impossible de charger le journal d'audit.
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
      {!isLoading && !isError && logs.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-[#FFE0A0] space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF3D6] flex items-center justify-center mx-auto text-[#FF9900]">
            <ScrollText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">
              Aucune entrée dans le journal
            </h3>
            <p className="text-xs text-[#888] mt-1 max-w-xs mx-auto">
              Les événements système et actions d'administration apparaîtront ici.
            </p>
          </div>
        </div>
      )}

      {/* Logs Table / List */}
      {!isLoading && !isError && logs.length > 0 && (
        <div className="space-y-3">
          <div className="grid gap-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-white rounded-2xl border border-[#FFE0A0] shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#333] font-mono">
                      {log.action}
                    </span>
                    {log.entityType && (
                      <span className="text-[10px] text-[#888] font-medium">
                        [{log.entityType}]
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#888] font-mono">
                    {formatDate(log.createdAt)}
                  </span>
                </div>

                {log.details && (
                  <pre className="text-[11px] text-[#555] bg-white p-2.5 rounded-xl font-mono overflow-x-auto">
                    {typeof log.details === 'object'
                      ? JSON.stringify(log.details, null, 2)
                      : String(log.details)}
                  </pre>
                )}
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
    </div>
  );
}
