import { getDb, won, ymd } from './db'

/* 새로 생긴 항목 — 탭 옆 숫자의 근거.
   "그 화면에 남은 일 전부"가 아니라 "마지막으로 본 뒤에 생긴 것"이다.
   숫자를 지우는 것은 탭에 들어가는 행위가 아니라, 그 항목을 하나씩 확인하는 행위다. */

export type Notice = {
  id: string
  /** 어느 탭에 속하는가 — 좌측 메뉴 href */
  tab: string
  title: string
  sub: string
  /** 그 항목으로 바로 가는 주소 */
  href: string
  kind: '업로드' | '컨펌' | '마감' | '정산' | '지원'
}

const TODAY = '2026-08-14'

function daysTo(d: string | null): number | null {
  if (!d) return null
  const a = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
  const b = Date.UTC(2026, 7, 14)
  return Math.round((a - b) / 86400000)
}

export function notices(): Notice[] {
  const db = getDb()
  const out: Notice[] = []

  const live = db.campaigns.filter((c) => !(c.status ?? '').includes('종료'))

  /* 마감이 코앞이거나 막 지난 캠페인.
     한참 전에 지난 건까지 넣으면 "새 항목"이 아니라 밀린 일 목록이 된다. */
  for (const c of live) {
    const d = daysTo(c.dates.due)
    if (d == null || d > 5 || d < -14) continue
    out.push({
      id: 'due:' + c.id,
      tab: '/dashboard',
      title: c.name.replace(/^\[[^\]]+\]\s*/, ''),
      sub: d < 0 ? `납품 ${-d}일 지남` : d === 0 ? '오늘 납품' : `납품 ${d}일 남음`,
      href: '/campaigns',
      kind: '마감',
    })
  }

  // 콘텐츠가 올라온 캠페인 — 검수해야 할 것이 생겼다는 뜻
  const byCamp = new Map<string, number>()
  for (const p of db.participations) {
    if (!p.campaignId || !p.contentUrl?.startsWith('http')) continue
    byCamp.set(p.campaignId, (byCamp.get(p.campaignId) ?? 0) + 1)
  }
  for (const [cid, n] of [...byCamp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    const c = db.campaigns.find((x) => x.id === cid)
    if (!c) continue
    out.push({
      id: 'up:' + cid,
      tab: '/campaigns/review',
      title: c.name.replace(/^\[[^\]]+\]\s*/, ''),
      sub: `콘텐츠 ${n}건 올라옴`,
      href: `/campaigns/review?c=${cid}`,
      kind: '업로드',
    })
  }

  // 입금이 안 끝난 건
  for (const c of db.campaigns
    .filter((x) => (x.finance.revenue ?? 0) > 0 && (x.finance.paymentStatus ?? '') !== '입금완료')
    .sort((a, b) => (b.finance.revenue ?? 0) - (a.finance.revenue ?? 0))
    .slice(0, 6)) {
    out.push({
      id: 'pay:' + c.id,
      tab: '/settlement',
      title: c.name.replace(/^\[[^\]]+\]\s*/, ''),
      sub: `미수 ${won(c.finance.revenue)} · 계산서 ${ymd(c.finance.invoiceDate)}`,
      href: '/settlement',
      kind: '정산',
    })
  }

  // 선정은 끝났는데 아직 안 끝난 캠페인 — 브랜드 컨펌이 걸린 자리
  for (const c of live
    .filter((x) => (x.counts.selected ?? 0) > 0 && (x.counts.uploaded ?? 0) < (x.counts.selected ?? 0))
    .slice(0, 5)) {
    out.push({
      id: 'cf:' + c.id,
      tab: '/campaigns',
      title: c.name.replace(/^\[[^\]]+\]\s*/, ''),
      sub: `선정 ${c.counts.selected}명 중 업로드 ${c.counts.uploaded ?? 0}건`,
      href: '/campaigns',
      kind: '컨펌',
    })
  }

  return out
}
