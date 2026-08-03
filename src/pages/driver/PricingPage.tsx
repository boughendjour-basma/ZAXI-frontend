import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DollarSign } from 'lucide-react';

export default function DriverPricingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Pricing Configuration</h1>
      <Card>
        <EmptyState
          icon={<DollarSign />}
          title="Fare Calculator & Pricing Rules"
          description="Configure base fares, per-km rates, and per-minute rates for estimate calculations."
        />
      </Card>
    </div>
  );
}
