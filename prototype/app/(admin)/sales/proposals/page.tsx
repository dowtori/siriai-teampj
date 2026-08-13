import { getDb, won, cnt } from '@/lib/db'
import Act from '@/app/ui/Act'

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
                <Act id="pp-add" variant="btn" label="명단에서 담기" doneLabel="인원 담김" eyebrow="POOL" title="명단에서 인원 담기" intro={<><b>협업 경험 명단에서 조건으로 좁혀 담습니다</b>담으면 오른쪽 견적이 따라 움직입니다.</>} fields={[{name:"cat",label:"카테고리",type:"select",options:["뷰티","패션","건강가전","전체"],value:"뷰티"},{name:"tier",label:"팔로워",type:"select",options:["1만 이하","1만~5만","5만 이상","전체"],value:"1만~5만"},{name:"n",label:"담을 인원",placeholder:"예: 10"}]} confirmLabel="담기" doneTitle="인원을 담았습니다" doneNote="제안서에 추가됐고 견적이 다시 계산됐습니다." />
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
                <Act id="pp-prev" variant="btn" label="미리보기" doneLabel="미리보기 확인함" eyebrow="PREVIEW" title="제안서 미리보기" intro={<><b>거래처가 받게 될 화면입니다</b>브랜드 페이지와 같은 모양으로 나갑니다.</>} confirmLabel="확인" doneTitle="미리보기" doneNote="실제로는 여기서 거래처가 볼 화면이 그대로 열립니다." />
                <Act id="pp-send" variant="btn pri" label="제안서 보내기" doneLabel="제안서 발송됨" eyebrow="SEND" title="제안서 보내기" fields={[{name:"to",label:"받는 메일",placeholder:"name@company.com",required:true},{name:"due",label:"회신 희망일",type:"select",options:["1일 이내","3일 이내","이번 주 내"],value:"3일 이내"},{name:"memo",label:"덧붙일 말",type:"textarea"}]} confirmLabel="보내기" doneTitle="제안서를 보냈습니다" doneNote="브랜드 페이지 링크와 함께 발송했습니다. 열람하면 알림이 옵니다." />
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
