'use client'

import { useMemo, useState } from 'react'
import Act from '@/app/ui/Act'

/* 지원 페이지를 어드민에서 만들고, 조건에 맞는 인플루언서에게만 노출한다.
   조건을 바꾸면 대상 인원이 바로 바뀐다. */

export type Pool = {
  key: string
  name: string
  handle: string | null
  followers: number | null
  worked: number
  region: string | null
}

const TIERS = [
  { k: 'all',   l: '전체',        min: 0,      max: Infinity },
  { k: 'nano',  l: '1만 이하',     min: 0,      max: 10_000 },
  { k: 'micro', l: '1만~5만',     min: 10_000, max: 50_000 },
  { k: 'mid',   l: '5만 이상',     min: 50_000, max: Infinity },
] as const

const HIST = [
  { k: 'any',  l: '전체' },
  { k: 'done', l: '협업 경험' },
  { k: 'new',  l: '신규' },
] as const

export default function PageBuilder({ pool, campaign }: { pool: Pool[]; campaign: string }) {
  const [tier, setTier] = useState<string>('micro')
  const [hist, setHist] = useState<string>('done')
  const [kr, setKr] = useState(true)

  const matched = useMemo(() => {
    const t = TIERS.find((x) => x.k === tier)!
    return pool.filter((p) => {
      const f = p.followers ?? 0
      if (f < t.min || f >= t.max) return false
      if (hist === 'done' && p.worked === 0) return false
      if (hist === 'new' && p.worked > 0) return false
      if (kr && p.region && p.region !== '한국') return false
      return true
    })
  }, [pool, tier, hist, kr])

  const top = matched.slice(0, 6)

  return (
    <div className="work">
      <div className="panel">
        <div className="bar">
          <b style={{ fontSize: 14 }}>지원 페이지 만들기</b>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{campaign}</span>
        </div>

        <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div className="ap-only" style={{ borderRadius: 12 }}>
            <span className="ap-only-k">페이지에 들어갈 것</span>
            <div className="gh-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{
                    aspectRatio: '1', borderRadius: 10, overflow: 'hidden',
                    background: 'var(--line-2)', position: 'relative',
                  }}>
                    <img src={`/img/prod-${i}.jpg`} alt="" loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>제품 {i}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              커버 이미지 · 제공 제품 · 콘텐츠 가이드라인 · 진행 프로세스 · 주의사항이 함께 들어갑니다.
              지금은 참고한 가이드 페이지의 이미지를 쓰고 있습니다.
            </p>
          </div>

          <div>
            <span className="ap-only-k" style={{ color: 'var(--ink-3)' }}>참여 조건</span>
            <div className="form" style={{ marginTop: 14, gap: 16 }}>
              <div className="frow">
                <div className="fl"><b>팔로워</b><span>이 구간만 노출됩니다</span></div>
                <div className="opts">
                  {TIERS.map((t) => (
                    <button key={t.k} className={`opt ${tier === t.k ? 'on' : ''}`} onClick={() => setTier(t.k)}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="frow">
                <div className="fl"><b>협업 이력</b><span>처음 제안인지 재협업인지</span></div>
                <div className="opts">
                  {HIST.map((h) => (
                    <button key={h.k} className={`opt ${hist === h.k ? 'on' : ''}`} onClick={() => setHist(h.k)}>
                      {h.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="frow">
                <div className="fl"><b>지역</b><span>국내 거주만 노출</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className={`toggle ${kr ? 'on' : ''}`} onClick={() => setKr((v) => !v)} aria-label="국내만" />
                  <span style={{ fontSize: 13.5 }}>{kr ? '국내만' : '전체'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="actionbar">
          <span className="sum">
            조건에 맞는 인플루언서 <b>{matched.length.toLocaleString('ko-KR')}</b>명
          </span>
          <div className="right">
            <Act
              id="rc-page-make" variant="btn" label="지원 페이지 만들기" doneLabel="페이지 생성됨"
              eyebrow="PAGE" title="지원 페이지 만들기"
              intro={<><b>{campaign}</b>커버 · 제공 제품 · 가이드라인 · 프로세스가 들어간 페이지를 만듭니다. 캠페인마다 따로 배포할 필요가 없습니다.</>}
              fields={[
                { name: 'title', label: '페이지 제목', value: campaign, required: true },
                { name: 'due', label: '모집 마감', placeholder: '2026-09-05' },
                { name: 'n', label: '모집 인원', placeholder: '예: 30' },
              ]}
              confirmLabel="만들기" doneTitle="지원 페이지를 만들었습니다"
              doneNote="주소가 발급됐습니다. 아래에서 조건에 맞는 인플루언서에게 바로 보낼 수 있습니다."
            />
            <Act
              id="rc-page-send" variant="btn pri" label={`${matched.length}명에게 노출`} doneLabel="노출 완료"
              eyebrow="TARGET" title="조건에 맞는 인플루언서에게 노출"
              intro={
                <>
                  <b>{matched.length.toLocaleString('ko-KR')}명이 대상입니다</b>
                  이 사람들의 인플루언서 페이지 &lsquo;지원할 수 있어요&rsquo;에 이 캠페인이 올라가고, 알림톡이 나갑니다.
                  조건에 맞지 않는 사람에게는 보이지 않습니다.
                </>
              }
              summary={
                <div className="trio">
                  <div><span className="k">팔로워</span><span className="v" style={{ fontSize: 15 }}>{TIERS.find((t) => t.k === tier)!.l}</span></div>
                  <div><span className="k">이력</span><span className="v" style={{ fontSize: 15 }}>{HIST.find((h) => h.k === hist)!.l}</span></div>
                  <div><span className="k">지역</span><span className="v" style={{ fontSize: 15 }}>{kr ? '국내' : '전체'}</span></div>
                </div>
              }
              confirmLabel="노출하고 알림 보내기"
              doneTitle="노출했습니다"
              doneNote="대상자의 인플루언서 페이지에 캠페인이 올라갔고 알림톡이 나갔습니다. 지원이 들어오면 모집·선정에 쌓입니다."
            />
          </div>
        </div>
      </div>

      <div className="side">
        <div className="panel">
          <div className="bar">
            <b style={{ fontSize: 14 }}>노출 대상</b>
            <div className="right"><span className="chip sel">{matched.length.toLocaleString('ko-KR')}</span></div>
          </div>
          <div className="rows">
            {top.map((p) => (
              <div className="row" key={p.key} style={{ cursor: 'default', padding: '12px 20px' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--line-2)', flex: 'none' }} />
                <span className="lead">
                  <span className="t" style={{ fontSize: 13.5 }}>{p.name}</span>
                  <span className="s">
                    {p.followers?.toLocaleString('ko-KR') ?? '—'} 팔로워
                    {p.worked > 0 ? ` · 협업 ${p.worked}회` : ' · 신규'}
                  </span>
                </span>
              </div>
            ))}
            {matched.length === 0 && (
              <div style={{ padding: 26, fontSize: 13.5, color: 'var(--ink-3)' }}>
                조건에 맞는 인플루언서가 없습니다. 조건을 넓혀보세요.
              </div>
            )}
          </div>
          {matched.length > top.length && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line-2)', fontSize: 12.5, color: 'var(--ink-3)' }}>
              외 {(matched.length - top.length).toLocaleString('ko-KR')}명
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
