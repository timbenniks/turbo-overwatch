import Image from 'next/image'
import { SectionHeader } from '@/components/section-header'
import { Heart, Shield, User, Bolt } from '@/components/icons'
import type { Hero, Role } from '@/types/overfast'

const ROLE_COLOR: Record<Role, string> = {
  tank: 'text-role-tank',
  damage: 'text-role-damage',
  support: 'text-role-support',
}

export function HeroIdentityCard({ hero }: { hero: Hero }) {
  const hp = hero.hitpoints

  return (
    <section>
      <SectionHeader icon={<User size={22} />}>Hero profile</SectionHeader>

      <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {hero.portrait && (
            <div className="relative aspect-square md:aspect-auto bg-surface-card-active">
              <Image
                src={hero.portrait}
                alt={hero.name}
                fill
                sizes="(max-width: 768px) 100vw, 280px"
                quality={100}
                className="object-cover"
              />
            </div>
          )}

          <div className="p-4 md:p-8 flex flex-col gap-6">
            <div>
              <div className={`text-[12px] uppercase tracking-[0.25em] font-black ${ROLE_COLOR[hero.role]}`}>
                {hero.role}
                {hero.subrole && (
                  <span className="text-text-tertiary"> · {hero.subrole}</span>
                )}
              </div>
              {hero.description && (
                <p className="text-[14px] md:text-[15px] text-text-secondary mt-3 leading-relaxed">
                  {hero.description}
                </p>
              )}
            </div>

            {hp && (
              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold mb-3">
                  <Heart size={14} />
                  <span>Hitpoints</span>
                </div>
                <div className="grid grid-cols-4 gap-2 md:gap-3">
                  <HpCell label="Health" value={hp.health} color="#a3e635" icon={<Heart size={12} />} />
                  <HpCell label="Armor" value={hp.armor} color="#fb923c" icon={<Shield size={12} />} />
                  <HpCell label="Shields" value={hp.shields} color="#67e8f9" icon={<Shield size={12} />} />
                  <HpCell label="Total" value={hp.total} color="#ffffff" icon={<Bolt size={12} />} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function HpCell({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-text-tertiary font-bold mb-1">
        <span style={{ color }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div
        className="text-[18px] md:text-[28px] font-black leading-none tracking-tight"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  )
}

