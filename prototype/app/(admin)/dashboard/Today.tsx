'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Modal } from '@/app/ui/Overlay'

/* 오늘 할 일 — 팀이 매일 여는 화면.
   네 가지 일감을 한 프레임에 묶고, 타일을 누르면 아래 목록이 그것만 남는다. */

export type Kind = 'due' | 'remind' | 'review' | 'settle'

export type Work = {
  id: string
  kind: Kind
  title: string
  sub: string
  metaLabel: string
  metaValue: string
  href: string | null
  urgent?: boolean
}

const TILES: { kind: Kind; icon: string; label: string; cls: string; hint: string }[] = [
  { kind: 'due',    icon: '◷', label: '마감 임박', cls: 't-due',    hint: '납품예정일이 오늘이거나 지난 캠페인' },
  { kind: 'remind', icon: '↥', label: '리마인드',  cls: 't-remind', hint: '선정됐는데 아직 콘텐츠가 없는 인원' },
  { kind: 'review', icon: '⌕', label: '검수',      cls: 't-review', hint: '올라왔지만 확인이 끝나지 않은 콘텐츠' },
  { kind: 'settle', icon: '▤', label: '정산',      cls: 't-settle', hint: '입금 또는 정산자료가 남은 건' },
]

export default function Today({ work, asOf }: { work: Work[]; asOf: string }) {
  const [pick, setPick] = useState<Kind>('due')
  const [limit, setLimit] = useState(8)
  const [bulk, setBulk] = useState<Kind | null>(null)
  /* 처리한 일감. 여기서 바로 켜고 끈다 — 페이지를 옮기지 않는다. */
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [hideDone, setHideDone] = useState(false)

  const flip = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }))
  const left = (k: Kind) => work.filter((w) => w.kind === k && !done[w.id]).length

  const count = (k: Kind) => work.filter((w) => w.kind === k).length
  const all = work.filter((w) => w.kind === pick)
  const rows = hideDone ? all.filter((w) => !done[w.id]) : all
  const doneHere = all.filter((w) => done[w.id]).length
  const tile = TILES.find((t) => t.kind === pick)!

  return (
    <>
      <div className="today">
        <div className="today-h">
          <h2>오늘 할 일</h2>
          <p>{asOf} 기준</p>
          <div className="right">
            <span className="chip line">전체 {work.length}건</span>
          </div>
        </div>

        <div className="tiles">
          {TILES.map((t) => (
            <button
              key={t.kind}
              className={`tile ${t.cls} ${pick === t.kind ? 'on' : ''}`}
              onClick={() => { setPick(t.kind); setLimit(8) }}
            >
              <div className="tile-h">
                <span className="ic">{t.icon}</span>
                <span className="go">클릭하여 바로 처리 ↓</span>
              </div>
              <span className="tv">{left(t.kind)}</span>
              <span className="tl">{t.label}</span>
              <span className="ts">{t.hint}</span>
            </button>
          ))}
        </div>

        <div className="panel">
          <div className="zh" style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--line-2)' }}>
            <h2 style={{ fontSize: 16 }}>{tile.label}</h2>
            <p>{all.length - doneHere}건 남음{doneHere > 0 && ` · ${doneHere}건 처리함`}</p>
            <div className="right" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {doneHere > 0 && (
                <button className="btn" onClick={() => setHideDone((v) => !v)}>
                  {hideDone ? '처리한 것도 보기' : '처리한 것 숨기기'}
                </button>
              )}
              <button className="btn" onClick={() => setBulk(pick)} disabled={all.length === 0}>
                한 번에 처리
              </button>
            </div>
          </div>

          {/* 체크로 완료·취소한다. 페이지를 옮기는 건 '자세히' 버튼일 때만. */}
          <div className="rows">
            {rows.slice(0, limit).map((w) => (
              <div className={`row task ${done[w.id] ? 'is-done' : ''}`} key={w.id}>
                <button
                  className={`tick ${done[w.id] ? 'on' : ''}`}
                  onClick={() => flip(w.id)}
                  aria-pressed={!!done[w.id]}
                  aria-label={done[w.id] ? '처리 취소' : '처리 완료'}
                  title={done[w.id] ? '누르면 다시 할 일로' : '누르면 처리 완료'}
                >
                  ✓
                </button>
                <span className="lead">
                  <span className="t">{w.title}</span>
                  <span className="s">{w.sub}</span>
                </span>
                <span className="tail">
                  <span className="met">
                    <b>{w.metaValue}</b>
                    <span>{w.metaLabel}</span>
                  </span>
                  {w.href && (
                    <Link className="btn ghost" href={w.href} onClick={(e) => e.stopPropagation()}>
                      자세히 →
                    </Link>
                  )}
                </span>
              </div>
            ))}
            {rows.length === 0 && (
              <div style={{ padding: 34, color: 'var(--ink-3)', fontSize: 14 }}>
                {all.length === 0
                  ? `${tile.label}에 남은 일이 없습니다.`
                  : `${tile.label} ${all.length}건을 모두 처리했습니다.`}
              </div>
            )}
          </div>

          {limit < rows.length && (
            <button className="more" onClick={() => setLimit((n) => n + 15)}>
              {rows.length - limit}건 더 보기
            </button>
          )}
        </div>
      </div>

      <Modal
        open={!!bulk}
        onClose={() => setBulk(null)}
        eyebrow="BULK"
        title={`${TILES.find((t) => t.kind === bulk)?.label ?? ''} 한 번에 처리`}
        meta={bulk ? `${work.filter((w) => w.kind === bulk).length}건 선택 대상` : null}
        footer={
          <>
            <button className="btn pri" onClick={() => setBulk(null)}>닫기</button>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              프로토타입에서는 동작하지 않습니다. 실제로는 여기서 한 번에 발송·확정합니다.
            </span>
          </>
        }
      >
        <div className="note info">
          <div>
            <b>이 자리가 하는 일</b>
            지금은 캠페인마다 시트를 열고 한 명씩 확인해야 합니다. 여기서는 같은 종류의 일감을 모아두고
            한 번에 처리합니다. 리마인드는 알림톡 일괄 발송, 검수는 체크 후 상태 변경, 정산은 계산서 발급
            대상 확정입니다.
          </div>
        </div>
        <div className="sect">
          <h4>대상</h4>
          <div className="rows">
            {work.filter((w) => w.kind === bulk).slice(0, 6).map((w) => (
              <div className="row" key={w.id} style={{ cursor: 'default', paddingLeft: 0, paddingRight: 0 }}>
                <span className="dot live" />
                <span className="lead">
                  <span className="t">{w.title}</span>
                  <span className="s">{w.sub}</span>
                </span>
                <span className="tail">
                  <span className="met"><b>{w.metaValue}</b><span>{w.metaLabel}</span></span>
                </span>
              </div>
            ))}
          </div>
          {bulk && work.filter((w) => w.kind === bulk).length > 6 && (
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)' }}>
              외 {work.filter((w) => w.kind === bulk).length - 6}건
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
