import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { useTranslation } from '@/store/languageStore';
import { ScrollText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AuditLogItem {
  id: string;
  action: string;
  entityType?: string;
  details?: any;
  createdAt: string;
}

function formatLocalizedDate(dateStr: string, lang: string = 'fr') {
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
      day: '2-digit',
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
  const { t, language, isRTL } = useTranslation();

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
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 px-5 max-w-lg mx-auto space-y-5 text-start">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {t.driver.auditLogs.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {t.driver.auditLogs.subtitle}
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-4 bg-white rounded-[22px] border border-slate-100 animate-pulse space-y-2"
            >
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
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
      {!isLoading && !isError && logs.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-[22px] border border-slate-100 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-[#FF9900]">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              {t.driver.auditLogs.noLogs}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">
              {t.driver.auditLogs.noLogsDesc}
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
                className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-xs space-y-2 text-start"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-[#FF9900] border border-amber-100 font-mono">
                      {log.action}
                    </span>
                    {log.entityType && (
                      <span className="text-[10px] text-slate-400 font-bold">
                        [{log.entityType}]
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatLocalizedDate(log.createdAt, language)}
                  </span>
                </div>

                {log.details && (
                  <pre className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl font-mono overflow-x-auto border border-slate-100 text-left">
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
                className="px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1 bg-white cursor-pointer"
              >
                <ChevronLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} /> {language === 'ar' ? 'السابق' : 'Précédent'}
              </button>
              <span className="text-slate-400 font-bold">
                {language === 'ar' ? `صفحة ${page} من ${pagination.totalPages}` : `Page ${page} / ${pagination.totalPages}`}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1 bg-white cursor-pointer"
              >
                {language === 'ar' ? 'التالي' : 'Suivant'} <ChevronRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
