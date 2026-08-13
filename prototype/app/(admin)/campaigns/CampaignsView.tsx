'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Drawer, Modal } from '@/app/ui/Overlay'

export type CardVM = {
  id: string
  name: string
  brand: string
  detail: string | null
  stageLabel: string
  tone: 'done' | 'live' | 'issue'
  lane: string
  month: string
  revenue: number | null
  margin: number | null
  offered: number | null
  selected: number | null
  uploaded: number | null
  uploadRate: number | null
  invoiceDate: string | null
  paid: boolean
  parts: number
  checks: { selected: number; responded: number; shipped: number; posted: number }
  links: { guide: string | null; tracker: string | null; review: string | null }
}

/* 칸이 비어도 "없습니다"로 끝내지 않는다.
   그 자리가 무슨 단계인지 읽히게 한다. */
const LANES: { name: string; role: string }[] = [
  { name: '모집', role: '모집 링크가 나가고 지원을 받는 단계. 지원자가 들어오면 여기 쌓입니다.' },
  { name: '선정', role: '지원자 중에 고르고 선정 안내를 보내는 단계. 알림톡이 여기서 나갑니다.' },
  { name: '배송 · 업로드', role: '제품을 보내고 콘텐츠가 올라오기를 기다리는 단계. 송장과 업로드를 함께 봅니다.' },
  { name: '검수', role: '가이드라인 준수와 해시태그를 확인하는 단계. 검수 체크리스트가 여기 붙습니다.' },
  { name: '정산 완료', role: '계산서 발급과 입금이 끝난 단계.' },
]

const won = (n: number | null) => (n == null ? '—' : '₩' + n.toLocaleString('ko-KR'))
const cnt = (n: number | null) => (n == null ? '—' : n.toLocaleString('ko-KR'))
const rate = (n: number | null) => (n == null ? '—' : Math.round(n * 100) + '%')
const ymd = (d: string | null) => (d ? d.slice(2).replace(/-/g, '.') : '—')

