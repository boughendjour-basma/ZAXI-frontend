import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Car } from 'lucide-react';

export default function DriverTodayRidesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Today's Rides</h1>
      <Card>
        <EmptyState
          icon={<Car />}
          title="No rides scheduled for today"
          description="New booking requests accepted today will be displayed here."
        />
      </Card>
    </div>
  );
}
