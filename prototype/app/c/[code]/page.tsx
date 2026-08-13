import { notFound } from 'next/navigation'
import { getCreatorView } from '@/lib/public'
import { getDb, won, cnt, ymd } from '@/lib/db'

/* 인플루언서 페이지 — 폰으로 본다.
   한 화면에 하나씩, 다음에 할 일이 제일 위에. */

const STEPS = [
  { k: 'selected', l: '선정' },
  { k: 'shipped', l: '배송' },
  { k: 'posted', l: '업로드' },
  { k: 'settled', l: '정산' },
] as const

const NEXT: Record<string, { b: string; s: string }> = {
  selected: { b: '주소를 알려주세요', s: '제품을 보내드리려면 받으실 주소가 필요합니다.' },
  shipped: { b: '콘텐츠를 올려주세요', s: '제품이 출고됐습니다. 받으신 뒤 가이드에 맞춰 올려주세요.' },
  posted: { b: '검수 중입니다', s: '올려주신 콘텐츠를 확인하고 있습니다. 끝나면 알려드릴게요.' },
  settled: { b: '정산이 끝났습니다', s: '고료 지급이 완료됐습니다.' },
}

/** 캠페인 이름 — 없으면 진행시트 제목에서 읽을 수 있게 다듬는다 */
function label(j: { campaign: { name: string } | null; part: { trackerTitle: string } }) {
  if (j.campaign) return j.campaign.name.replace(/^\[[^\]]+\]\s*/, '')
  const t = j.part.trackerTitle.split('_')
  const brand = t[0]?.trim()
  const when = t[t.length - 1]?.trim()
  return [brand, when].filter(Boolean).join(' · ') || '캠페인'
}

export default async function CreatorPage(props: PageProps<'/c/[code]'>) {
  const { code } = await props.params
  const v = getCreatorView(code)
  if (!v) notFound()

  const db = getDb()
  const active = v.joined.filter((j) => j.stage !== 'settled')
  const done = v.joined.filter((j) => j.stage === 'settled')

  // 지원할 수 있는 캠페인 — 지금 모집 중인 건
  const open = db.campaigns
    .filter((c) => !c.status.includes('완전 종료'))
    .slice(0, 3)

  const first = active[0] ?? v.joined[0]
  const next = first ? NEXT[first.stage] : null

  return (
    <div className="mob">
      <header className="mob-top">
        <div className="mob-in">
          <span className="mk">SIRIAI</span>
          <div className="right">
            <span className="code-chip">{v.code}</span>
          </div>
        </div>
      </header>

      <div className="mob-in" style={{ flex: 1 }}>
        <section className="mob-hero">
          <h1 className="hi">
            <em>{v.name}</em>님,<br />
            {active.length > 0 ? `진행 중인 캠페인이 ${active.length}건 있어요.` : '새 캠페인을 기다리고 있어요.'}
          </h1>
          {next && <p>{next.s}</p>}
        </section>

        {next && (
          <section className="mob-sec" style={{ borderTop: 0, paddingTop: 0 }}>
            <div className={`task ${first.stage === 'settled' ? 'done' : first.stage === 'posted' ? 'wait' : ''}`}>
              <div className="tn">
                <b>{next.b}</b>
                <span>{label(first)}</span>
              </div>
            </div>
          </section>
        )}

        <section className="mob-sec">
          <div className="mob-sh">
            <h2>진행 중</h2>
            <p>{active.length}건</p>
          </div>
          <div className="mcards">
            {active.length === 0 && (
              <div className="mcard">
                <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>지금 진행 중인 캠페인이 없습니다.</span>
              </div>
            )}
            {active.map((j, i) => {
              const si = STEPS.findIndex((s) => s.k === j.stage)
              return (
                <article className="mcard" key={i}>
                  <div>
                    <div className="mt">{label(j)}</div>
                    <div className="ms">
                      {[j.campaign?.brandName, `고료 ${won(j.part.proposedFee)}`].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className="dots">
                    {STEPS.map((s, k) => (
                      <span className={`st ${k < si ? 'on' : ''} ${k === si ? 'now' : ''}`} key={s.k}>
                        <i />
                        <span>{s.l}</span>
                      </span>
                    ))}
                  </div>
                  <div className="sep" />
                  <div className="mrow">
                    <span className="tag">
                      {j.campaign?.dates.due ? `마감 ${ymd(j.campaign.dates.due)}` : '일정 안내 예정'}
                    </span>
                    {j.part.shipping && <span className="tag">출고 완료</span>}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mob-sec">
          <div className="mob-sh">
            <h2>지원할 수 있어요</h2>
            <p>{open.length}건</p>
          </div>
          <div className="mcards">
            {open.map((c) => (
              <article className="open-card" key={c.id}>
                <div>
                  <div className="ot">{c.name.replace(/^\[[^\]]+\]\s*/, '')}</div>
                  <div className="ms" style={{ marginTop: 5 }}>
                    {c.brandName ?? ''} {c.detail ? `· ${c.detail.replace(/\n/g, ' ')}` : ''}
                  </div>
                </div>
                <div className="tags">
                  <span className="tag hot">모집 중</span>
                  {c.counts.offered && <span className="tag">{cnt(c.counts.offered)}명 모집</span>}
                  {c.dates.due && <span className="tag">마감 {ymd(c.dates.due)}</span>}
                </div>
                <button className="mbtn" style={{ padding: '12px 18px', fontSize: 14 }}>
                  지원하기
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mob-sec">
          <div className="mob-sh">
            <h2>정산</h2>
            <p>완료 {done.length}건</p>
          </div>
          <div className="mcards">
            <article className="mcard">
              <div className="mrow" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>지금까지 받은 고료</span>
                <b className="num" style={{ fontSize: 19, letterSpacing: '-.03em' }}>{won(v.earned)}</b>
              </div>
              <div className="sep" />
              <div className="task wait">
                <div className="tn">
                  <b>정산자료 제출</b>
                  <span>통장 사본과 신분증을 올리면 지급이 시작됩니다.</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mob-sec">
          <div className="mob-sh">
            <h2>내 활동</h2>
          </div>
          <div className="mcards">
            <article className="mcard">
              <div className="mrow" style={{ gap: 26 }}>
                <div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.03em' }}>
                    {v.history}
                  </div>
                  <div className="ms" style={{ marginTop: 2 }}>참여한 캠페인</div>
                </div>
                <div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.03em' }}>
                    {cnt(v.followers)}
                  </div>
                  <div className="ms" style={{ marginTop: 2 }}>팔로워</div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>

      <div className="mob-bar">
        <div className="mob-in">
          <button className="mbtn">주소 입력하기</button>
          <button className="mbtn ghost">문의</button>
        </div>
      </div>
    </div>
  )
}
