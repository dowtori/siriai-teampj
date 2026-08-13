import { getDb, cnt } from '@/lib/db'
import Act from '@/app/ui/Act'

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
                <Act
                  id="rv-next" variant="btn pri" label="체크하고 다음 →" doneLabel="검수 저장됨"
                  eyebrow="REVIEW" title="이 인원 검수 저장"
                  intro={<><b>{cur?.name ?? ''} 검수 결과를 저장합니다</b>저장하면 다음 대기 인원으로 넘어갑니다.</>}
                  fields={[
                    { name: 'res', label: '결과', type: 'select', value: '통과',
                      options: ['통과', '수정 요청', '보류'] },
                    { name: 'memo', label: '메모', type: 'textarea', placeholder: '가드닝·해시태그 등 남길 말' },
                  ]}
                  confirmLabel="저장하고 다음"
                  doneTitle="검수를 저장했습니다"
                  doneNote="다음 대기 인원으로 넘어갑니다. 결과에 따라 인플루언서에게 알림이 나갑니다."
                />
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
                <Act
                  id="rv-redo" variant="btn" label="재업로드 요청" doneLabel="재업로드 요청됨"
                  eyebrow="REQUEST" title="재업로드 요청"
                  intro={<><b>인플루언서에게 수정을 요청합니다</b>알림톡으로 사유와 함께 전달됩니다.</>}
                  fields={[
                    { name: 'why', label: '사유', type: 'select', value: '해시태그 누락',
                      options: ['해시태그 누락', '협찬 표기 누락', '가이드라인 불일치', '공동작업자 미설정', '기타'] },
                    { name: 'memo', label: '요청 내용', type: 'textarea', required: true,
                      placeholder: '무엇을 어떻게 고쳐야 하는지 적어주세요' },
                  ]}
                  confirmLabel="요청 보내기" doneTitle="재업로드를 요청했습니다"
                  doneNote="알림톡이 나갔습니다. 다시 올라오면 검수 대기로 돌아옵니다."
                />
                <Act
                  id="rv-done" variant="btn pri" label="검수 완료" doneLabel="검수 완료됨"
                  eyebrow="COMPLETE" title="검수 완료 처리"
                  intro={<><b>이 캠페인 검수를 마칩니다</b>완료하면 정산 단계로 넘어가고, 인플루언서에게 정산자료 제출 안내가 나갑니다.</>}
                  summary={
                    <div className="trio">
                      <div><span className="k">검수 대상</span><span className="v">{people.length}</span></div>
                      <div><span className="k">통과</span><span className="v">{people.filter((p) => p.done).length}</span></div>
                      <div><span className="k">남음</span><span className="v">{people.filter((p) => !p.done).length}</span></div>
                    </div>
                  }
                  confirmLabel="검수 완료" doneTitle="검수를 완료했습니다"
                  doneNote="정산 단계로 넘어갔습니다. 인플루언서에게 정산자료 제출 안내가 나갔습니다."
                />
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
