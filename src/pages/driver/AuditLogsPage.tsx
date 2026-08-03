import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScrollText } from 'lucide-react';

export default function DriverAuditLogsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Audit Logs</h1>
      <Card>
        <EmptyState
          icon={<ScrollText />}
          title="System Audit Trail"
          description="Security logs, status updates, and administrative action records."
        />
      </Card>
    </div>
  );
}
