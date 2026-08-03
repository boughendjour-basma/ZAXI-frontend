import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

export default function DriverCustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Customer Management</h1>
      <Card>
        <EmptyState
          icon={<Users />}
          title="Customer Directory"
          description="View and manage all registered customers on ZAXI."
        />
      </Card>
    </div>
  );
}
