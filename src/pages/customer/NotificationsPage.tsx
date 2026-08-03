import { EmptyState } from '@/components/ui/EmptyState';
import { Bell } from 'lucide-react';

export default function CustomerNotificationsPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
      <EmptyState
        icon={<Bell />}
        title="All caught up"
        description="You have no unread notifications or ride updates at the moment."
      />
    </div>
  );
}
