import { getDb } from '@/lib/db'
import { availability } from '@/lib/availability'
import { categories } from '@/lib/categories'
import { collab } from '@/lib/collab'
import Picker, { type Pick } from './Picker'

/* 핵심 인플루언서 설정 — 5,818명 인재풀에서 상시 데리고 갈 정예를 고른다.
   인재풀은 줄이지 않는다. 그 위에 얹는 층이다. */

export default function CorePage() {
  const db = getDb()
  const av = availability()
  const cat = categories()
  const col = collab()

  // 최근 협업 — 언제, 무슨 캠페인이었는지까지 남긴다
  const last = new Map<string, { at: string; name: string }>()
  const camp = new Map(db.campaigns.map((c) => [c.id, c]))
  for (const p of db.participations) {
    if (!p.handleUrl || !p.campaignId) continue
    const c = camp.get(p.campaignId)
    const d = c?.dates.end ?? c?.dates.due ?? null
    if (!d || !c) continue
    const k = p.handleUrl.split('/').pop()!.toLowerCase()
    if ((last.get(k)?.at ?? '') < d) {
      last.set(k, { at: d, name: c.name.replace(/^\[[^\]]+\]\s*/, '') })
    }
  }

  const rows: Pick[] = (db.creators ?? []).map((c) => ({
    id: c.id,
    handle: c.handle,
    platform: c.platformLabel,
    listed: col.get(c.handle)?.listed ?? c.campaignCount,
    picked: col.get(c.handle)?.picked ?? 0,
    known: col.get(c.handle)?.known ?? false,
    lastAt: last.get(c.handle)?.at ?? null,
    lastName: last.get(c.handle)?.name ?? (c.campaigns[0] ?? null),
    url: c.url,
    cats: cat.get(c.handle) ?? [],
    status: av.get(c.handle)?.status ?? 'open',
  }))

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">CAMPAIGNS · CREATORS</p>
          <h1>핵심 인플루언서 설정</h1>
          <p className="lede">
            상시 데리고 갈 정예를 고릅니다. 인재풀 {rows.length.toLocaleString('ko-KR')}명은 그대로 두고,
            여기서 고른 사람이 명단 맨 위에 오고 모집 발송 대상으로 기본 선택됩니다.
          </p>
        </div>
      </div>

      <div className="zone">
        <Picker rows={rows} />
      </div>
    </div>
  )
}
