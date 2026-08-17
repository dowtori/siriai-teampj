'use client'

import { useMemo, useState } from 'react'
import Act from '@/app/ui/Act'
import { STATUS_LABEL, type Status } from '@/lib/avail-types'
import { useCore } from '../../Core'

/* 지원 페이지를 어드민에서 만들고, 조건에 맞는 인플루언서에게만 노출한다.
   조건을 바꾸면 대상 인원이 바로 바뀐다. */

export type Pool = {
  key: string
  name: string
  handle: string | null
  platform: string
  followers: number | null
  worked: number
  region: string | null
  /** 지금 붙일 수 있는가 — 진행 중 · 쿨다운이면 제안이 안 나간다 */
  status: Status
  why: string
  recentBrands: string[]
}

const TIERS = [
  { k: 'all',   l: '전체',        min: 0,      max: Infinity },
  { k: 'nano',  l: '1만 이하',     min: 0,      max: 10_000 },
  { k: 'micro', l: '1만~5만',     min: 10_000, max: 50_000 },
  { k: 'mid',   l: '5만 이상',     min: 50_000, max: Infinity },
] as const

/* 협업 횟수는 진행시트를 되짚어 센 값이라 전 계정에 다 있다. */
const HIST = [
  { k: 'any',     l: '전체' },
  { k: 'once',    l: '1회' },
  { k: 'repeat',  l: '2회 이상' },
  { k: 'regular', l: '단골 6회+' },
] as const

const PLATS = ['전체', '인스타그램', '틱톡', '유튜브', '네이버블로그'] as const

