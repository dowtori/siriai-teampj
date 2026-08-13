import { getDb, cnt } from '@/lib/db'

/* 배송 · 콘텐츠 — 보낸 것과 올라온 것을 한 화면에서 본다. */

export default function Delivery() {
  const db = getDb()
  const sel = db.participations.filter((p) => p.selected)
  const rows = sel.slice(0, 7).map((p, i) => ({
    id: p.id,
    name: p.displayName,
    handle: p.handleUrl?.replace('instagram.com/', '@') ?? '계정 미확인',
    stage: i < 2 ? '주소 대기' : i < 4 ? '출고' : i < 6 ? '수령' : '업로드',
  }))

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">CAMPAIGNS</p>
          <h1>배송 · 콘텐츠</h1>
          <p className="lede">
            주소를 받고 제품을 보내고 콘텐츠가 올라오기까지를 한 줄로 봅니다. 늦는 사람만 골라 리마인드를 보냅니다.
          </p>
        </div>
        <div className="right">
          <span className="chip line">레이아웃 미리보기</span>
        </div>
      </div>

      <div className="zone">
        <div className="flow">
          <span className="fs">주소 대기 <span className="n">2</span></span>
          <span className="fs on">출고 <span className="n">2</span></span>
          <span className="fs">수령 <span className="n">2</span></span>
          <span className="fs">업로드 <span className="n">1</span></span>
        </div>

        <div className="panel">
          <div className="bar">
            <input className="field" placeholder="이름 · 송장번호로 찾기" readOnly />
            <div className="right">
              <button className="btn">송장 일괄 등록</button>
              <button className="btn pri">리마인드 보내기</button>
            </div>
          </div>
          <div className="rows">
            {rows.map((r) => (
              <div className="row" key={r.id} style={{ cursor: 'default' }}>
                <span className={`dot ${r.stage === '업로드' ? 'live' : r.stage === '주소 대기' ? 'issue' : ''}`} />
                <span className="lead">
                  <span className="t">{r.name}</span>
                  <span className="s">{r.handle}</span>
                </span>
                <span className="tail">
                  <span className="chip line">{r.stage}</span>
                  <span className="gh l" style={{ width: 92 }} />
                  <span className="arrow">→</span>
                </span>
              </div>
            ))}
          </div>
          <div className="actionbar">
            <span className="sum">선정 <b>{cnt(sel.length)}</b>명 · 주소 대기 <b>2</b>명</span>
            <div className="right">
              <button className="btn">주소 요청 보내기</button>
            </div>
          </div>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>올라온 콘텐츠</h2>
          <p>썸네일로 훑고 눌러서 검수로 넘어갑니다</p>
        </div>
        <div className="panel">
          <div className="pad">
            <div className="gh-grid">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="gh sq" />
                  <span className="gh l w2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
