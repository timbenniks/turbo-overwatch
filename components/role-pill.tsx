import type { Role } from '@/types/overfast'

const ROLE_STYLES: Record<Role, { border: string; text: string; label: string }> = {
  tank: { border: 'border-l-role-tank', text: 'text-role-tank', label: 'Tank' },
  damage: { border: 'border-l-role-damage', text: 'text-role-damage', label: 'Damage' },
  support: { border: 'border-l-role-support', text: 'text-role-support', label: 'Support' },
}

export function RolePill({ role, division }: { role: Role; division?: string }) {
  const style = ROLE_STYLES[role]
  return (
    <div
      className={`bg-surface-card border border-border-default ${style.border} border-l-[3px] rounded px-3 py-2`}
    >
      <div className="text-[11px] uppercase tracking-[0.15em] text-text-tertiary">
        {style.label}
      </div>
      <div className={`font-medium ${style.text}`}>{division ?? '—'}</div>
    </div>
  )
}
