import { EmptyState } from '@/components/ui/EmptyState';
import { Clock } from 'lucide-react';

export default function CustomerHistoryPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Ride History</h1>
      <EmptyState
        icon={<Clock />}
        title="No rides yet"
        description="Your completed and past rides will appear here once you take a ride."
      />
    </div>
  );
}
