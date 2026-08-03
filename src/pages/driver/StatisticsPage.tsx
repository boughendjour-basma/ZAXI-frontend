import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

export default function DriverStatisticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Platform Statistics</h1>
      <Card>
        <EmptyState
          icon={<BarChart3 />}
          title="Revenue & Ride Analytics"
          description="Detailed graphs of earnings, trip counts, peak hours, and customer trends."
        />
      </Card>
    </div>
  );
}
