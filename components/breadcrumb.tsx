import Link from 'next/link'

export function Breadcrumb({ heroName }: { heroName: string }) {
  return (
    <nav className="absolute top-6 left-6 md:top-8 md:left-16 z-10 text-[12px] uppercase tracking-[0.25em] font-bold">
      <Link
        href="/"
        className="text-white/80 hover:text-white transition-colors bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full"
      >
        ← Roster
      </Link>
    </nav>
  )
}
