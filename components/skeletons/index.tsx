function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-surface-card animate-pulse rounded-2xl ${className}`} />
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

export function ChartGridSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <Pulse key={i} className="h-72" />
      ))}
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
