import type { Campaign } from './db'

/* 브랜드 협업의 실제 6단계.
   모집 → 컨펌 → 업로드 중 → 업로드 완료 → 계산서 발행 → 정산 완료
   이 순서가 브랜드 페이지와 어드민 보드의 축이 된다. */

export const STAGES = [
  { key: 'recruit', label: '모집',      short: '모집',   brandAction: false },
  { key: 'confirm', label: '컨펌',      short: '컨펌',   brandAction: true },
  { key: 'posting', label: '업로드 중',  short: '업로드', brandAction: false },
  { key: 'posted',  label: '업로드 완료', short: '완료',   brandAction: false },
  { key: 'invoice', label: '계산서 발행', short: '계산서', brandAction: false },
  { key: 'settled', label: '정산 완료',  short: '정산',   brandAction: false },
] as const

export type StageKey = (typeof STAGES)[number]['key']

/** 지금 있는 데이터로 단계를 판정한다. 실제 단계 필드가 생기면 이 함수만 바뀐다. */
export function stageOf(c: Campaign): StageKey {
  const sel = c.counts.selected ?? 0
  const up = c.counts.uploaded ?? 0
  if (c.finance.paymentStatus === '입금완료') return 'settled'
  if (c.finance.invoiceDate) return 'invoice'
  if (sel === 0) return 'recruit'
  if (up === 0) return 'confirm'
  if (up < sel) return 'posting'
  return 'posted'
}

/**
 * 데모용 판정.
 * 시트 데이터는 대부분 정산까지 끝나 있어서, 그대로 두면 파이프라인이 움직이지 않는다.
 * 브랜드의 최근 캠페인 몇 건은 아직 흐르는 중으로 보아 6단계가 어떻게 보이는지를 드러낸다.
 * 실제 단계 필드가 생기면 이 함수는 지운다.
 */
export function stageForDemo(c: Campaign, live: Map<string, StageKey>): StageKey {
  return live.get(c.id) ?? stageOf(c)
}

/** 최근 n건을 앞쪽 네 단계에 하나씩 놓아 6단계가 모두 보이게 한다 */
export function pickLive(campaigns: Campaign[], n = 4): Map<string, StageKey> {
  const lanes: StageKey[] = ['recruit', 'confirm', 'posting', 'posted']
  const sorted = [...campaigns].sort((a, b) =>
    (b.finance.invoiceDate ?? b.month ?? '').localeCompare(a.finance.invoiceDate ?? a.month ?? ''))
  return new Map(sorted.slice(0, n).map((c, i) => [c.id, lanes[i % lanes.length]]))
}

export const stageIndex = (k: StageKey) => STAGES.findIndex((s) => s.key === k)
export const stageMeta = (k: StageKey) => STAGES[stageIndex(k)]

/** 아직 끝나지 않은 단계인가 */
export const isLive = (k: StageKey) => k !== 'settled'

/** 브랜드가 손을 대야 하는 단계인가 */
export const needsBrand = (k: StageKey) => stageMeta(k).brandAction
