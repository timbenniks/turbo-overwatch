import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto px-6 py-20 text-center pb-32 md:pb-16">
      <h1 className="text-[56px] md:text-[80px] leading-none">Not found.</h1>
      <p className="text-text-secondary mt-4 uppercase tracking-widest font-bold text-[13px]">
        That page doesn&apos;t exist. Try the{' '}
        <Link href="/" className="underline hover:text-text-primary">
          roster
        </Link>
        .
      </p>
    </main>
  )
}
