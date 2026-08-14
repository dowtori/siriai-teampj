import { getDb, cnt } from '@/lib/db'
import { availability, counts, type Status } from '@/lib/availability'
import Roster, { type CreatorRow } from './Roster'

/* 인플루언서 명단 — 진행시트를 되짚어 만든 협업 이력이 기준이다.
   마스터시트의 협업여부 컬럼은 전 건이 같은 값이라 쓸 수 없다.
   여기에 진행시트에서 나온 팔로워 · ER · 단가를 계정 단위로 얹는다. */

function key(url: string | null, name: string) {
  let s = (url ?? '').trim()
  for (const a of ['https://', 'http://', 'www.']) s = s.replaceAll(a, '')
  for (const h of ['instagram.com/', 'tiktok.com/', 'youtube.com/', 'blog.naver.com/', 'threads.net/']) {
    s = s.replaceAll(h, '')
  }
  s = s.split('?')[0].replace(/^[/@]+|[/@ ]+$/g, '').toLowerCase()
  return s || name.trim().replace(/^@/, '').toLowerCase()
}

export default function InfluencersPage() {
  const db = getDb()

  // 진행시트 쪽 상세 — 계정 단위로 모은다
  type Detail = {
    followers: number | null; er: number | null; fee: number | null
    picks: number; posts: number; verified: boolean; brands: string[]
  }
  const detail = new Map<string, Detail>()
  for (const p of db.participations) {
    if (!p.handleUrl) continue
    const k = key(p.handleUrl, p.displayName)
    const c = db.campaigns.find((x) => x.id === p.campaignId)
    const cur = detail.get(k) ?? {
      followers: null, er: null, fee: null, picks: 0, posts: 0, verified: false, brands: [],
    }
    if ((p.followers ?? 0) > (cur.followers ?? 0)) cur.followers = p.followers
    if (p.er != null && (cur.er == null || p.er > cur.er)) cur.er = p.er
    if (p.proposedFee && (!cur.fee || p.proposedFee > cur.fee)) cur.fee = p.proposedFee
    if (p.selected) cur.picks += 1
    if (p.contentUrl) cur.posts += 1
    if (p.pii.realName) cur.verified = true
    if (c?.brandName && !cur.brands.includes(c.brandName)) cur.brands.push(c.brandName)
    detail.set(k, cur)
  }

  const av = availability()
  const rows: CreatorRow[] = (db.creators ?? []).map((cr) => {
    const d = detail.get(cr.handle)
    const a = av.get(cr.handle)
    return {
      status: (a?.status ?? 'open') as Status,
      until: a?.until ?? null,
      why: a?.reason ?? '진행 중인 건이 없습니다',
      recentBrands: a?.recentBrands ?? [],
      key: cr.id,
      handle: cr.handle,
      name: cr.name,
      url: cr.url,
      platform: cr.platformLabel,
      worked: cr.campaignCount,
      campaigns: cr.campaigns,
      campaignsMore: cr.campaignsMore,
      followers: d?.followers ?? null,
      er: d?.er ?? null,
      fee: d?.fee ?? null,
      posts: d?.posts ?? 0,
      verified: d?.verified ?? false,
      brands: d?.brands ?? [],
      detailed: !!d,
    }
  })

  const repeat = rows.filter((r) => r.worked >= 2).length
  const regular = rows.filter((r) => r.worked >= 6).length
  const c = counts()

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">CAMPAIGNS · CREATORS</p>
          <h1>인플루언서 명단</h1>
          <p className="lede">
            지금까지 함께 일한 사람들입니다. 여기서 골라 다음 캠페인에 담습니다.
          </p>
        </div>
      </div>

      <div className="scores">
        <div className="score">
          <span className="sk">CREATORS</span>
          <span className="sv">{cnt(rows.length)}</span>
          <span className="sd">협업한 적 있는 계정</span>
        </div>
        <div className="score">
          <span className="sk">REPEAT</span>
          <span className="sv">{cnt(repeat)}</span>
          <span className="sd">두 번 이상 함께함</span>
        </div>
        <div className="score">
          <span className="sk">REGULAR</span>
          <span className="sv">{cnt(regular)}</span>
          <span className="sd">여섯 번 이상 — 단골</span>
        </div>
        <div className="score">
          <span className="sk">AVAILABLE</span>
          <span className="sv">{cnt(c.open)}</span>
          <span className="sd">지금 제안 가능 · 진행 중 {c.busy} · 쿨다운 {c.cooling}</span>
        </div>
      </div>

      <div className="zone">
        <Roster rows={rows} />
      </div>
    </div>
  )
}
