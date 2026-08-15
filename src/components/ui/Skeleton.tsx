import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className, rounded = 'lg' }: SkeletonProps) {
  const roundedMap = {
    sm: 'rounded',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-[#F5F5F5]',
        roundedMap[rounded],
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-[#FFE0A0]">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10" rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}
