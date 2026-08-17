'use client'

import { useMemo, useState } from 'react'
import { useCore } from '../../../Core'
import { CATEGORIES, type Category } from '@/lib/cat-types'
import { STATUS_LABEL, type Status } from '@/lib/avail-types'

export type Pick = {
  id: string
  handle: string
  platform: string
  worked: number
  /** 마지막 협업 시점 — 최신순 정렬의 근거 */
  lastAt: string | null
  cats: Category[]
  status: Status
}

const SORTS = [
  { k: 'worked', l: '협업 많은 순' },
  { k: 'recent', l: '최근 협업 순' },
] as const

const SIZES = [20, 50, 100, 200] as const

const at = (h: string) => '@' + h
const ymd = (d: string | null) => (d ? d.slice(2).replace(/-/g, '.') : '—')

export default function Picker({ rows }: { rows: Pick[] }) {
  const core = useCore()
  const [sort, setSort] = useState<'worked' | 'recent'>('worked')
  const [size, setSize] = useState<number>(50)
  const [cat, setCat] = useState<Category | '전체'>('전체')
  const [q, setQ] = useState('')

  const sorted = useMemo(() => {
    const list = rows.filter((r) =>
      (cat === '전체' || (cat === '기타' ? r.cats.length === 0 : r.cats.includes(cat))),
    )
    return [...list].sort((a, b) =>
      sort === 'worked'
        ? b.worked - a.worked || (b.lastAt ?? '').localeCompare(a.lastAt ?? '')
        : (b.lastAt ?? '').localeCompare(a.lastAt ?? '') || b.worked - a.worked,
    )
  }, [rows, sort, cat])

  const top = sorted.slice(0, size)

  const found = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^@/, '')
    if (!t) return []
    return rows.filter((r) => r.handle.includes(t)).slice(0, 8)
  }, [rows, q])

  const chosen = useMemo(() => rows.filter((r) => core?.has(r.id)), [rows, core])
  const topAllIn = top.length > 0 && top.every((r) => core?.has(r.id))

  return (
    <>
      <div className="core-bar">
        <div className="cb-g">
          <span className="k">정렬</span>
          <div className="seg">
            {SORTS.map((s) => (
              <button key={s.k} className={sort === s.k ? 'on' : ''} onClick={() => setSort(s.k)}>
                {s.l}
              </button>
            ))}
          </div>
        </div>

        <div className="cb-g">
          <span className="k">묶음</span>
          <div className="seg">
            {SIZES.map((n) => (
              <button key={n} className={size === n ? 'on' : ''} onClick={() => setSize(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="cb-g">
          <span className="k">카테고리</span>
          <div className="opts">
            <button className={`opt ${cat === '전체' ? 'on' : ''}`} onClick={() => setCat('전체')}>전체</button>
            {CATEGORIES.map((c) => (
              <button key={c} className={`opt ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>

        <div className="cb-g right">
          <input
            className="fin"
            placeholder="계정으로 개별 지정"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 220 }}
          />
        </div>
      </div>

      {found.length > 0 && (
        <div className="core-find">
          {found.map((r) => (
            <button
              key={r.id}
              className={`fchip ${core?.has(r.id) ? 'on' : ''}`}
              onClick={() => core?.toggle(r.id)}
            >
              {core?.has(r.id) ? '✓ ' : '+ '}{at(r.handle)}
              <i>협업 {r.worked}회</i>
            </button>
          ))}
        </div>
      )}

      <div className="work">
        <div className="panel">
          <div className="zh" style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--line-2)' }}>
            <h2 style={{ fontSize: 16 }}>{SORTS.find((s) => s.k === sort)!.l} 상위 {size}명</h2>
            <p>{cat === '전체' ? `${sorted.length.toLocaleString('ko-KR')}명 중` : `${cat} ${sorted.length.toLocaleString('ko-KR')}명 중`}</p>
            <div className="right" style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn"
                onClick={() => (topAllIn ? core?.removeMany(top.map((r) => r.id)) : core?.addMany(top.map((r) => r.id)))}
              >
                {topAllIn ? `이 ${top.length}명 빼기` : `이 ${top.length}명 한 번에 담기`}
              </button>
              <button className="btn pri" onClick={() => core?.replace(top.map((r) => r.id))}>
                이 명단으로 갈아끼우기
              </button>
            </div>
          </div>

          <div className="sheet" style={{ maxHeight: 'none', border: 0, borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>담기</th>
                  <th>인플루언서</th>
                  <th style={{ width: 150 }}>카테고리</th>
                  <th className="n" style={{ width: 74 }}>협업</th>
                  <th className="n" style={{ width: 86 }}>최근</th>
                  <th style={{ width: 92 }}>일정</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r) => (
                  <tr key={r.id} onClick={() => core?.toggle(r.id)} style={{ cursor: 'pointer' }}>
                    <td><span className={`tick ${core?.has(r.id) ? 'on' : ''}`}>✓</span></td>
                    <td>
                      <span className="hl2">{at(r.handle)}</span>
                      <small>{r.platform}</small>
                    </td>
                    <td>
                      {r.cats.length === 0
                        ? <span className="ccat none">미분류</span>
                        : r.cats.map((c) => <span className="ccat" key={c}>{c}</span>)}
                    </td>
                    <td className="n"><b>{r.worked}</b>회</td>
                    <td className="n">{ymd(r.lastAt)}</td>
                    <td>
                      <span className={`chip st ${r.status === 'open' ? 'pass' : r.status === 'busy' ? 'fix' : 'wait'}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="side">
          <div className="panel">
            <div className="bar">
              <b style={{ fontSize: 14 }}>핵심 인플루언서</b>
              <div className="right"><span className="chip sel">{core?.size ?? 0}</span></div>
            </div>
            <div className="rows" style={{ maxHeight: 520, overflowY: 'auto' }}>
              {chosen.slice(0, 40).map((r) => (
                <div className="row" key={r.id} style={{ padding: '11px 20px', cursor: 'default' }}>
                  <span className="lead">
                    <span className="t" style={{ fontSize: 13.5 }}>{at(r.handle)}</span>
                    <span className="s">협업 {r.worked}회 · {ymd(r.lastAt)}</span>
                  </span>
                  <span className="tail">
                    <button className="btn ghost" onClick={() => core?.toggle(r.id)}>빼기</button>
                  </span>
                </div>
              ))}
              {chosen.length === 0 && (
                <div style={{ padding: 26, fontSize: 13.5, color: 'var(--ink-3)' }}>
                  아직 아무도 담기지 않았습니다. 위에서 묶음으로 담거나 계정을 검색해 지정하세요.
                </div>
              )}
              {chosen.length > 40 && (
                <div style={{ padding: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
                  외 {chosen.length - 40}명
                </div>
              )}
            </div>
            {chosen.length > 0 && (
              <div className="actionbar">
                <span className="sum">{chosen.length}명</span>
                <div className="right">
                  <button className="btn" onClick={() => core?.clear()}>전체 비우기</button>
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="pad-sm">
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                여기서 고른 사람은 인플루언서 명단 맨 위에 오고,
                모집 폼을 만들 때 발송 대상으로 기본 선택됩니다.
                급할 때는 그 화면에서 해제할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
