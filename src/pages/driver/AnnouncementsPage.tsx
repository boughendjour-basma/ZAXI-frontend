import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Megaphone } from 'lucide-react';

export default function DriverAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Announcements</h1>
      <Card>
        <EmptyState
          icon={<Megaphone />}
          title="Platform Announcements"
          description="Broadcast notices, availability hours, and news to customers."
        />
      </Card>
    </div>
  );
}
