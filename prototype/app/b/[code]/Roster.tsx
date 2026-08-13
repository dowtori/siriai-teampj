'use client'

import { useRef, useState, type ReactNode } from 'react'
import { Modal } from '@/app/ui/Overlay'
import { embedUrl, useAlive } from '../Embed'

/* 명단 컨펌.
   기본은 사진 여러 장 고르듯 3x3 격자에서 체크한다. 썸네일 위에 계정·팔로워·ER·단가를 얹는다.
   표가 편한 분을 위해 진행시트와 같은 컬럼의 표로 바로 전환할 수 있다. */

export type SheetRow = {
  no: number
  name: string
  handle: string | null
  followers: number | null
  region: string | null
  language: string | null
  estViews: number | null
  er: number | null
  likes: number | null
  comments: number | null
  fee: number | null
  picked: boolean
  note: string | null
  contentUrl: string | null
}

const n = (v: number | null) => (v == null ? '—' : v.toLocaleString('ko-KR'))
const w = (v: number | null) => (v == null ? '—' : '₩' + v.toLocaleString('ko-KR'))
const k = (v: number | null) => (v == null ? '—' : v >= 10000 ? `${(v / 10000).toFixed(1)}만` : v.toLocaleString('ko-KR'))
const at = (h: string | null) => (h ? '@' + h.replace('instagram.com/', '') : '계정 미확인')

/* 보기 세 가지 — 목록 / 3×3 / 5×5.
   한 번에 보여줄 장수는 격자 크기에 맞춰 한 화면 분량으로 둔다. */
type View = 'list' | 'g3' | 'g5'
const PAGE: Record<View, number> = { list: 0, g3: 9, g5: 25 }

const ICON: Record<View, ReactNode> = {
  list: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      <rect x="0" y="1" width="4" height="3" rx="1" /><rect x="6" y="1.75" width="9" height="1.5" rx=".75" />
      <rect x="0" y="6" width="4" height="3" rx="1" /><rect x="6" y="6.75" width="9" height="1.5" rx=".75" />
      <rect x="0" y="11" width="4" height="3" rx="1" /><rect x="6" y="11.75" width="9" height="1.5" rx=".75" />
    </svg>
  ),
  g3: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      {[0, 5.5, 11].map((y) => [0, 5.5, 11].map((x) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx="1" />
      )))}
    </svg>
  ),
  g5: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      {[0, 3.2, 6.4, 9.6, 12.8].map((y) => [0, 3.2, 6.4, 9.6, 12.8].map((x) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="2.2" height="2.2" rx=".6" />
      )))}
    </svg>
  ),
}

const VIEWS: { key: View; label: string }[] = [
  { key: 'list', label: '목록으로 보기' },
  { key: 'g3', label: '3×3 썸네일' },
  { key: 'g5', label: '5×5 썸네일' },
]

/* 타일 배경. 최근 콘텐츠가 있으면 그걸 깔고, 없거나 삭제된 게시물이면 이니셜로 돌아간다. */
function Shot({ url, label }: { url: string | null; label: string }) {
  const src = url ? embedUrl(url) : null
  const ref = useRef<HTMLIFrameElement>(null)
  const state = useAlive(src, ref)
  return (
    <span className="shot">
      <span className="noshot"><span>{label}</span></span>
      {src && (
        <iframe
          ref={ref}
          src={src}
          title={label}
          loading="lazy"
          scrolling="no"
          style={{ opacity: state === 'ok' ? 1 : 0 }}
        />
      )}
    </span>
  )
}

