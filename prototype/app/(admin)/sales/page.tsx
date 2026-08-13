import Link from 'next/link'
import { getDb, won, cnt, rate, ymd } from '@/lib/db'

/* 세일즈 · 거래처 — 실데이터가 있는 영역. */

export default function SalesPage() {
  const db = getDb()

  const rows = db.brands.map((b) => {
    const cs = db.campaigns.filter((c) => c.brandId === b.id)
    const rev = cs.reduce((s, c) => s + (c.finance.revenue ?? 0), 0)
    const profit = cs.reduce((s, c) => s + (c.finance.profit ?? 0), 0)
    const unpaid = cs.filter((c) => (c.finance.revenue ?? 0) > 0 && c.finance.paymentStatus !== '입금완료')
    const lastDate = cs.map((c) => c.finance.invoiceDate).filter(Boolean).sort().pop() ?? null
    return {
      ...b, rev, profit,
      margin: rev ? profit / rev : null,
      unpaid: unpaid.reduce((s, c) => s + (c.finance.revenue ?? 0), 0),
      lastDate,
      share: db.kpi.revenue ? rev / db.kpi.revenue : 0,
    }
  }).sort((a, b) => b.rev - a.rev)

  const active = rows.filter((r) => r.lastDate && r.lastDate >= '2026-05-01').length

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">SALES</p>
          <h1>거래처</h1>
          <p className="lede">
            누적 매출 기준입니다. 한 곳이 전체의 절반 가까이를 차지합니다.
          </p>
        </div>
        <div className="right">
          <span className="chip line">{rows.length}곳</span>
        </div>
      </div>

      <div className="scores">
        <div className="score">
          <span className="sk">BRANDS</span>
          <span className="sv">{cnt(rows.length)}</span>
          <span className="sd">거래처 수</span>
        </div>
        <div className="score">
          <span className="sk">ACTIVE</span>
          <span className="sv">{cnt(active)}</span>
          <span className="sd">최근 3개월 내 계산서 발급</span>
        </div>
        <div className="score">
          <span className="sk">TOP SHARE</span>
          <span className="sv">{rate(rows[0]?.share ?? null)}</span>
          <span className="sd">{rows[0]?.name ?? '—'} 비중</span>
        </div>
        <div className="score">
          <span className="sk">UNPAID</span>
          <span className="sv">{won(db.kpi.outstanding)}</span>
          <span className="sd">미수금</span>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>거래처 목록</h2>
          <p>매출 순</p>
        </div>
        <div className="panel">
          <div className="rows">
            {rows.map((b) => (
              <Link className="row" key={b.id} href={`/campaigns?brand=${encodeURIComponent(b.name)}`}>
                <span className="ring" style={{ ['--p' as string]: Math.round(b.share * 100) }}>
                  <b>{Math.round(b.share * 100)}%</b>
                </span>
                <span className="lead">
                  <span className="t">{b.name}</span>
                  <span className="s">
                    캠페인 {b.campaignCount}건 · 최근 계산서 {ymd(b.lastDate)}
                    {b.unpaid > 0 ? ` · 미수 ${won(b.unpaid)}` : ''}
                  </span>
                </span>
                <span className="tail">
                  <span className="met"><b>{won(b.rev)}</b><span>REVENUE</span></span>
                  <span className="met"><b>{rate(b.margin)}</b><span>MARGIN</span></span>
                  <span className="arrow">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>거래처 화면에 더 붙을 것</h2>
        </div>
        <div className="plans">
          <div className="plan">
            <span className="pk">CONTACT</span>
            <h3>담당자 · 연락 이력</h3>
            <p>거래처마다 담당자와 주고받은 기록을 붙입니다. 지금은 메일함과 슬랙에 흩어져 있습니다.</p>
          </div>
          <div className="plan">
            <span className="pk">TERMS</span>
            <h3>계약 · 단가 정책</h3>
            <p>브랜드별 단가와 정산 조건. 캠페인 만들 때 자동으로 불러옵니다.</p>
          </div>
          <div className="plan">
            <span className="pk">CODE</span>
            <h3>브랜드 페이지 코드</h3>
            <p>고객사가 들어올 코드를 여기서 발급하고, 언제 누가 봤는지 확인합니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
