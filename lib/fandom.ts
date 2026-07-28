import { cacheLife, cacheTag } from 'next/cache'

const FANDOM_API = 'https://overwatch.fandom.com/api.php'

export type HeroicEmote = {
  name: string
  url: string
  mime: string
  wikiUrl: string
}

/**
 * Wiki category titles that don't match OverFast display names 1:1.
 * Most heroes work as `Category:{Name} emotes` with the OverFast name.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  // OverFast may use ASCII forms; Fandom uses diacritics / punctuation as-is.
  Lucio: 'Lúcio',
  Torbjorn: 'Torbjörn',
}

type CategoryMembersResponse = {
  query?: {
    categorymembers?: Array<{ title: string; ns: number }>
  }
}

type ImageInfoResponse = {
  query?: {
    pages?: Record<
      string,
      {
        missing?: string
        imageinfo?: Array<{ url?: string; mime?: string }>
      }
    >
  }
}

function categoryTitleFor(displayName: string): string {
  return CATEGORY_ALIASES[displayName] ?? displayName
}

function emoteDisplayName(fileTitle: string): string {
  // "File:Ana Emote Heroic.webm" → "Heroic"
  const base = fileTitle.replace(/^File:/i, '').replace(/\.[^.]+$/, '')
  const match = base.match(/Emote\s+[-–]?\s*(.+)$/i)
  return (match?.[1] ?? 'Heroic').replace(/[-_]+/g, ' ').trim()
}

async function fandomFetch(params: Record<string, string>): Promise<Response> {
  const url = new URL(FANDOM_API)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('format', 'json')
  return fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
}

/**
 * Resolve the default Heroic emote webm for a hero via Fandom categories.
 * Returns null on any miss/error — callers must fail soft.
 */
export async function getHeroicEmote(
  displayName: string
): Promise<HeroicEmote | null> {
  'use cache'
  cacheLife('days')
  cacheTag('fandom-emotes', `fandom-emote-${displayName}`)

  try {
    const category = `Category:${categoryTitleFor(displayName)} emotes`
    const listRes = await fandomFetch({
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmtype: 'file',
      cmlimit: '50',
    })
    if (!listRes.ok) return null

    const listJson = (await listRes.json()) as CategoryMembersResponse
    const files = listJson.query?.categorymembers ?? []
    const heroic =
      files.find((f) => /heroic/i.test(f.title) && /\.webm$/i.test(f.title)) ??
      files.find((f) => /heroic/i.test(f.title))
    if (!heroic) return null

    const infoRes = await fandomFetch({
      action: 'query',
      titles: heroic.title,
      prop: 'imageinfo',
      iiprop: 'url|mime',
    })
    if (!infoRes.ok) return null

    const infoJson = (await infoRes.json()) as ImageInfoResponse
    const page = Object.values(infoJson.query?.pages ?? {})[0]
    const info = page?.imageinfo?.[0]
    if (!info?.url) return null

    return {
      name: emoteDisplayName(heroic.title),
      url: info.url,
      mime: info.mime ?? 'video/webm',
      wikiUrl: `https://overwatch.fandom.com/wiki/${encodeURIComponent(heroic.title.replace(/ /g, '_'))}`,
    }
  } catch {
    return null
  }
}
