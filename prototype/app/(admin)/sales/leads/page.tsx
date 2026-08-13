import Act from '@/app/ui/Act'
/* 랜딩 · 리드 — 들어온 문의를 읽고 거래처로 넘긴다. */

const LEADS = [
  { t: '문의 · 뷰티 브랜드', s: '광고 랜딩 · 2시간 전', on: true },
  { t: '문의 · 식품 브랜드', s: '영업메일 · 어제' },
  { t: '문의 · 패션 브랜드', s: '브랜드 페이지 · 3일 전' },
  { t: '문의 · 뷰티 브랜드', s: '소개 · 5일 전' },
  { t: '문의 · 헬스케어', s: '광고 랜딩 · 지난주' },
]

export default function Leads() {
  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">SALES</p>
          <h1>랜딩 · 리드</h1>
          <p className="lede">
            광고와 영업메일에서 들어온 문의가 여기로 모입니다. 읽고 바로 거래처로 넘깁니다.
          </p>
        </div>
        <div className="right">
          <span className="chip line">레이아웃 미리보기</span>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>운영 중인 랜딩</h2>
          <p>어느 경로에서 문의가 오는지 함께 봅니다</p>
        </div>
        <div className="plans">
          {['광고 랜딩', '영업메일 도착 페이지', '브랜드 페이지'].map((n) => (
            <div className="panel" key={n}>
              <div className="pad-sm">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span className="dot live" />
                  <b style={{ fontSize: 13.5 }}>{n}</b>
                </div>
                <div className="gh-stack">
                  <span className="gh l w1" />
                  <span className="gh l w3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>문의함</h2>
          <p>왼쪽에서 고르면 오른쪽에서 읽습니다</p>
        </div>
        <div className="panel">
          <div className="inbox">
            <div className="ilist">
              {LEADS.map((l, i) => (
                <div className={`iitem ${l.on ? 'on' : ''}`} key={i}>
                  <span className="it">{l.t}</span>
                  <span className="is">{l.s}</span>
                </div>
              ))}
            </div>
            <div className="iread">
              <div>
                <span className="gh t" />
                <div className="gh-stack" style={{ marginTop: 14 }}>
                  <span className="gh l w1" />
                  <span className="gh l w1" />
                  <span className="gh l w2" />
                  <span className="gh l w3" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                <span className="chip line">광고 랜딩</span>
                <span className="chip line">뷰티</span>
                <span className="chip sel">미응대</span>
              </div>
              <div style={{ display: 'flex', gap: 9, marginTop: 'auto' }}>
                <Act id="ld-reg" variant="btn pri" label="거래처로 등록" doneLabel="거래처 등록됨" eyebrow="LEAD" title="거래처로 등록" fields={[{name:"nm",label:"거래처명",placeholder:"회사명",required:true},{name:"pic",label:"담당자",placeholder:"이름 · 직함"},{name:"memo",label:"메모",type:"textarea",placeholder:"문의 내용 요약"}]} confirmLabel="등록" doneTitle="거래처로 등록했습니다" doneNote="세일즈 · 거래처 목록에 추가됐습니다. 바로 제안서를 만들 수 있습니다." />
                <Act id="ld-reply" variant="btn" label="답장" doneLabel="답장 보냄" eyebrow="REPLY" title="문의에 답장" fields={[{name:"body",label:"내용",type:"textarea",required:true,placeholder:"답변을 적어주세요"}]} confirmLabel="보내기" doneTitle="답장을 보냈습니다" doneNote="문의하신 메일로 발송했습니다. 상태가 응대 완료로 바뀝니다." />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
