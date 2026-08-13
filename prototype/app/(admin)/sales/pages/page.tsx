import { getDb } from '@/lib/db'
import Act from '@/app/ui/Act'

/* 브랜드 페이지 발급 — 코드를 만들고, 무엇을 보여줄지 고르고, 미리 본다. */

export default function BrandPages() {
  const db = getDb()
  const brands = db.brands.slice(0, 6)

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">SALES</p>
          <h1>브랜드 페이지 발급</h1>
          <p className="lede">
            거래처마다 코드를 만들어 전달합니다. 무엇을 열어줄지 고르고 오른쪽에서 바로 확인합니다.
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
              <b style={{ fontSize: 14 }}>발급한 코드</b>
              <div className="right">
                <Act id="bp-code" variant="btn pri" label="코드 만들기" doneLabel="코드 발급됨" eyebrow="ISSUE" title="브랜드 페이지 코드 발급" intro={<><b>거래처에 전달할 코드를 만듭니다</b>로그인 없이 코드만으로 들어옵니다.</>} fields={[{name:"brand",label:"거래처",type:"select",options:["무신사","아울러엘앤비 주식회사","에코디엠랩주식회사","(주)필블랭크","루씨드"],value:"무신사"},{name:"exp",label:"만료",type:"select",options:["무기한","30일","90일","캠페인 종료까지"],value:"무기한"}]} confirmLabel="발급" doneTitle="코드를 발급했습니다" doneNote="거래처에 전달하시면 바로 들어올 수 있습니다. 열람 기록이 함께 쌓입니다." />
              </div>
            </div>
            <div className="rows">
              {brands.map((b, i) => (
                <div className="row" key={b.id} style={{ cursor: 'default' }}>
                  <span className={`dot ${i === 0 ? 'live' : ''}`} />
                  <span className="lead">
                    <span className="t">{b.name}</span>
                    <span className="s">캠페인 {b.campaignCount}건 · 코드 미발급</span>
                  </span>
                  <span className="tail">
                    <span className="gh l" style={{ width: 78 }} />
                    <span className="chip line">발급</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="actionbar">
              <span className="sum">코드를 만들면 열람 기록이 함께 쌓입니다</span>
              <div className="right">
                <Act id="bp-log" variant="btn" label="열람 기록 보기" doneLabel="열람 기록 확인함" eyebrow="LOG" title="열람 기록" intro={<><b>누가 언제 열었는지 남습니다</b>영업 후속 연락의 근거가 됩니다.</>} confirmLabel="확인" doneTitle="열람 기록" doneNote="코드를 발급하면 이 자리에 접속 기록이 쌓입니다." />
              </div>
            </div>
          </div>

          <div className="side">
            <div className="panel">
              <div className="bar"><b style={{ fontSize: 14 }}>보여줄 항목</b></div>
              <div className="pad-sm form" style={{ gap: 14 }}>
                {[
                  ['캠페인 현황', true],
                  ['선정 인플루언서', true],
                  ['콘텐츠 링크', true],
                  ['리포트', false],
                  ['비용', false],
                ].map(([label, on]) => (
                  <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`toggle ${on ? 'on' : ''}`} />
                    <span style={{ fontSize: 13.5, color: on ? 'var(--ink)' : 'var(--ink-3)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="frame">
              <div className="frame-top">
                <i /><i /><i />
                <span>siriai.co.kr / b / ••••••</span>
              </div>
              <div className="frame-bd">
                <span className="gh t" />
                <span className="gh l w1" />
                <span className="gh l w2" />
                <div className="gh-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: 6 }}>
                  <span className="gh sq" />
                  <span className="gh sq" />
                  <span className="gh sq" />
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="pad-sm">
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  같은 페이지를 조금 바꿔 광고와 영업메일 도착 페이지로도 씁니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
