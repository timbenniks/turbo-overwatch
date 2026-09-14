import heroAssets from './data/hero-assets.json'

type HeroAsset = { hero: string; url: string }

const assetMap = new Map<string, string>(
  (heroAssets as HeroAsset[]).map((entry) => [entry.hero, entry.url])
)

export function getHeroPortrait(key: string): string | null {
  return assetMap.get(key) ?? null
}

export function getAllHeroKeys(): string[] {
  return Array.from(assetMap.keys())
}

// Hero webms live in Vercel Blob, not public/, so a daily snapshot deploy does
// not re-ship 86MB of immutable video. Only some heroes have one; the rest 404
// and HeroBackdrop falls back to getHeroPortrait.
export const HERO_VIDEO_BASE =
  'https://8ufrlyflqyutmtqs.public.blob.vercel-storage.com/heros'
