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
