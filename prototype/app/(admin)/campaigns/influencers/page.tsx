import { getDb, cnt, won } from '@/lib/db'
import Roster, { type CreatorRow } from './Roster'

/* 인플루언서 명단 — 진행시트에서 실제로 협업한 사람들.
   원본 20,347건 중 여기 남는 건 "함께 일해본" 층위다. */

export default function InfluencersPage() {
  const db = getDb()

  const byHandle = new Map<string, CreatorRow>()
  for (const p of db.participations) {
    const key = p.handleUrl ?? `name:${p.displayName}`
    const cur = byHandle.get(key)
    const campaign = db.campaigns.find((c) => c.id === p.campaignId)
    if (!cur) {
      byHandle.set(key, {
        key,
        name: p.displayName,
        url: p.handleUrl,
        followers: p.followers,
        er: p.er,
        proposals: 1,
        picks: p.selected ? 1 : 0,
        posts: p.contentUrl ? 1 : 0,
        fee: p.proposedFee,
        verified: !!p.pii.realName,
        brands: campaign?.brandName ? [campaign.brandName] : [],
      })
    } else {
      cur.proposals += 1
      if (p.selected) cur.picks += 1
      if (p.contentUrl) cur.posts += 1
      if ((p.followers ?? 0) > (cur.followers ?? 0)) cur.followers = p.followers
      if (p.proposedFee && (!cur.fee || p.proposedFee > cur.fee)) cur.fee = p.proposedFee
      if (p.pii.realName) cur.verified = true
      if (campaign?.brandName && !cur.brands.includes(campaign.brandName)) cur.brands.push(campaign.brandName)
    }
  }

  const rows = [...byHandle.values()].sort((a, b) => b.picks - a.picks || b.proposals - a.proposals)
  const worked = rows.filter((r) => r.picks > 0).length
  const verified = rows.filter((r) => r.verified).length
  const repeat = rows.filter((r) => r.picks > 1).length

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">CAMPAIGNS · CREATORS</p>
          <h1>인플루언서 명단</h1>
          <p className="lede">
            제안했거나 함께 일해본 사람들입니다. 여기서 골라 다음 캠페인에 담습니다.
          </p>
        </div>
      </div>

      <div className="scores">
        <div className="score">
          <span className="sk">PROPOSED</span>
          <span className="sv">{cnt(rows.length)}</span>
          <span className="sd">제안한 적 있는 계정</span>
        </div>
        <div className="score">
          <span className="sk">WORKED</span>
          <span className="sv">{cnt(worked)}</span>
          <span className="sd">실제 선정되어 진행</span>
        </div>
        <div className="score">
          <span className="sk">REPEAT</span>
          <span className="sv">{cnt(repeat)}</span>
          <span className="sd">두 번 이상 함께함</span>
        </div>
        <div className="score">
          <span className="sk">VERIFIED</span>
          <span className="sv">{cnt(verified)}</span>
          <span className="sd">실명 · 연락처까지 확보</span>
        </div>
      </div>

      <div className="zone">
        <Roster rows={rows} />
      </div>
    </div>
  )
}
