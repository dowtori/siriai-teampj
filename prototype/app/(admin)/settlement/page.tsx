import Link from 'next/link'
import { getDb, won, cnt, rate, ymd } from '@/lib/db'

/* 정산 — 계산서 발급일을 기준으로 잡는다. */

export default function SettlementPage() {
  const db = getDb()
  const { campaigns, byMonth, kpi } = db

  const feeTotal = campaigns.reduce((s, c) => s + (c.finance.fee ?? 0), 0)
  const unpaid = campaigns.filter((c) => (c.finance.revenue ?? 0) > 0 && c.finance.paymentStatus !== '입금완료')
  const noInvoice = campaigns.filter((c) => (c.finance.revenue ?? 0) > 0 && !c.finance.invoiceDate)

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">SETTLEMENT</p>
          <h1>정산</h1>
          <p className="lede">
            매출은 세금계산서 발급일에 잡습니다. 견적서 발급일과는 별개입니다.
          </p>
        </div>
        <div className="right">
          <Link className="btn" href="/">홈 →</Link>
        </div>
      </div>

      <div className="scores">
        <div className="score">
          <span className="sk">REVENUE</span>
          <span className="sv">{won(kpi.revenue)}</span>
          <span className="sd">공급가 합계</span>
        </div>
        <div className="score">
          <span className="sk">CREATOR FEE</span>
          <span className="sv">{won(feeTotal)}</span>
          <span className="sd">인플루언서 원고료</span>
        </div>
        <div className="score">
          <span className="sk">PROFIT</span>
          <span className="sv">{won(kpi.profit)}</span>
          <span className="sd">마진 {rate(kpi.margin)}</span>
        </div>
        <div className="score">
          <span className="sk">UNPAID</span>
          <span className="sv">{won(kpi.outstanding)}</span>
          <span className="sd">{unpaid.length}건 미입금</span>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>월별 집계</h2>
          <p>계산서 발급일 기준</p>
        </div>
        <div className="panel scroll">
          <table>
            <thead>
              <tr>
                <th>귀속</th>
                <th className="n">캠페인</th>
                <th className="n">매출</th>
                <th className="n">순이익</th>
                <th className="n">마진</th>
              </tr>
            </thead>
            <tbody>
              {byMonth.map((m) => (
                <tr key={m.month}>
                  <td className="num">{m.month}</td>
                  <td className="n">{m.count}건</td>
                  <td className="n">{won(m.revenue)}</td>
                  <td className="n">{won(m.profit)}</td>
                  <td className="n">{rate(m.revenue ? m.profit / m.revenue : null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>입금 대기</h2>
          <p>{unpaid.length}건 · {won(kpi.outstanding)}</p>
        </div>
        <div className="panel">
          <div className="rows">
            {unpaid.length === 0 ? (
              <div style={{ padding: 34, color: 'var(--ink-3)', fontSize: 14 }}>입금 대기 건이 없습니다.</div>
            ) : unpaid.map((c) => (
              <Link className="row" key={c.id} href={`/campaigns/${c.id}`}>
                <span className="dot issue" />
                <span className="lead">
                  <span className="t">{c.name}</span>
                  <span className="s">{c.brandName ?? '거래처 미기재'} · 계산서 {ymd(c.finance.invoiceDate)}</span>
                </span>
                <span className="tail">
                  <span className="met"><b>{won(c.finance.revenue)}</b><span>UNPAID</span></span>
                  <span className="arrow">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>발급 대기</h2>
          <p>계산서를 낼 차례가 된 건 {noInvoice.length}건</p>
        </div>
        <div className="panel">
          <div className="bar">
            <input className="field" placeholder="캠페인 · 거래처로 찾기" readOnly />
            <div className="right">
              <button className="btn">회계로 내보내기</button>
              <button className="btn pri">발급 대상 확정</button>
            </div>
          </div>
          <div className="rows">
            {noInvoice.slice(0, 5).map((c) => (
              <div className="row" key={c.id} style={{ cursor: 'default' }}>
                <span className="dot" />
                <span className="lead">
                  <span className="t">{c.name}</span>
                  <span className="s">{c.brandName ?? '거래처 미기재'}</span>
                </span>
                <span className="tail">
                  <span className="met"><b>{won(c.finance.revenue)}</b><span>공급가</span></span>
                  <span className="chip line">발급 전</span>
                </span>
              </div>
            ))}
            {noInvoice.length === 0 && (
              <div style={{ padding: 30, color: 'var(--ink-3)', fontSize: 14 }}>발급 대기 건이 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>정산 화면에 더 붙을 것</h2>
        </div>
        <div className="plans">
          <div className="plan">
            <span className="pk">CREATOR</span>
            <h3>인플루언서 정산</h3>
            <p>선정 인원별 고료와 지급 상태. 지금은 슬랙으로 자료를 받고 따로 계산합니다.</p>
          </div>
          <div className="plan">
            <span className="pk">TAX</span>
            <h3>원천징수 · 정산자료</h3>
            <p>주민등록번호와 통장사본을 받을지가 결정 대기 중입니다. 받으면 3.3% 처리와 암호화 저장까지 들어옵니다.</p>
          </div>
          <div className="plan">
            <span className="pk">EXPORT</span>
            <h3>회계 내보내기</h3>
            <p>계산서 발급 대상을 확정해 쓰던 회계 도구로 넘깁니다. 발급 자체를 시스템이 할지는 결정 대기 중입니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
