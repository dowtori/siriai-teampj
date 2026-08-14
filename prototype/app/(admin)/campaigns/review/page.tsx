import { getDb } from '@/lib/db'
import Board, { type CampRow } from './Board'
import { type Person } from './state'

/* 검수 — 캠페인을 고르고, 그 캠페인에 올라온 콘텐츠를 건별로 본다.
   캠페인 하나에 10~30건이 올라오므로 "한 건 검수"가 아니라 "한 캠페인 안의 여러 건"이 단위다. */

const at = (h: string | null) => (h ? '@' + h.replace('instagram.com/', '') : null)

export default async function Review(props: PageProps<'/campaigns/review'>) {
  const sp = await props.searchParams
  const pick = typeof sp.c === 'string' ? sp.c : null
  const db = getDb()

  /* 캠페인마다 사람과 업로드를 묶는다.
     선정 안 됐는데 콘텐츠가 올라온 행도 버리지 않는다 — 실제로 있는 일이다. */
  const build = (campaignId: string): Person[] => {
    const rows = db.participations.filter((p) => p.campaignId === campaignId)
    const map = new Map<string, Person>()
    for (const p of rows) {
      const key = p.handleUrl ?? 'n:' + p.displayName
      const cur = map.get(key) ?? {
        key,
        name: p.displayName,
        handle: at(p.handleUrl),
        followers: p.followers,
        fee: p.proposedFee,
        selected: false,
        uploads: [],
        remark: null,
      }
      cur.selected = cur.selected || p.selected
      if ((p.followers ?? 0) > (cur.followers ?? 0)) cur.followers = p.followers
      if (p.proposedFee && (!cur.fee || p.proposedFee > cur.fee)) cur.fee = p.proposedFee
      if (!cur.remark && p.remark) cur.remark = p.remark
      if (p.contentUrl?.startsWith('http')) cur.uploads.push({ id: p.id, url: p.contentUrl })
      map.set(key, cur)
    }
    // 올린 사람 먼저, 그 다음 팔로워 순
    return [...map.values()].sort(
      (a, b) => b.uploads.length - a.uploads.length || (b.followers ?? 0) - (a.followers ?? 0),
    )
  }

  const camps: CampRow[] = db.campaigns
    .map((c) => {
      const rows = db.participations.filter((p) => p.campaignId === c.id)
      const uploads = rows.filter((p) => p.contentUrl?.startsWith('http')).length
      const selected = new Set(
        rows.filter((p) => p.selected).map((p) => p.handleUrl ?? 'n:' + p.displayName),
      ).size
      return {
        id: c.id,
        name: c.name.replace(/^\[[^\]]+\]\s*/, ''),
        brand: c.brandName ?? '거래처 미기재',
        month: c.monthLabel ?? c.month ?? '',
        due: c.dates.due,
        uploads,
        selected,
      }
    })
    .filter((c) => c.uploads > 0 || c.selected > 0)
    .sort((a, b) => b.uploads - a.uploads || b.selected - a.selected)

  const one = pick ? camps.find((c) => c.id === pick) ?? null : null

  return (
    <Board
      camps={camps}
      one={one}
      people={one ? build(one.id) : []}
    />
  )
}
