import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '@/services/notification.service';
import type { Notification } from '@/services/notification.service';
import { Bell, CheckCheck, Car, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function formatFrenchDateTime(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
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

export default function CustomerNotificationsPage() {
  const queryClient = useQueryClient();

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
      toast.success('Toutes les notifications ont été marquées comme lues.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="p-4 space-y-5 max-w-md mx-auto">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
            Notifications
          </h1>
          <p className="text-xs text-[#888] mt-0.5">
            Mises à jour et alertes de vos trajets
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1 text-xs font-semibold text-[#FF9900] hover:underline"
          >
            <CheckCheck className="w-4 h-4" /> Tout lire
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 bg-white rounded-2xl border border-[#FFE0A0] animate-pulse flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-[#F5F5F5] shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-[#F5F5F5] rounded w-1/2" />
                <div className="h-3 bg-white rounded w-5/6" />
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
            Impossible de charger vos notifications.
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
      {!isLoading && !isError && notifications.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-[#FFE0A0] space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#FFF3D6] flex items-center justify-center mx-auto text-[#FF9900]">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">
              Toutes vos notifications sont lues
            </h3>
            <p className="text-xs text-[#888] mt-1 max-w-xs mx-auto">
              Vous recevrez des alertes lors de vos réservations et suivis de course.
            </p>
          </div>
        </div>
      )}

      {/* Notification List */}
      {!isLoading && !isError && notifications.length > 0 && (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.read) markReadMutation.mutate(item.id);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                item.read
                  ? 'bg-white border-[#FFE0A0] opacity-80'
                  : 'bg-amber-50/40 border-[#FFE0A0] shadow-xs'
              }`}
            >
              {!item.read && (
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#FF9900] animate-pulse" />
              )}

              <div className="p-2 rounded-xl bg-white shadow-xs shrink-0">
                {getNotificationIcon(item.type)}
              </div>

              <div className="space-y-1 flex-1 pr-4">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-bold ${
                      item.read
                        ? 'text-[#333]'
                        : 'text-[#1A1A1A]'
                    }`}
                  >
                    {item.title}
                  </h4>
                </div>
                <p className="text-xs text-[#555] leading-relaxed">
                  {item.message}
                </p>
                <span className="text-[10px] text-[#888] font-medium block pt-1">
                  {formatFrenchDateTime(item.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
