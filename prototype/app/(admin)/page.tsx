import Link from 'next/link'
import { getDb, won, cnt, rate, ymd } from '@/lib/db'

/* 홈 — 전체 진행 상황.
   GA4 홈처럼 핵심 지표 몇 개와 추이만 보여주고, 손 댈 일은 대시보드로 보낸다. */

function Spark({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  return (
    <div className="spark" aria-hidden>
      {values.map((v, i) => (
        <i key={i} style={{ height: `${Math.max((v / max) * 100, 4)}%` }} />
      ))}
    </div>
  )
}

function Delta({ now, prev, unit = '' }: { now: number; prev: number; unit?: string }) {
  if (!prev) return <span className="sd">이전 달 값 없음</span>
  const d = (now - prev) / prev
  const up = d >= 0
  return (
    <span className="sd">
      <b className={up ? 'up' : 'dn'}>{up ? '▲' : '▼'} {Math.abs(d * 100).toFixed(0)}%</b>
      전월 대비{unit}
    </span>
  )
}

export default function Home() {
  const db = getDb()
  const { kpi, byMonth, brands, campaigns, participations, meta } = db

  const last = byMonth[byMonth.length - 1]
  const prev = byMonth[byMonth.length - 2]
  const maxRev = Math.max(...byMonth.map((m) => m.revenue), 1)

  const running = campaigns.filter((c) => !c.status.includes('완전 종료'))
  const creators = new Set(
    participations.filter((p) => p.selected && p.handleUrl).map((p) => p.handleUrl),
  ).size

  const topBrands = brands.slice(0, 5).map((b) => {
    const rev = campaigns.filter((c) => c.brandId === b.id).reduce((s, c) => s + (c.finance.revenue ?? 0), 0)
    return { ...b, rev, share: kpi.revenue ? rev / kpi.revenue : 0 }
  })

  const recent = campaigns
    .filter((c) => c.finance.invoiceDate)
    .sort((a, b) => (b.finance.invoiceDate ?? '').localeCompare(a.finance.invoiceDate ?? ''))
    .slice(0, 5)

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">HOME · 26년 2월 — 8월</p>
          <h1>전체 진행 상황</h1>
          <p className="lede">
            지금 손이 필요한 일은 <Link href="/dashboard" style={{ color: 'var(--accent-ink)' }}>대시보드</Link>에 모여 있습니다.
          </p>
        </div>
        <div className="right">
          <Link className="btn pri" href="/dashboard">오늘 할 일 →</Link>
        </div>
      </div>

      <div className="scores">
        <div className="score">
          <span className="sk">REVENUE</span>
          <span className="sv">{won(kpi.revenue)}</span>
          <Delta now={last?.revenue ?? 0} prev={prev?.revenue ?? 0} />
          <Spark values={byMonth.map((m) => m.revenue)} />
        </div>
        <div className="score">
          <span className="sk">PROFIT</span>
          <span className="sv">{won(kpi.profit)}</span>
          <span className="sd">마진 <b>{rate(kpi.margin)}</b></span>
          <Spark values={byMonth.map((m) => m.profit)} />
        </div>
        <div className="score">
          <span className="sk">CAMPAIGNS</span>
          <span className="sv">{cnt(kpi.campaignsTotal)}</span>
          <span className="sd">진행중 <b>{running.length}</b>건</span>
          <Spark values={byMonth.map((m) => m.count)} />
        </div>
        <div className="score">
          <span className="sk">CREATORS</span>
          <span className="sv">{cnt(creators)}</span>
          <span className="sd">협업한 계정 · 업로드율 <b>{rate(kpi.uploadRate)}</b></span>
          <Spark values={byMonth.map((m) => m.count)} />
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>월별 추이</h2>
          <p>계산서 발급일 기준 · 진한 부분이 순이익 · 백만원</p>
          <div className="right">
            <Link className="btn" href="/settlement">정산으로 →</Link>
          </div>
        </div>
        <div className="panel">
          <div className="panel-bd">
            <div className="months">
              {byMonth.map((m) => (
                <div className="mo" key={m.month}>
                  <span className="vl">{Math.round(m.revenue / 1_000_000)}M</span>
                  <div className="col2" style={{ height: `${Math.max((m.revenue / maxRev) * 100, 3)}%` }}>
                    <i style={{ height: `${(m.profit / Math.max(m.revenue, 1)) * 100}%` }} />
                  </div>
                  <span className="lb">{m.month.slice(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>거래처</h2>
          <p>매출 비중 상위 {topBrands.length}곳 · 전체 {brands.length}곳</p>
          <div className="right">
            <Link className="btn" href="/sales">세일즈로 →</Link>
          </div>
        </div>
        <div className="panel">
          <div className="rows">
            {topBrands.map((b) => (
              <Link className="row" key={b.id} href="/sales">
                <span className="ring" style={{ ['--p' as string]: Math.round(b.share * 100) }}>
                  <b>{Math.round(b.share * 100)}%</b>
                </span>
                <span className="lead">
                  <span className="t">{b.name}</span>
                  <span className="s">캠페인 {b.campaignCount}건</span>
                </span>
                <span className="tail">
                  <span className="met"><b>{won(b.rev)}</b><span>REVENUE</span></span>
                  <span className="arrow">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>최근 계산서</h2>
          <p>매출을 잡는 기준일</p>
        </div>
        <div className="panel">
          <div className="rows">
            {recent.map((c) => (
              <Link className="row" key={c.id} href={`/campaigns/${c.id}`}>
                <span className={`dot ${c.finance.paymentStatus === '입금완료' ? 'live' : 'issue'}`} />
                <span className="lead">
                  <span className="t">{c.name}</span>
                  <span className="s">{c.brandName ?? '—'} · {ymd(c.finance.invoiceDate)}</span>
                </span>
                <span className="tail">
                  <span className="met"><b>{won(c.finance.revenue)}</b><span>{rate(c.finance.margin)} 마진</span></span>
                  <span className="arrow">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>인플루언서</h2>
          <p>함께 일해본 사람들</p>
          <div className="right">
            <Link className="btn" href="/campaigns/influencers">명단으로 →</Link>
          </div>
        </div>
        <div className="plans">
          <div className="plan">
            <span className="pk">WORKED</span>
            <h3>{cnt(creators)}명</h3>
            <p>선정되어 실제로 캠페인을 진행한 계정입니다.</p>
          </div>
          <div className="plan">
            <span className="pk">RECORDS</span>
            <h3>{cnt(meta.participationCount)}건</h3>
            <p>캠페인마다 누가 참여했는지의 기록. 여기서 재협업 대상을 고릅니다.</p>
          </div>
          <div className="plan">
            <span className="pk">BRANDS</span>
            <h3>{cnt(brands.length)}곳</h3>
            <p>거래처. 브랜드별로 어떤 인플루언서가 맞았는지 쌓입니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
