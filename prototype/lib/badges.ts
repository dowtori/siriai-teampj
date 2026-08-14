import { getDb } from './db'

/* 좌측 탭 옆에 붙는 미확인 표시.
   "남은 일 전부"가 아니라 "아직 안 본 것"이다. 그 탭에 들어가면 사라진다.
   지금은 데이터에서 뽑고, 실제로는 마지막으로 본 시각 이후에 생긴 것을 센다. */

export type Badges = Record<string, number>

export function adminBadges(): Badges {
  const db = getDb()
  const camps = db.campaigns
  const parts = db.participations

  const running = camps.filter((c) => !(c.status ?? '').includes('종료'))
  const due = running.filter((c) => c.dates.due && c.dates.due <= '2026-08-20').length
  const unpaid = camps.filter(
    (c) => (c.finance.revenue ?? 0) > 0 && (c.finance.paymentStatus ?? '') !== '입금완료',
  ).length

  // 아직 검수가 안 끝난 콘텐츠 — 캠페인이 아니라 건으로 센다
  const uploads = parts.filter((p) => p.contentUrl?.startsWith('http')).length
  // 선정됐는데 콘텐츠가 없는 인원
  const waiting = parts.filter((p) => p.selected && !p.contentUrl).length

  return {
    '/dashboard': due + Math.min(waiting, 99),
    '/campaigns': running.length,
    '/campaigns/review': uploads,
    '/campaigns/delivery': Math.min(waiting, 99),
    '/settlement': unpaid,
    '/b': camps.filter((c) => (c.counts.selected ?? 0) > 0 && !c.dates.end).length,
  }
}
