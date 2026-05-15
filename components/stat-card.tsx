type Props = {
  label?: string
  value: string
  unit?: string
  subtitle?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, unit, subtitle, className = '' }: Props) {
  return (
    <div className={`bg-surface-card border border-border-default rounded-2xl p-5 md:p-6 ${className}`}>
      {label && (
        <div className="text-[11px] uppercase tracking-[0.2em] text-text-tertiary mb-3 font-bold">
          {label}
        </div>
      )}
      <div className="text-[40px] md:text-[48px] font-black leading-none tracking-tight text-text-primary">
        {value}
        {unit && <span className="text-text-tertiary text-[24px] md:text-[28px] ml-1">{unit}</span>}
      </div>
      {subtitle && <div className="mt-3 text-[12px] text-text-secondary uppercase tracking-widest font-bold">{subtitle}</div>}
    </div>
  )
}
