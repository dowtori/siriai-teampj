import { getDb, won, cnt } from '@/lib/db'

/* 제안 · 견적 — 담으면 금액이 바로 계산되는 화면. */

export default function Proposals() {
  const db = getDb()
  const picks = db.participations
    .filter((p) => p.selected && p.proposedFee)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.displayName,
      handle: p.handleUrl?.replace('instagram.com/', '@') ?? '계정 미확인',
      followers: p.followers,
      fee: p.proposedFee ?? 0,
    }))

  const fee = picks.reduce((s, p) => s + p.fee, 0)
  const revenue = Math.round(fee * 2.1)
  const profit = revenue - fee

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">SALES</p>
          <h1>제안 · 견적</h1>
          <p className="lede">
            인플루언서를 담으면 견적이 따라 움직입니다. 마진을 보면서 인원을 조정합니다.
          </p>
        </div>
        <div className="right">
          <span className="chip line">레이아웃 미리보기</span>
        </div>
      </div>

      <div className="zone">
        <div className="work">
          <div className="panel">
            <div className="bar">
              <b style={{ fontSize: 14 }}>제안서</b>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>무신사 · 26년 9월 1주차</span>
              <div className="right">
                <button className="btn">명단에서 담기</button>
              </div>
            </div>

            <div className="pad">
              <div className="gh-stack" style={{ marginBottom: 22 }}>
                <span className="gh t" />
                <span className="gh l w1" />
                <span className="gh l w2" />
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-3)' }}>
                  캠페인 개요와 제품 설명이 들어갑니다. 거래처 정보에서 자동으로 채워집니다.
                </p>
              </div>
            </div>

            <div className="rows">
              {picks.map((p) => (
                <div className="row" key={p.id} style={{ cursor: 'default' }}>
                  <span className="av" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--line-2)' }} />
                  <span className="lead">
                    <span className="t">{p.name}</span>
                    <span className="s">{p.handle} · 팔로워 {cnt(p.followers)}</span>
                  </span>
                  <span className="tail">
                    <span className="met"><b>{won(p.fee)}</b><span>원고료</span></span>
                    <span className="met"><b>{won(Math.round(p.fee * 2.1))}</b><span>제안가</span></span>
                  </span>
                </div>
              ))}
            </div>

            <div className="actionbar">
              <span className="sum"><b>{picks.length}</b>명 담음</span>
              <div className="right">
                <button className="btn">미리보기</button>
                <button className="btn pri">제안서 보내기</button>
              </div>
            </div>
          </div>

          <div className="side">
            <div className="panel">
              <div className="bar"><b style={{ fontSize: 14 }}>견적</b></div>
              <div className="pad-sm">
                <div className="trio" style={{ gridTemplateColumns: '1fr', border: 0, background: 'transparent', gap: 0 }}>
                  <div style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}>
                    <span className="k">제안가 (공급가)</span>
                    <span className="v">{won(revenue)}</span>
                  </div>
                  <div style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}>
                    <span className="k">원고료</span>
                    <span className="v">{won(fee)}</span>
                  </div>
                  <div style={{ padding: '10px 0' }}>
                    <span className="k">순이익 · 마진</span>
                    <span className="v">{won(profit)}</span>
                    <span className="s">{revenue ? Math.round((profit / revenue) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
              <div className="actionbar" style={{ position: 'static', boxShadow: 'none' }}>
                <button className="btn" style={{ width: '100%', justifyContent: 'center' }}>견적서 발급</button>
              </div>
            </div>

            <div className="panel">
              <div className="pad-sm">
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  거래처 단가 정책이 정해지면 제안가가 자동으로 계산됩니다. 지금은 배수를 예시로 넣었습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
