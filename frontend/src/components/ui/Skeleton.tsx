interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  )
}

export function ArrivalRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-slate-700/70">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-5 w-8" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="space-y-1.5 text-right">
        <Skeleton className="ml-auto h-6 w-12" />
        <Skeleton className="ml-auto h-3 w-10" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  )
}

export function ScheduleSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            {i < 5 && <div className="h-8 w-0.5 bg-slate-200 dark:bg-slate-700" />}
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

export function StopSearchSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
