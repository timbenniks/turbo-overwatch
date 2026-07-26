'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { getHeroPortrait } from '@/lib/hero-assets'

export function HeroBackdrop({
  heroKey,
  alt,
  className,
  kenBurns = false,
}: {
  heroKey: string
  alt: string
  className: string
  kenBurns?: boolean
}) {
  const portrait = getHeroPortrait(heroKey)
  // Optimistically try the local webm; on 404 / decode error, fall back to the still.
  const [useVideo, setUseVideo] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setUseVideo(true)
    setVideoReady(false)
    setShowLoader(false)
    // Avoid a one-frame loader flash when the webm is already cached.
    const t = window.setTimeout(() => setShowLoader(true), 180)
    return () => window.clearTimeout(t)
  }, [heroKey])

  useEffect(() => {
    if (!useVideo) return
    const el = videoRef.current
    if (!el) return

    const fail = () => setUseVideo(false)
    const ready = () => setVideoReady(true)

    // Fast 404s often fire `error` before React hydrates / attaches onError.
    if (el.error) {
      fail()
      return
    }
    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      ready()
    }

    el.addEventListener('error', fail)
    el.addEventListener('loadeddata', ready)
    return () => {
      el.removeEventListener('error', fail)
      el.removeEventListener('loadeddata', ready)
    }
  }, [heroKey, useVideo])

  const image = portrait ? (
    <Image
      src={portrait}
      alt={alt}
      fill
      priority
      sizes="100vw"
      quality={100}
      className={className}
    />
  ) : null

  return (
    <>
      {useVideo && showLoader && !videoReady && (
        <div
          className="absolute inset-0 bg-surface-card animate-pulse"
          aria-hidden
        />
      )}

      {useVideo ? (
        <video
          ref={videoRef}
          key={heroKey}
          src={`/heros/${heroKey}.webm`}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setUseVideo(false)}
          onLoadedData={() => setVideoReady(true)}
          // Pin to the right edge so cinematic webms (e.g. Mauga) aren't cropped on that side
          className={`absolute inset-y-0 right-0 h-full w-full object-cover object-right transition-opacity duration-500 ${
            videoReady ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label={alt}
        />
      ) : image ? (
        kenBurns ? <div className="absolute inset-0 ken-burns">{image}</div> : image
      ) : null}
    </>
  )
}
