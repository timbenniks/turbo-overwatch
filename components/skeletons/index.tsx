function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-surface-card animate-pulse rounded-2xl ${className}`} />
}

export function RoleStripeSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <Pulse key={i} className="h-36" />
      ))}
    </div>
  )
}

export function MostPlayedSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
        <Pulse key={i} className="aspect-3/4" />
      ))}
    </div>
  )
}

export function RosterTableSkeleton() {
  return (
    <div className="bg-surface-card border border-border-default rounded-2xl divide-y divide-border-default">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Pulse key={i} className="h-16 rounded-none" />
      ))}
    </div>
  )
}

export function HeroBannerSkeleton() {
  return <Pulse className="h-[70vh] min-h-130 rounded-none" />
}

export function CareerOverviewSkeleton() {
  return <Pulse className="h-36" />
}

export function CareerDetailSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <Pulse className="h-32" />
        <Pulse className="h-24" />
        <Pulse className="h-24" />
      </div>
      <div className="space-y-3">
        <Pulse className="h-32" />
        <Pulse className="h-24" />
      </div>
    </div>
  )
}

export function BestMomentsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <Pulse key={i} className="h-40" />
      ))}
    </div>
  )
}
