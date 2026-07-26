export type Role = 'tank' | 'damage' | 'support'
export type Platform = 'pc' | 'console'
export type Gamemode = 'quickplay' | 'competitive'

export type Rank = {
  division: string
  tier: number
  role_icon: string
  rank_icon: string
  tier_icon: string
}

export type CompetitivePlatform = {
  season: number
  tank: Rank | null
  damage: Rank | null
  support: Rank | null
  open: Rank | null
} | null

export type PlayerSummary = {
  username: string
  avatar: string
  namecard: string | null
  title: string | null
  endorsement: { level: number; frame: string } | null
  competitive: {
    pc: CompetitivePlatform
    console: CompetitivePlatform
  }
  /** Unix seconds. When Blizzard last refreshed the profile — the true age of
   *  every stat on the page. */
  last_updated_at?: number | null
}

export type StatTotals = {
  eliminations: number
  assists: number
  deaths: number
  damage: number
  healing: number
}

export type StatsSummary = {
  games_played: number
  games_won: number
  games_lost: number
  time_played: number
  winrate: number
  kda: number
  total: StatTotals
  average: StatTotals
}

export type PlayerStatsSummary = {
  general: StatsSummary
  roles: {
    tank: StatsSummary
    damage: StatsSummary
    support: StatsSummary
  }
  heroes: Record<string, StatsSummary>
}

export type HeroBackground = {
  sizes: string[]
  url: string
}

export type HeroAbilityVideo = {
  thumbnail?: string
  link?: {
    mp4?: string
    webm?: string
  }
}

export type HeroAbility = {
  name: string
  description: string
  icon?: string
  video?: HeroAbilityVideo
}

export type HeroPerk = {
  name: string
  description: string
  icon?: string
}

export type HeroPerks = {
  minor?: HeroPerk[]
  major?: HeroPerk[]
}

export type HeroStoryChapter = {
  title: string
  content: string
  picture?: string
}

export type HeroStory = {
  summary?: string
  media?: { type?: string; link?: string }
  chapters?: HeroStoryChapter[]
}

export type HeroHitpoints = {
  health: number
  armor: number
  shields: number
  total: number
}

export type Hero = {
  name: string
  description: string
  role: Role
  subrole?: string
  portrait?: string | null
  hitpoints?: HeroHitpoints
  backgrounds: HeroBackground[]
  abilities: HeroAbility[]
  perks?: HeroPerks
  story?: HeroStory
}

export type HeroListItem = {
  key: string
  name: string
  portrait: string | null
  role: Role
}

export type GlobalHeroStat = {
  hero: string
  pickrate: number
  winrate: number
}
