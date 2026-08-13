import Link from 'next/link'
import { getDb, won, cnt, ymd } from '@/lib/db'
import Today, { type Work } from './Today'

/* 대시보드 = 오늘 할 일.
   전체 진행 상황은 홈에서 본다. 여기는 손을 대야 하는 것만. */

const ASOF = '2026-08-13'

function dday(due: string | null): number | null {
  if (!due) return null
  const a = Date.parse(due + 'T00:00:00Z')
  const b = Date.parse(ASOF + 'T00:00:00Z')
  return Math.round((a - b) / 86_400_000)
}

export default function DashboardPage() {
  const db = getDb()
  const work: Work[] = []

  // ① 마감 임박 — 납품예정일이 지났거나 7일 안에 남은 진행중 캠페인
  for (const c of db.campaigns) {
    if (c.status.includes('완전 종료')) continue
    const d = dday(c.dates.due)
    if (d === null || d > 7) continue
    work.push({
      id: 'due-' + c.id,
      kind: 'due',
      title: c.name,
      sub: `${c.brandName ?? '거래처 미기재'} · 납품 ${ymd(c.dates.due)}`,
      metaLabel: 'D-DAY',
      metaValue: d < 0 ? `${-d}일 지남` : d === 0 ? '오늘' : `D-${d}`,
      href: `/campaigns/${c.id}`,
      urgent: d <= 0,
    })
  }

  // ② 리마인드 — 선정됐는데 아직 콘텐츠가 없는 인원
  // ③ 검수 — 올라왔지만 확인이 끝나지 않은 콘텐츠
  //
  // 시트에는 "검수 완료" 항목이 따로 없다. 지금은 최근 3개월 캠페인의
  // 선정 인원을 대상으로 잡는다. 실제 단계 정의가 정해지면 이 조건만 바뀐다.
  const RECENT = '2026-04'
  const byCampaign = new Map(db.campaigns.map((c) => [c.id, c]))
  const isRecent = (c: { status: string; finance: { invoiceDate: string | null }; month: string | null }) =>
    !c.status.includes('완전 종료') || (c.finance.invoiceDate ?? c.month ?? '') >= RECENT

  for (const p of db.participations) {
    if (!p.selected || !p.campaignId) continue
    const c = byCampaign.get(p.campaignId)
    if (!c || !isRecent(c)) continue
    const base = {
      title: p.displayName,
      sub: `${c.name} · ${c.brandName ?? ''}`.trim(),
      href: `/campaigns/${c.id}`,
    }
    if (!p.contentUrl) {
      work.push({
        ...base, id: 'rm-' + p.id, kind: 'remind',
        metaLabel: 'FEE', metaValue: won(p.proposedFee),
        urgent: !p.shipping,
      })
    } else {
      work.push({
        ...base, id: 'rv-' + p.id, kind: 'review',
        metaLabel: 'UPLOADED', metaValue: '콘텐츠 확인',
      })
    }
  }

  // ④ 정산 — 매출은 잡혔는데 입금이 확인되지 않은 캠페인
  for (const c of db.campaigns) {
    if ((c.finance.revenue ?? 0) <= 0) continue
    if (c.finance.paymentStatus === '입금완료') continue
    work.push({
      id: 'st-' + c.id,
      kind: 'settle',
      title: c.name,
      sub: `${c.brandName ?? '거래처 미기재'} · 계산서 ${ymd(c.finance.invoiceDate)}`,
      metaLabel: 'UNPAID',
      metaValue: won(c.finance.revenue),
      href: `/campaigns/${c.id}`,
      urgent: true,
    })
  }

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">DASHBOARD</p>
          <h1>대시보드</h1>
          <p className="lede">
            오늘 손을 대야 하는 일만 모았습니다. 전체 진행 상황은 <Link href="/" style={{ color: 'var(--accent-ink)' }}>홈</Link>에서 봅니다.
          </p>
        </div>
      </div>

      <Today work={work} asOf="2026년 8월 13일" />

      <div className="zone">
        <div className="zh">
          <h2>이 화면에 더 붙을 것</h2>
          <p>아직 데이터가 없거나 결정이 필요한 영역</p>
        </div>
        <div className="plans">
          <div className="plan">
            <span className="pk">APPROVAL</span>
            <h3>승인 대기</h3>
            <p>인플루언서 지원, 콘텐츠 재업로드 요청, 비용 변경처럼 담당자가 눌러야 넘어가는 일이 여기 쌓입니다.</p>
          </div>
          <div className="plan">
            <span className="pk">ALERT</span>
            <h3>알림 발송 대기</h3>
            <p>상태가 바뀌면 알림톡이 나갑니다. 나가기 전 문구와 대상을 확인하는 자리입니다.</p>
          </div>
          <div className="plan">
            <span className="pk">TODAY</span>
            <h3>오늘 일정</h3>
            <p>발송 예정, 업로드 마감, 계산서 발급일을 하루 단위로 봅니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
