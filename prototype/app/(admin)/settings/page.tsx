import Act from '@/app/ui/Act'
/* 관리 · 설정 — 왼쪽에서 항목을 고르고 오른쪽에서 바꾼다. */

const MENU = ['구성원 · 권한', '알림 문구', '접근 코드', '조회 기록', '거래처 단가', '캠페인 단계']

const MEMBERS = [
  { n: '운영 총괄', r: '전체', pii: true },
  { n: '캠페인 담당', r: '캠페인 · 검수', pii: true },
  { n: '세일즈', r: '거래처 · 제안', pii: false },
  { n: '외부 협력', r: '지정 캠페인', pii: false },
]

export default function Settings() {
  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">SETTINGS</p>
          <h1>관리 · 설정</h1>
          <p className="lede">
            누가 무엇을 볼 수 있는지, 어떤 문구로 알림이 나가는지를 정하는 자리입니다.
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
              <b style={{ fontSize: 14 }}>구성원 · 권한</b>
              <div className="right">
                <Act id="st-invite" variant="btn pri" label="구성원 초대" doneLabel="초대 보냄" eyebrow="MEMBER" title="구성원 초대" fields={[{name:"em",label:"메일",placeholder:"name@siriai.co.kr",required:true},{name:"role",label:"권한",type:"select",options:["운영 총괄","캠페인 담당","세일즈","외부 협력"],value:"캠페인 담당"},{name:"pii",label:"개인정보 열람",type:"select",options:["가림","열람 허용"],value:"가림"}]} confirmLabel="초대 보내기" doneTitle="초대를 보냈습니다" doneNote="메일로 초대장이 갔습니다. 수락하면 지정한 권한으로 들어옵니다." />
              </div>
            </div>

            <div className="rows">
              {MEMBERS.map((m) => (
                <div className="row" key={m.n} style={{ cursor: 'default' }}>
                  <span className="av" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--line-2)' }} />
                  <span className="lead">
                    <span className="t">{m.n}</span>
                    <span className="s">볼 수 있는 범위 · {m.r}</span>
                  </span>
                  <span className="tail">
                    <span className={`chip ${m.pii ? 'sel' : 'line'}`}>
                      개인정보 {m.pii ? '열람' : '가림'}
                    </span>
                    <span className="arrow">→</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="pad" style={{ borderTop: '1px solid var(--line-2)' }}>
              <div className="form">
                <div className="frow">
                  <div className="fl">
                    <b>개인정보 기본 처리</b>
                    <span>실명 · 연락처 · 주소를 목록에 내보낼지</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="toggle on" />
                    <span style={{ fontSize: 13.5 }}>가리고, 열어야 보이게</span>
                  </div>
                </div>
                <div className="frow">
                  <div className="fl">
                    <b>조회 기록</b>
                    <span>누가 언제 열었는지 남기기</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="toggle on" />
                    <span style={{ fontSize: 13.5 }}>남김</span>
                  </div>
                </div>
                <div className="frow">
                  <div className="fl">
                    <b>로그인 방식</b>
                    <span>결정 대기 중인 항목</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="chip sel">회사 구글 계정</span>
                    <span className="chip line">자체 계정</span>
                    <span className="chip line">초대받은 사람만</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="actionbar">
              <span className="sum">바꾼 내용은 즉시 적용됩니다</span>
              <div className="right">
                <Act id="st-undo" variant="btn" label="되돌리기" doneLabel="되돌림" eyebrow="UNDO" title="변경 되돌리기" intro={<><b>마지막 저장 시점으로 돌립니다</b>바꾼 내용은 사라집니다.</>} confirmLabel="되돌리기" doneTitle="되돌렸습니다" doneNote="마지막 저장 상태로 돌아갔습니다." />
                <Act id="st-save" variant="btn pri" label="저장" doneLabel="저장됨" eyebrow="SAVE" title="설정 저장" intro={<><b>바꾼 내용을 적용합니다</b>개인정보 처리와 조회 기록 설정은 즉시 반영됩니다.</>} confirmLabel="저장" doneTitle="저장했습니다" doneNote="모든 구성원에게 즉시 적용됐습니다." />
              </div>
            </div>
          </div>

          <div className="side">
            <div className="panel">
              <div className="ilist">
                {MENU.map((m, i) => (
                  <div className={`iitem ${i === 0 ? 'on' : ''}`} key={m}>
                    <span className="it">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="pad-sm">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span className="dot issue" />
                  <b style={{ fontSize: 13.5 }}>알림 문구</b>
                </div>
                <div className="gh-stack">
                  <span className="gh l w1" />
                  <span className="gh l w2" />
                </div>
                <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  발신번호 등록과 문구 심사에 3–5 영업일이 걸립니다. 착수 첫날 신청해야 합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