export default function Roster({
  rows, campaign, total,
}: {
  rows: SheetRow[]
  campaign: string
  total: number
}) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [view, setView] = useState<View>('g3')
  const [limit, setLimit] = useState(PAGE.g3)
  const [sel, setSel] = useState<Record<number, boolean>>(
    () => Object.fromEntries(rows.map((r) => [r.no, r.picked])),
  )

  const toggle = (no: number) => setSel((s) => ({ ...s, [no]: !s[no] }))
  const chosen = rows.filter((r) => sel[r.no])
  const sum = chosen.reduce((s, r) => s + (r.fee ?? 0), 0)
  /* 합산 노출은 보여주지 않는다. 성과를 보장하는 것처럼 읽힌다. */

  const allOn = chosen.length === rows.length
  const toggleAll = () =>
    setSel(Object.fromEntries(rows.map((r) => [r.no, !allOn])))

  /* 격자는 사진을 보고 고르는 화면이라 최근 콘텐츠가 있는 사람을 앞에 둔다.
     표는 진행시트와 같아야 하므로 원래 순번을 그대로 쓴다. */
  const tiles = [...rows].sort(
    (a, b) => Number(!!b.contentUrl) - Number(!!a.contentUrl) || a.no - b.no,
  )

  return (
    <>
      <button className="pbtn" onClick={() => setOpen(true)}>
        {done && <span style={{ color: '#7dbb98' }}>✓</span>}
        {done ? '컨펌 완료' : '명단 확인하기'}
      </button>

      <Modal
        wide
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="LIST"
        title="선정 인원 컨펌"
        meta={`${campaign} · 제안 ${rows.length}명`}
        footer={
          /* 고른 수량과 비용은 스크롤과 무관하게 늘 크게 보인다.
             찾아내야 아는 정보가 아니라 먼저 눈에 띄는 정보여야 한다. */
          <div className="tally">
            <span className="tally-n">
              <b>{chosen.length}</b>
              <em>/ {rows.length}명</em>
            </span>
            <span className="tally-x">·</span>
            <span className="tally-w">{w(sum)}</span>
            <span className="tally-b">
              <button className="btn" onClick={() => setOpen(false)}>닫기</button>
              <button
                className="btn pri"
                disabled={chosen.length === 0}
                onClick={() => { setDone(true); setOpen(false) }}
              >
                컨펌하기
              </button>
            </span>
          </div>
        }
      >
        <div className="pick-h">
          <span className="cntx">제안 {rows.length}명</span>
          <button className="btn" style={{ padding: '7px 13px', fontSize: 12.5 }} onClick={toggleAll}>
            {allOn ? '전체 해제' : '전체 선택'}
          </button>
          <div className="right">
            <div className="vseg">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  className={view === v.key ? 'on' : ''}
                  onClick={() => { setView(v.key); setLimit(PAGE[v.key]) }}
                  title={v.label}
                  aria-label={v.label}
                  aria-pressed={view === v.key}
                >
                  {ICON[v.key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view !== 'list' ? (
          <>
            <div className={`picker ${view === 'g5' ? 'g5' : ''}`} style={{ '--cols': view === 'g5' ? 5 : 3 } as React.CSSProperties}>
              {tiles.slice(0, limit).map((r) => {
                const on = !!sel[r.no]
                return (
                  <button
                    key={r.no}
                    className={`ptile ${on ? 'on' : ''}`}
                    onClick={() => toggle(r.no)}
                    aria-pressed={on}
                  >
                    <Shot url={r.contentUrl} label={at(r.handle).slice(1, 3).toUpperCase()} />
                    <span className="grad" />

                    <span className="top">
                      <span className="who2">{at(r.handle)}</span>
                      <span className="box2">✓</span>
                    </span>

                    <span className="bot">
                      <span className="st2">
                        <span>{k(r.followers)} 팔로워</span>
                        {r.er != null && <span>ER {r.er.toFixed(1)}%</span>}
                        {r.estViews ? <span>예상 {k(r.estViews)}</span> : null}
                      </span>
                      <span className="fee2">{w(r.fee)}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {limit < rows.length && (
              <button className="pick-more" onClick={() => setLimit((v) => v + PAGE[view])}>
                {rows.length - limit}명 더 보기
              </button>
            )}
          </>
        ) : (
          <div className="sheet">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>선택</th>
                  <th style={{ width: 34 }}>No.</th>
                  <th>인플루언서</th>
                  <th className="n">팔로워</th>
                  <th style={{ width: 52 }}>지역</th>
                  <th className="n">예상 조회수</th>
                  <th className="n">ER</th>
                  <th className="n">평균 좋아요</th>
                  <th className="n">평균 댓글</th>
                  <th className="n">제안비용</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.no} onClick={() => toggle(r.no)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className={`tick ${sel[r.no] ? 'on' : ''}`}>✓</span>
                    </td>
                    <td className="n" style={{ color: 'var(--ink-3)' }}>{r.no}</td>
                    <td>
                      <span className="hl2">{at(r.handle)}</span>
                      {r.note && <small>{r.note}</small>}
                    </td>
                    <td className="n">{n(r.followers)}</td>
                    <td>{r.region ?? '—'}</td>
                    <td className="n">{n(r.estViews)}</td>
                    <td className="n">{r.er != null ? `${r.er.toFixed(2)}%` : '—'}</td>
                    <td className="n">{n(r.likes)}</td>
                    <td className="n">{n(r.comments)}</td>
                    <td className="n">{w(r.fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ margin: '16px 0 0', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          {view === 'list'
            ? '지금 주고받던 진행시트와 같은 컬럼입니다. 담당자 코멘트와 개인정보는 빼고 보여드립니다.'
            : '썸네일은 최근 콘텐츠입니다. 목록 아이콘을 누르면 진행시트와 같은 표로 바뀝니다.'}
        </p>
      </Modal>
    </>
  )
}
