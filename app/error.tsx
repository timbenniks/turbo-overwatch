'use client'

import { useEffect } from 'react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  if (error.message.includes('Private profile')) {
    return <PrivateProfile />
  }

  if (error.message.includes('OverFast 429') || error.message.includes('429')) {
    return <RateLimited reset={reset} />
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-20 text-center pb-32 md:pb-16">
      <h1 className="text-[40px] md:text-[56px] leading-none">Something went wrong.</h1>
      <p className="text-text-secondary mt-4 wrap-break-word uppercase tracking-widest font-bold text-[13px]">{error.message}</p>
      <button
        onClick={reset}
        className="mt-8 px-6 py-3 bg-text-primary text-surface-canvas rounded-full uppercase tracking-[0.2em] font-bold text-[13px] hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </main>
  )
}

function PrivateProfile() {
  return (
    <main className="max-w-xl mx-auto px-6 py-20 text-center pb-32 md:pb-16">
      <h1 className="text-[36px] md:text-[48px] leading-none">
        This career profile is private.
      </h1>
      <p className="text-text-secondary mt-4 uppercase tracking-widest font-bold text-[13px]">
        Personal stats need a public Overwatch career profile. You can change this from
        the in-game social options menu.
      </p>
    </main>
  )
}

function RateLimited({ reset }: { reset: () => void }) {
  return (
    <main className="max-w-xl mx-auto px-6 py-20 text-center pb-32 md:pb-16">
      <h1 className="text-[32px] md:text-[44px] leading-none">
        Data may be a few minutes stale.
      </h1>
      <p className="text-text-secondary mt-4 uppercase tracking-widest font-bold text-[13px]">
        The OverFast API is busy right now. We&apos;ll retry shortly.
      </p>
      <button
        onClick={reset}
        className="mt-8 px-6 py-3 border-2 border-border-strong rounded-full uppercase tracking-[0.2em] font-bold text-[13px] hover:bg-surface-card-active transition-colors"
      >
        Retry now
      </button>
    </main>
  )
}
