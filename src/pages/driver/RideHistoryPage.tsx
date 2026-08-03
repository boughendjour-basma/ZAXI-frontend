import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { History } from 'lucide-react';

export default function DriverRideHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Ride History</h1>
      <Card>
        <EmptyState
          icon={<History />}
          title="No completed rides yet"
          description="Full history of past completed and cancelled rides."
        />
      </Card>
    </div>
  );
}
