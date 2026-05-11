const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-700 rounded ${className}`} />
);

export const SkeletonCard = () => (
  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-3">
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
    <div className="flex justify-between pt-2">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-1.5 w-full mt-2" />
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
    <Skeleton className="h-4 w-4 rounded-full" />
    <Skeleton className="h-4 flex-1" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-24" />
  </div>
);

export const SkeletonStatCard = () => (
  <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-6">
    <div className="flex justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
  </div>
);

export default Skeleton;
