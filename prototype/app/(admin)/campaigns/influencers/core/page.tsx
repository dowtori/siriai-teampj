import { getDb } from '@/lib/db'
import { availability } from '@/lib/availability'
import { categories } from '@/lib/categories'
import Picker, { type Pick } from './Picker'

/* 핵심 인플루언서 설정 — 5,818명 인재풀에서 상시 데리고 갈 정예를 고른다.
   인재풀은 줄이지 않는다. 그 위에 얹는 층이다. */

export default function CorePage() {
  const db = getDb()
  const av = availability()
  const cat = categories()

  // 최근 협업 시점 — 최신순 정렬의 근거
  const last = new Map<string, string>()
  const camp = new Map(db.campaigns.map((c) => [c.id, c]))
  for (const p of db.participations) {
    if (!p.handleUrl || !p.campaignId) continue
    const c = camp.get(p.campaignId)
    const d = c?.dates.end ?? c?.dates.due ?? null
    if (!d) continue
    const k = p.handleUrl.split('/').pop()!.toLowerCase()
    if ((last.get(k) ?? '') < d) last.set(k, d)
  }

  const rows: Pick[] = (db.creators ?? []).map((c) => ({
    id: c.id,
    handle: c.handle,
    platform: c.platformLabel,
    worked: c.campaignCount,
    lastAt: last.get(c.handle) ?? null,
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
