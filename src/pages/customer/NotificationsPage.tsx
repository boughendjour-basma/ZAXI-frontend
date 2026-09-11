import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '@/services/notification.service';
import type { Notification } from '@/services/notification.service';
import { useTranslation } from '@/store/languageStore';
import { Bell, CheckCheck, Car, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

function formatLocalizedDateTime(dateStr: string, lang: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

function getNotificationIcon(type?: string) {
  if (!type) return <Bell className="w-5 h-5 text-[#FF9900]" />;
  if (type.includes('accepted')) return <Car className="w-5 h-5 text-blue-500" />;
  if (type.includes('completed')) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  if (type.includes('cancelled') || type.includes('rejected'))
    return <XCircle className="w-5 h-5 text-rose-500" />;
  return <Bell className="w-5 h-5 text-[#FF9900]" />;
}

/** Resolve localised title/message from the notification type, with fallback to stored text. */
function getLocalizedContent(
  item: { type?: string; title: string; message: string },
  t: import('@/i18n/translations').Translations
) {
  const typeKey = item.type as keyof typeof t.notifications.types | undefined;
  if (typeKey && t.notifications.types[typeKey]) {
    return t.notifications.types[typeKey];
  }
  return { title: item.title, message: item.message };
}

export default function CustomerNotificationsPage() {
  const queryClient = useQueryClient();
  const { t, language, isRTL } = useTranslation();

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => NotificationService.list(),
  });

  const rawData = res?.data?.data;
  const notifications: Notification[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.notifications)
    ? (rawData as any).notifications
    : [];

  const unreadCount =
    (rawData as any)?.unreadCount ?? notifications.filter((n) => !n.read).length;

  // Mark single notification read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => NotificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all notifications read
  const markAllReadMutation = useMutation({
    mutationFn: () => NotificationService.markAllRead(),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تحديد جميع الإشعارات كمقروءة.' : 'Toutes les notifications ont été marquées comme lues.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div
      className="min-h-screen pb-10"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <div className="px-5 pt-7 pb-8 max-w-lg mx-auto space-y-5">
        {/* Title & Actions */}
        <div className="flex items-center justify-between">
          <div className="text-start">
            <h1
              className="text-[22px] font-extrabold tracking-tight text-slate-900"
            >
              {t.notifications.title}
            </h1>
            <p
              className="text-[13px] mt-0.5 text-slate-500"
            >
              {t.notifications.subtitle}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#FF9900]" /> {t.notifications.markAllRead}
            </button>
          )}
        </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 bg-white rounded-3xl border border-slate-200/80 animate-pulse flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-100 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-100 rounded-xl w-1/2" />
                <div className="h-3 bg-slate-100 rounded-xl w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            {t.common.error}
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-2xl hover:bg-rose-700 transition-colors cursor-pointer"
          >
            {t.common.confirm}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && notifications.length === 0 && (
        <div className="py-14 px-6 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-[#FF9900] border border-amber-200/60">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t.notifications.noNotifications}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {t.notifications.noNotificationsDesc}
            </p>
          </div>
        </div>
      )}

      {/* Notification List */}
      {!isLoading && !isError && notifications.length > 0 && (
        <div className="space-y-3 text-start">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.read) markReadMutation.mutate(item.id);
              }}
              className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex items-start gap-3.5 relative ${
                item.read
                  ? 'bg-white border-slate-200/80 opacity-85'
                  : 'bg-amber-50/40 border-amber-200/80 shadow-xs'
              }`}
            >
              {!item.read && (
                <span className={cn('absolute top-4 w-2.5 h-2.5 rounded-full bg-[#FF9900] animate-pulse', isRTL ? 'left-4' : 'right-4')} />
              )}

              <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-xs shrink-0">
                {getNotificationIcon(item.type)}
              </div>

              <div className={cn('space-y-1 flex-1', isRTL ? 'pl-4' : 'pr-4')}>
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-extrabold ${
                      item.read
                        ? 'text-slate-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {getLocalizedContent(item, t).title}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {getLocalizedContent(item, t).message}
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block pt-1">
                  {formatLocalizedDateTime(item.createdAt, language)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
