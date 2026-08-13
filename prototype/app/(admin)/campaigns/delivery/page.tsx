import { getDb, cnt } from '@/lib/db'
import Act from '@/app/ui/Act'

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
              <Act
                id="dl-invoice" variant="btn" label="송장 일괄 등록" doneLabel="송장 등록됨"
                eyebrow="SHIPPING" title="송장 일괄 등록"
                intro={<><b>택배사에서 받은 송장을 한 번에 넣습니다</b>붙으면 인플루언서에게 발송 알림이 나갑니다.</>}
                fields={[
                  { name: 'car', label: '택배사', type: 'select', value: '로젠', options: ['로젠', '롯데', 'CJ대한통운', '한진', '우체국'] },
                  { name: 'list', label: '송장 목록', type: 'textarea', required: true,
                    placeholder: '이름,송장번호\n김수진,123456789012\n최규희,123456789013' },
                ]}
                confirmLabel="등록" doneTitle="송장을 등록했습니다"
                doneNote="해당 인원의 단계가 &lsquo;출고&rsquo;로 넘어갔고 발송 알림톡이 나갔습니다."
              />
              <Act
                id="dl-remind" variant="btn pri" label="리마인드 보내기" doneLabel="리마인드 발송됨"
                eyebrow="NOTIFY" title="업로드 리마인드"
                intro={<><b>기한이 지난 인원에게만 보냅니다</b>같은 종류의 일감을 모아 한 번에 처리하는 자리입니다.</>}
                fields={[
                  { name: 'tgt', label: '대상', type: 'select', value: '업로드 미완 전체',
                    options: ['업로드 미완 전체', '기한 지난 인원만', '수령 후 3일 경과'] },
                  { name: 'msg', label: '덧붙일 말', type: 'textarea', placeholder: '선택 입력' },
                ]}
                confirmLabel="보내기" doneTitle="리마인드를 보냈습니다"
                doneNote="알림톡이 나갔습니다. 대시보드의 리마인드 건수에서 빠집니다."
              />
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
              <Act
                id="dl-addr" variant="btn" label="주소 요청 보내기" doneLabel="주소 요청됨"
                eyebrow="REQUEST" title="주소 요청"
                intro={<><b>주소 대기 2명에게 보냅니다</b>인플루언서 페이지에서 직접 입력합니다. 개별 연락으로 받아 옮겨 적을 필요가 없습니다.</>}
                confirmLabel="요청 보내기" doneTitle="주소를 요청했습니다"
                doneNote="알림톡이 나갔습니다. 입력하면 자동으로 배송 대기로 넘어갑니다."
              />
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