export default function PageBuilder({ pool, campaign, brands }: {
  pool: Pool[]
  campaign: string
  /** 이미 등록된 거래처. 없으면 이 자리에서 새로 만든다. */
  brands: string[]
}) {
  const core = useCore()
  /* 핵심 인플루언서에게 먼저 보내는 것이 기본이다.
     급할 때는 꺼서 인재풀 전체로 넓힌다. */
  const [coreFirst, setCoreFirst] = useState(true)
  const [brand, setBrand] = useState<string>(brands[0] ?? '')
  /* 일정과 경합 — 5,818명에서 지금 제안 가능한 사람만 남기는 두 조건 */
  const [freeOnly, setFreeOnly] = useState(true)
  const [noRival, setNoRival] = useState(true)
  const [added, setAdded] = useState<string[]>([])
  const [tier, setTier] = useState<string>('all')
  const [hist, setHist] = useState<string>('repeat')
  const [plat, setPlat] = useState<string>('인스타그램')
  const [kr, setKr] = useState(true)

  const matched = useMemo(() => {
    const t = TIERS.find((x) => x.k === tier)!
    return pool.filter((p) => {
      // 팔로워를 모르는 계정은 구간을 걸 수 없다. '전체'일 때만 남긴다.
      if (tier !== 'all') {
        if (p.followers == null) return false
        if (p.followers < t.min || p.followers >= t.max) return false
      }
      if (hist === 'once' && p.worked !== 1) return false
      if (hist === 'repeat' && p.worked < 2) return false
      if (hist === 'regular' && p.worked < 6) return false
      if (plat !== '전체' && p.platform !== plat) return false
      if (kr && p.region && p.region !== '한국') return false
      // 진행 중이거나 쿨다운이면 지금 제안을 넣을 수 없다
      // 핵심 인플루언서에게만 보낸다 (기본)
      if (coreFirst && !core?.has(p.key)) return false
      if (freeOnly && p.status !== 'open') return false
      // 이 거래처와 최근 90일 안에 이미 함께했으면 뺀다
      if (noRival && p.recentBrands.includes(brand)) return false
      return true
    })
  }, [pool, tier, hist, plat, kr, freeOnly, noRival, brand, coreFirst, core])

  const blocked = pool.filter((p) => p.status !== 'open')
  const busy = blocked.filter((p) => p.status === 'busy').length
  const cooling = blocked.length - busy

  // 많이 함께한 사람부터 보여준다
  const top = [...matched].sort((a, b) => b.worked - a.worked).slice(0, 6)

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

          <div className="frow" style={{ paddingBottom: 18, borderBottom: '1px solid var(--line-2)' }}>
            <div className="fl">
              <b>거래처</b>
              <span>이 캠페인이 어느 고객사 건인지</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="btn"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                style={{ padding: '9px 13px', fontSize: 13, minWidth: 200 }}
              >
                {[...brands, ...added].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <Act
                id="rc-brand-new" variant="btn" label="+ 거래처 추가" doneLabel="거래처 추가됨"
                eyebrow="CLIENT" title="거래처 추가"
                intro={<><b>목록에 없는 거래처를 새로 만듭니다</b>여기서 만든 거래처는 세일즈 · 정산에서도 그대로 씁니다.</>}
                fields={[
                  { name: 'name', label: '거래처명', placeholder: '사업자등록증 상호 그대로', required: true },
                  { name: 'mgr', label: '담당자', placeholder: '이름 · 직함' },
                  { name: 'mail', label: '이메일', placeholder: '세금계산서 받을 주소' },
                ]}
                confirmLabel="추가하기"
                doneTitle="거래처를 추가했습니다"
                doneNote="브랜드 페이지 접근 코드도 함께 발급됩니다."
                onDone={(v) => {
                  const nm = (v.name ?? '').trim()
                  if (!nm) return
                  setAdded((a) => (a.includes(nm) ? a : [...a, nm]))
                  setBrand(nm)
                }}
              />
            </div>
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
                <div className="fl"><b>플랫폼</b><span>이 채널 계정만 노출</span></div>
                <div className="opts">
                  {PLATS.map((p) => (
                    <button key={p} className={`opt ${plat === p ? 'on' : ''}`} onClick={() => setPlat(p)}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="frow">
                <div className="fl"><b>협업 이력</b><span>지금까지 함께한 횟수</span></div>
                <div className="opts">
                  {HIST.map((h) => (
                    <button key={h.k} className={`opt ${hist === h.k ? 'on' : ''}`} onClick={() => setHist(h.k)}>
                      {h.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="frow">
                <div className="fl">
                  <b>핵심 인플루언서</b>
                  <span>
                    {core?.size ? `${core.size}명에게 먼저 보냅니다` : '아직 정한 사람이 없습니다 — 설정 화면에서 담아주세요'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className={`toggle ${coreFirst ? 'on' : ''}`} onClick={() => setCoreFirst((v) => !v)} aria-label="핵심 대상" />
                  <span style={{ fontSize: 13.5 }}>{coreFirst ? '핵심에게만' : '인재풀 전체'}</span>
                </div>
              </div>
              <div className="frow">
                <div className="fl">
                  <b>일정</b>
                  <span>진행 중 {busy}명 · 쿨다운 {cooling}명은 지금 제안이 안 나갑니다</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className={`toggle ${freeOnly ? 'on' : ''}`} onClick={() => setFreeOnly((v) => !v)} aria-label="지금 가능한 사람만" />
                  <span style={{ fontSize: 13.5 }}>{freeOnly ? '지금 가능한 사람만' : '일정 상관없이'}</span>
                </div>
              </div>
              <div className="frow">
                <div className="fl">
                  <b>거래처 경합</b>
                  <span>최근 90일 안에 {brand}와 이미 함께한 사람은 뺍니다</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className={`toggle ${noRival ? 'on' : ''}`} onClick={() => setNoRival((v) => !v)} aria-label="경합 제외" />
                  <span style={{ fontSize: 13.5 }}>{noRival ? '겹치는 사람 제외' : '상관없이'}</span>
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
                { name: 'brand', label: '거래처', value: brand, required: true },
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
                  <div><span className="k">플랫폼</span><span className="v" style={{ fontSize: 15 }}>{plat}</span></div>
                  <div><span className="k">이력</span><span className="v" style={{ fontSize: 15 }}>{HIST.find((h) => h.k === hist)!.l}</span></div>
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
                  <span className="t" style={{ fontSize: 13.5 }}>{p.handle}</span>
                  <span className="s">
                    {p.status !== 'open' && (
                      <b style={{ color: 'var(--warn)' }}>{STATUS_LABEL[p.status]} · </b>
                    )}
                    {p.platform} · 협업 {p.worked}회
                    {p.followers != null ? ` · ${p.followers.toLocaleString('ko-KR')} 팔로워` : ''}
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