export default function CampaignsView({ cards }: { cards: CardVM[] }) {
  const [view, setView] = useState<'board' | 'list'>('board')
  const [open, setOpen] = useState<CardVM | null>(null)
  const [review, setReview] = useState(false)
  const [limit, setLimit] = useState(12)

  const list = [...cards].sort((a, b) => (b.invoiceDate ?? '').localeCompare(a.invoiceDate ?? ''))

  return (
    <>
      <div className="zh">
        <h2>{view === 'board' ? '진행 단계별' : '전체 목록'}</h2>
        <p>{cards.length}건</p>
        <div className="right">
          <div className="seg">
            <button className={view === 'board' ? 'on' : ''} onClick={() => setView('board')}>보드</button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>목록</button>
          </div>
        </div>
      </div>

      {view === 'board' ? (
        <>
          <div className="board">
            {LANES.map((lane) => {
              const items = cards.filter((c) => c.lane === lane.name)
              return (
                <div className="col" key={lane.name}>
                  <div className="col-h">
                    <span className={`dot ${lane.name === '정산 완료' ? 'done' : 'live'}`} />
                    <b>{lane.name}</b>
                    <span className="n">{items.length}</span>
                  </div>
                  <div className="cards">
                    {items.slice(0, 5).map((c) => (
                      <button className="ccard" key={c.id} onClick={() => setOpen(c)}>
                        <div>
                          <div className="ct">{c.name}</div>
                          <div className="cb" style={{ marginTop: 5 }}>{c.brand}</div>
                        </div>
                        <div className="cf">
                          <span className="cb">
                            {c.selected != null ? `선정 ${cnt(c.selected)}` : '선정 전'}
                          </span>
                          <span className="cv">{won(c.revenue)}</span>
                        </div>
                      </button>
                    ))}
                    {items.length > 5 && (
                      <button className="btn" onClick={() => setView('list')} style={{ justifyContent: 'center' }}>
                        나머지 {items.length - 5}건
                      </button>
                    )}
                    {items.length === 0 && (
                      <div className="plan" style={{ minHeight: 120 }}>
                        <span className="pk">이 단계는</span>
                        <p>{lane.role}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="panel">
          <div className="rows">
            {list.slice(0, limit).map((c) => (
              <button className="row" key={c.id} onClick={() => setOpen(c)}>
                <span className={`dot ${c.tone}`} />
                <span className="lead">
                  <span className="t">{c.name}</span>
                  <span className="s">{c.brand} · {c.month} · {c.stageLabel}</span>
                </span>
                <span className="tail">
                  <span className="ring" style={{ ['--p' as string]: Math.round((c.uploadRate ?? 0) * 100) }}>
                    <b>{rate(c.uploadRate)}</b>
                  </span>
                  <span className="met">
                    <b>{won(c.revenue)}</b>
                    <span>REVENUE</span>
                  </span>
                  <span className="arrow">→</span>
                </span>
              </button>
            ))}
          </div>
          {limit < list.length && (
            <button className="more" onClick={() => setLimit((n) => n + 20)}>
              {list.length - limit}건 더 보기
            </button>
          )}
        </div>
      )}

      {/* 2단 — 맥락을 잃지 않고 한 건을 본다 */}
      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        eyebrow="CAMPAIGN"
        title={open?.name ?? ''}
        meta={open ? `${open.brand} · ${open.month} · ${open.stageLabel}` : null}
        footer={
          open && (
            <>
              <button className="btn pri" onClick={() => setReview(true)}>검수 열기</button>
              <Link className="btn" href={`/campaigns/${open.id}`}>전체 페이지 →</Link>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)' }}>
                참여 {cnt(open.parts)}건
              </span>
            </>
          )
        }
      >
        {open && (
          <>
            <div className="trio">
              <div>
                <span className="k">REVENUE</span>
                <span className="v">{won(open.revenue)}</span>
                <span className="s">마진 {rate(open.margin)}</span>
              </div>
              <div>
                <span className="k">SELECTED</span>
                <span className="v">{cnt(open.selected)}</span>
                <span className="s">제공 {cnt(open.offered)}</span>
              </div>
              <div>
                <span className="k">UPLOAD</span>
                <span className="v">{rate(open.uploadRate)}</span>
                <span className="s">{cnt(open.uploaded)}건 확인</span>
              </div>
            </div>

            <div className="sect">
              <h4>진행</h4>
              <div className="steps">
                <Step
                  title="사전 관리"
                  n={`${open.checks.responded}/${open.checks.selected}`}
                  items={[
                    ['선정 안내', open.checks.selected > 0],
                    ['개별 요청', open.checks.responded > 0],
                    ['답변 수신', open.checks.responded >= open.checks.selected && open.checks.selected > 0],
                  ]}
                />
                <Step
                  title="콘텐츠 검수"
                  n={`${open.checks.posted}/${open.checks.selected}`}
                  items={[
                    ['배송 · 출고', open.checks.shipped > 0],
                    ['업로드 확인', open.checks.posted > 0],
                    ['가이드라인 · 해시태그', open.checks.posted >= open.checks.selected && open.checks.posted > 0],
                  ]}
                />
                <Step
                  title="사후 관리"
                  n={open.paid ? '완료' : '대기'}
                  items={[
                    ['고료 확정', (open.revenue ?? 0) > 0],
                    ['정산자료 수령', open.paid],
                    ['계산서 발급', !!open.invoiceDate],
                  ]}
                />
              </div>
            </div>

            <div className="sect">
              <h4>기록</h4>
              <dl className="kv">
                <dt>귀속</dt><dd>{open.month}</dd>
                <dt>계산서</dt><dd className="num">{ymd(open.invoiceDate)}</dd>
                <dt>입금</dt><dd>{open.paid ? '입금완료' : '대기'}</dd>
                {open.detail && (<><dt>제품</dt><dd>{open.detail.replace(/\n/g, ' · ')}</dd></>)}
                <dt>문서</dt>
                <dd>
                  {[['가이드', open.links.guide], ['진행시트', open.links.tracker], ['검수시트', open.links.review]]
                    .filter(([, v]) => v && String(v).startsWith('http'))
                    .map(([k, v]) => (
                      <a key={k as string} href={v as string} target="_blank" rel="noreferrer" style={{ marginRight: 14 }}>
                        {k} ↗
                      </a>
                    ))}
                </dd>
              </dl>
            </div>
          </>
        )}
      </Drawer>

      {/* 3단 — 한 가지 일에 집중한다 */}
      <Modal
        open={review}
        onClose={() => setReview(false)}
        eyebrow="REVIEW"
        title="검수 체크리스트"
        meta={open ? `${open.name} · 선정 ${cnt(open.selected)}명` : null}
        footer={
          <>
            <button className="btn pri" onClick={() => setReview(false)}>확인</button>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              지금은 보기 전용입니다. 실제로는 여기서 체크하고 알림이 나갑니다.
            </span>
          </>
        }
      >
        {open && (
          <>
            <div className="steps">
              <Step title="사전 관리" n={`${open.checks.responded}/${open.checks.selected}`}
                items={[['선정안내', true], ['개별요청', open.checks.responded > 0], ['답변', open.checks.responded > 0]]} />
              <Step title="콘텐츠 검수" n={`${open.checks.posted}/${open.checks.selected}`}
                items={[['업로드 여부', open.checks.posted > 0], ['가이드라인 준수', open.checks.posted > 0],
                        ['공동작업자', false], ['해시태그', open.checks.posted > 0], ['가드닝', false]]} />
              <Step title="사후 관리" n={open.paid ? '완료' : '대기'}
                items={[['고료', (open.revenue ?? 0) > 0], ['정산자료 수령', open.paid],
                        ['드라이브 저장', open.paid], ['포트폴리오 적합도', false], ['인터뷰 적합도', false]]} />
            </div>
          </>
        )}
      </Modal>
    </>
  )
}

function Step({ title, n, items }: { title: string; n: string; items: [string, boolean][] }) {
  return (
    <div className="step">
      <div className="sh">
        <b>{title}</b>
        <span className="n">{n}</span>
      </div>
      <div className="checks">
        {items.map(([label, on]) => (
          <span className={`check ${on ? 'on' : ''}`} key={label}>
            <i>✓</i>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
