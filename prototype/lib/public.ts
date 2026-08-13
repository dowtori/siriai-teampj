import { getDb, type Campaign, type Participation, type Brand } from './db'

/* 브랜드 · 인플루언서 화면은 개인 코드로 들어온다.
   로그인이 없고, 코드 하나가 곧 신원이다. */

function short(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
}

export const brandCode = (b: Brand) => short('b' + b.id)
export const creatorCode = (key: string) => short('c' + key)

/* ── 브랜드 ── */

export type BrandView = {
  brand: Brand
  code: string
  campaigns: Campaign[]
  running: Campaign[]
  totals: { selected: number; uploaded: number; reach: number; campaigns: number }
  people: { name: string; handle: string; followers: number | null }[]
  contents: { name: string; url: string; views: number | null }[]
}

export function listBrands(): { brand: Brand; code: string }[] {
  return getDb()
    .brands.filter((b) => b.campaignCount > 0)
    .map((b) => ({ brand: b, code: brandCode(b) }))
}

export function getBrandView(code: string): BrandView | null {
  const db = getDb()
  const brand = db.brands.find((b) => brandCode(b) === code.toUpperCase())
  if (!brand) return null

  const campaigns = db.campaigns
    .filter((c) => c.brandId === brand.id)
    .sort((a, b) => (b.finance.invoiceDate ?? b.month ?? '').localeCompare(a.finance.invoiceDate ?? a.month ?? ''))

  const ids = new Set(campaigns.map((c) => c.id))
  const parts = db.participations.filter((p) => p.campaignId && ids.has(p.campaignId))
  const picked = parts.filter((p) => p.selected)

  const seen = new Set<string>()
  const people = picked
    .filter((p) => p.handleUrl && !seen.has(p.handleUrl) && seen.add(p.handleUrl))
    .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
    .slice(0, 12)
    .map((p) => ({
      name: p.displayName,
      handle: p.handleUrl!.replace('instagram.com/', '@'),
      followers: p.followers,
    }))

  const contents = picked
    .filter((p) => p.contentUrl?.startsWith('http'))
    .slice(0, 10)
    .map((p) => ({ name: p.displayName, url: p.contentUrl!, views: p.estViews }))

  return {
    brand,
    code,
    campaigns,
    running: campaigns.filter((c) => !c.status.includes('완전 종료')),
    totals: {
      campaigns: campaigns.length,
      selected: campaigns.reduce((s, c) => s + (c.counts.selected ?? 0), 0),
      uploaded: campaigns.reduce((s, c) => s + (c.counts.uploaded ?? 0), 0),
      reach: picked.reduce((s, p) => s + (p.estViews ?? 0), 0),
    },
    people,
    contents,
  }
}

/* ── 인플루언서 ── */

export type CreatorView = {
  key: string
  code: string
  name: string
  handle: string | null
  followers: number | null
  joined: {
    campaign: Campaign | null
    part: Participation
    stage: 'selected' | 'shipped' | 'posted' | 'settled'
  }[]
  history: number
  earned: number
}

/** 데모용 — 참여 이력이 많은 사람 순 */
export function listCreators(limit = 6) {
  const db = getDb()
  const by = new Map<string, Participation[]>()
  for (const p of db.participations) {
    if (!p.selected) continue
    const k = p.handleUrl ?? `name:${p.displayName}`
    by.set(k, [...(by.get(k) ?? []), p])
  }
  return [...by.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limit)
    .map(([key, rows]) => ({
      key,
      code: creatorCode(key),
      name: rows[0].displayName,
      handle: rows[0].handleUrl,
      count: rows.length,
    }))
}

export function getCreatorView(code: string): CreatorView | null {
  const db = getDb()
  const by = new Map<string, Participation[]>()
  for (const p of db.participations) {
    if (!p.selected) continue
    const k = p.handleUrl ?? `name:${p.displayName}`
    by.set(k, [...(by.get(k) ?? []), p])
  }
  const hit = [...by.entries()].find(([key]) => creatorCode(key) === code.toUpperCase())
  if (!hit) return null
  const [key, rows] = hit

  const joined = rows.map((part) => {
    const campaign = db.campaigns.find((c) => c.id === part.campaignId) ?? null
    const stage: CreatorView['joined'][number]['stage'] =
      campaign?.finance.paymentStatus === '입금완료' && part.contentUrl ? 'settled'
      : part.contentUrl ? 'posted'
      : part.shipping ? 'shipped'
      : 'selected'
    return { campaign, part, stage }
  })

  return {
    key,
    code,
    name: rows[0].displayName,
    handle: rows[0].handleUrl,
    followers: rows.reduce<number | null>((m, r) => ((r.followers ?? 0) > (m ?? 0) ? r.followers : m), null),
    joined,
    history: rows.length,
    earned: rows.reduce((s, r) => s + (r.proposedFee ?? 0), 0),
  }
}
