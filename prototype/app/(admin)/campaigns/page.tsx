import { getDb, stage, won } from '@/lib/db'
import CampaignsView, { type CardVM } from './CampaignsView'

/* 진행 단계는 아직 정해지지 않았다.
   지금 있는 값(선정 수 · 업로드 수 · 입금 상태)으로 역산해 보드를 채운다.
   실제 정의가 정해지면 이 함수 하나만 바꾸면 된다. */
function lane(c: {
  selected: number | null; uploaded: number | null; paid: boolean
}): string {
  if (c.paid) return '정산 완료'
  const sel = c.selected ?? 0
  const up = c.uploaded ?? 0
  if (sel === 0) return '모집'
  if (up === 0) return '선정'
  if (up < sel) return '배송 · 업로드'
  return '검수'
}

export default function CampaignsPage() {
  const db = getDb()

  const cards: CardVM[] = db.campaigns.map((c) => {
    const parts = db.participations.filter((p) => p.campaignId === c.id)
    const sel = parts.filter((p) => p.selected)
    const paid = c.finance.paymentStatus === '입금완료'
    const st = stage(c.status)
    return {
      id: c.id,
      name: c.name,
      brand: c.brandName ?? '거래처 미기재',
      detail: c.detail,
      stageLabel: st.label,
      tone: st.tone,
      lane: lane({ selected: c.counts.selected, uploaded: c.counts.uploaded, paid }),
      month: c.monthLabel ?? '귀속 미기재',
      revenue: c.finance.revenue,
      margin: c.finance.margin,
      offered: c.counts.offered,
      selected: c.counts.selected,
      uploaded: c.counts.uploaded,
      uploadRate: c.rates.upload,
      invoiceDate: c.finance.invoiceDate,
      paid,
      parts: parts.length,
      checks: {
        selected: sel.length || (c.counts.selected ?? 0),
        responded: sel.filter((p) => p.pii.realName).length,
        shipped: sel.filter((p) => p.shipping).length,
        posted: sel.filter((p) => p.contentUrl).length || (c.counts.uploaded ?? 0),
      },
      links: { guide: c.links.guide, tracker: c.links.tracker, review: c.links.review },
    }
  })

  const total = cards.reduce((s, c) => s + (c.revenue ?? 0), 0)
  const running = cards.filter((c) => c.lane !== '정산 완료').length

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">CAMPAIGNS</p>
          <h1>캠페인</h1>
          <p className="lede">
            한 건을 누르면 옆에서 열립니다. 목록을 벗어나지 않고 확인하고, 검수는 한 단계 더 들어갑니다.
          </p>
        </div>
        <div className="right">
          <span className="chip line">진행 {running}건</span>
          <span className="chip line">누적 {won(total)}</span>
        </div>
      </div>

      <div className="zone">
        <CampaignsView cards={cards} />
      </div>
    </div>
  )
}
