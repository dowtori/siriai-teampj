import { getDb, type Campaign } from './db'
import type { Status } from './avail-types'

export { STATUS_LABEL, type Status } from './avail-types'

/* 인플루언서 가용성 — 지금 제안을 넣을 수 있는 사람인가.

   화면에 달력을 그리지 않는다. 세일즈가 필요한 건 날짜판이 아니라 결론이다.
   5,818명에서 "지금 붙일 수 있는 사람"만 즉시 남기는 것이 목적이다.

   판정 규칙 (팀에서 바꿀 수 있게 여기 모아둔다)
   · 묶임   — 선정됐는데 아직 콘텐츠가 없고, 그 캠페인이 아직 안 끝났다.
              업로드가 남아 있으므로 새 건을 얹으면 둘 다 늦어진다.
   · 쿨다운 — 최근 COOL일 안에 업로드를 마쳤다. 연달아 태우면 피드가 광고로 덮인다.
   · 가능   — 그 외.

   상시 캠페인(종료일이 연말인 건)은 묶임 근거로 쓰지 않는다.
   끝나지 않는 캠페인 하나가 2,232명을 영원히 묶어버린다. */

const TODAY = '2026-08-14'
const COOL = 21          // 업로드 후 쉬는 날
const RIVAL = 90         // 경합 브랜드를 피하는 기간

export type Avail = {
  status: Status
  /** 언제 풀리는가 */
  until: string | null
  /** 왜 이 상태인가 — 화면에 그대로 쓴다 */
  reason: string
  /** 최근 RIVAL일 안에 함께한 거래처 — 경합 판단용 */
  recentBrands: string[]
}

const day = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
const diff = (a: string, b: string) => Math.round((day(a) - day(b)) / 86400000)
const plus = (d: string, n: number) => new Date(day(d) + n * 86400000).toISOString().slice(0, 10)
const short = (d: string) => d.slice(5).replace('-', '/')

/** 계정 주소에서 계정만 남긴다 — creators 와 participations 를 잇는 열쇠 */
export function handleKey(url: string | null): string {
  if (!url) return ''
  let s = url.trim()
  for (const a of ['https://', 'http://', 'www.']) s = s.replaceAll(a, '')
  for (const h of ['instagram.com/', 'tiktok.com/', 'youtube.com/', 'blog.naver.com/', 'threads.net/']) {
    s = s.replaceAll(h, '')
  }
  return s.split('?')[0].replace(/^[/@]+|[/@ ]+$/g, '').toLowerCase()
}

let cache: Map<string, Avail> | null = null

export function availability(): Map<string, Avail> {
  if (cache) return cache
  const db = getDb()
  const camp = new Map<string, Campaign>(db.campaigns.map((c) => [c.id, c]))
  const out = new Map<string, Avail>()

  const ensure = (k: string): Avail =>
    out.get(k) ?? { status: 'open', until: null, reason: '진행 중인 건이 없습니다', recentBrands: [] }

  for (const p of db.participations) {
    const k = handleKey(p.handleUrl)
    if (!k || !p.campaignId) continue
    const c = camp.get(p.campaignId)
    if (!c) continue

    const end = c.dates.end
    const due = c.dates.due
    const cur = ensure(k)

    // 아직 안 끝난 캠페인에 선정됐는데 콘텐츠가 없다 → 묶임
    if (p.selected && !p.contentUrl && end && end >= TODAY) {
      const until = due && due >= TODAY ? due : end
      if (cur.status !== 'busy' || (cur.until ?? '') < until) {
        cur.status = 'busy'
        cur.until = until
        cur.reason = `${c.name.replace(/^\[[^\]]+\]\s*/, '')} 업로드 예정 ${short(until)}`
      }
    }

    // 최근에 업로드를 마쳤다 → 쿨다운
    if (p.contentUrl && end) {
      const gap = diff(TODAY, end)
      if (gap >= 0 && gap < COOL && cur.status !== 'busy') {
        const until = plus(end, COOL)
        if ((cur.until ?? '') < until) {
          cur.status = 'cooling'
          cur.until = until
          cur.reason = `${short(end)} 업로드 마감 · ${COOL - gap}일 뒤 가능`
        }
      }
    }

    // 최근에 함께한 거래처 — 경합 판단에 쓴다
    if (c.brandName && end && diff(TODAY, end) >= 0 && diff(TODAY, end) <= RIVAL) {
      if (!cur.recentBrands.includes(c.brandName)) cur.recentBrands.push(c.brandName)
    }

    out.set(k, cur)
  }

  cache = out
  return out
}

/** 화면에서 바로 쓰는 요약 */
export function availabilityOf(handle: string): Avail {
  return availability().get(handleKey(handle)) ?? {
    status: 'open', until: null, reason: '진행 중인 건이 없습니다', recentBrands: [],
  }
}

export function counts() {
  const db = getDb()
  const a = availability()
  let busy = 0, cooling = 0
  for (const v of a.values()) {
    if (v.status === 'busy') busy += 1
    else if (v.status === 'cooling') cooling += 1
  }
  const total = (db.creators ?? []).length
  return { total, busy, cooling, open: total - busy - cooling }
}
