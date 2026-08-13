import { getDb, cnt } from '@/lib/db'

/* 검수 — 왼쪽에서 사람을 고르고 오른쪽에서 체크한다.
   지금 쓰는 검수시트 세 단계를 그대로 옮긴 작업 화면. */

const PRE = ['선정안내', '개별요청', '답변']
const CONTENT = ['업로드 여부', '가이드라인 준수', '공동작업자', '해시태그', '가드닝']
const POST = ['고료', '정산자료 수령', '드라이브 저장', '포트폴리오 적합도', '인터뷰 적합도']

export default function Review() {
  const db = getDb()
  const people = db.participations
    .filter((p) => p.selected && p.contentUrl)
    .slice(0, 8)
    .map((p, i) => ({
      id: p.id,
      name: p.displayName,
      handle: p.handleUrl?.replace('instagram.com/', '@') ?? '계정 미확인',
      on: i === 0,
      done: i < 3,
    }))

  const cur = people[0]

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">CAMPAIGNS</p>
          <h1>검수</h1>
          <p className="lede">
            한 명씩 열어 체크하고 다음으로 넘깁니다. 상태가 바뀌면 인플루언서에게 알림이 나갑니다.
          </p>
        </div>
        <div className="right">
          <span className="chip line">레이아웃 미리보기</span>
        </div>
      </div>

      <div className="zone">
        <div className="flow">
          <span className="fs">사전 관리 <span className="n">3</span></span>
          <span className="fs on">콘텐츠 검수 <span className="n">5</span></span>
          <span className="fs">사후 관리 <span className="n">5</span></span>
        </div>

        <div className="work">
          <div className="panel">
            <div className="bar">
              <b style={{ fontSize: 14 }}>{cur?.name ?? '—'}</b>
              <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{cur?.handle}</span>
              <div className="right">
                <button className="btn">이전</button>
                <button className="btn pri">체크하고 다음 →</button>
              </div>
            </div>

            <div className="pad" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,220px)', gap: 'var(--gap)' }}>
              <div className="gh-stack">
                <span className="gh b" style={{ height: 190 }} />
                <span className="gh l w2" />
                <span className="gh l w3" />
                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  올라온 콘텐츠를 여기서 바로 봅니다. 시트에 링크만 적고 새 탭으로 열던 일이 없어집니다.
                </p>
              </div>
              <div className="gh-stack">
                <span className="gh t" style={{ width: '70%' }} />
                <span className="gh l w1" />
                <span className="gh l w2" />
                <span className="gh l w1" />
                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  가이드라인 원문을 나란히 두고 대조합니다.
                </p>
              </div>
            </div>

            <div className="pad" style={{ borderTop: '1px solid var(--line-2)' }}>
              <div className="steps">
                <div className="step">
                  <div className="sh"><b>사전 관리</b><span className="n">3/3</span></div>
                  <div className="checks">
                    {PRE.map((c) => (
                      <span className="check on" key={c}><i>✓</i>{c}</span>
                    ))}
                  </div>
                </div>
                <div className="step">
                  <div className="sh"><b>콘텐츠 검수</b><span className="n">3/5</span></div>
                  <div className="checks">
                    {CONTENT.map((c, i) => (
                      <span className={`check ${i < 3 ? 'on' : ''}`} key={c}><i>✓</i>{c}</span>
                    ))}
                  </div>
                </div>
                <div className="step">
                  <div className="sh"><b>사후 관리</b><span className="n">0/5</span></div>
                  <div className="checks">
                    {POST.map((c) => (
                      <span className="check" key={c}><i>✓</i>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="actionbar">
              <span className="sum">가드닝과 공동작업자가 남았습니다</span>
              <div className="right">
                <button className="btn">재업로드 요청</button>
                <button className="btn pri">검수 완료</button>
              </div>
            </div>
          </div>

          <div className="side">
            <div className="panel">
              <div className="bar">
                <b style={{ fontSize: 14 }}>검수 대기</b>
                <div className="right"><span className="chip sel">{cnt(people.length)}</span></div>
              </div>
              <div className="ilist">
                {people.map((p) => (
                  <div className={`iitem ${p.on ? 'on' : ''}`} key={p.id}>
                    <span className="it">{p.name}</span>
                    <span className="is">
                      {p.handle} · {p.done ? '콘텐츠 검수 중' : '사전 관리'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
