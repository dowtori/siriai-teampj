'use client'

import { useMemo, useState } from 'react'
import { Drawer } from '@/app/ui/Overlay'
import { STATUS_LABEL, type Status } from '@/lib/avail-types'
import { CATEGORIES, type Category } from '@/lib/cat-types'
import { useCore } from '../../Core'

export type CreatorRow = {
  cats: Category[]
  lastAt: string | null
  lastName: string | null
  /** 지금 제안을 넣을 수 있는가 */
  status: Status
  until: string | null
  why: string
  recentBrands: string[]
  key: string
  handle: string
  name: string
  url: string | null
  platform: string
  /** 진행시트를 되짚어 센 협업 횟수 */
  worked: number
  campaigns: string[]
  campaignsMore: number
  followers: number | null
  er: number | null
  fee: number | null
  posts: number
  verified: boolean
  brands: string[]
  /** 진행시트에서 팔로워·단가까지 나온 계정인지 */
  detailed: boolean
}

const cnt = (n: number | null) => (n == null ? '—' : n.toLocaleString('ko-KR'))
const won = (n: number | null) => (n == null ? '—' : '₩' + n.toLocaleString('ko-KR'))
const at = (h: string) => '@' + h

type Tab = 'core' | 'open' | 'regular' | 'repeat' | 'busy' | 'all'
const TABS: { k: Tab; l: string; d: string }[] = [
  { k: 'core', l: '핵심', d: '상시 데리고 가는 정예' },
  { k: 'open', l: '지금 가능', d: '진행 중인 건도 쿨다운도 없음' },
  { k: 'regular', l: '단골', d: '여섯 번 이상' },
  { k: 'repeat', l: '재협업', d: '두 번 이상' },
  { k: 'busy', l: '묶인 사람', d: '진행 중 · 쿨다운' },
  { k: 'all', l: '전체', d: '' },
]

const SORTS = [
  { k: 'worked', l: '협업 횟수 순' },
  { k: 'recent', l: '최근 협업 순' },
  { k: 'follow', l: '팔로워 순' },
] as const
type SortKey = (typeof SORTS)[number]['k']

const SIZES = [20, 50, 100, 200] as const
const ymd = (d: string | null) => (d ? d.slice(2).replace(/-/g, '.') : '—')

export default function Roster({ rows }: { rows: CreatorRow[] }) {
  const core = useCore()
  const [tab, setTab] = useState<Tab>('core')
  const [cat, setCat] = useState<Category | '전체'>('전체')
  const [q, setQ] = useState('')
  const [plat, setPlat] = useState('전체')
  const [open, setOpen] = useState<CreatorRow | null>(null)
  const [sort, setSort] = useState<SortKey>('worked')
  const [desc, setDesc] = useState(true)
  const [size, setSize] = useState<number>(50)
  const [page, setPage] = useState(0)
  /* 핵심을 맨 위로 올릴지. 기본은 올린다 — 명단을 열면 정예부터 보여야 한다.
     끄면 고른 정렬만으로 줄을 세운다. */
  const [coreTop, setCoreTop] = useState(true)

  const platforms = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) m.set(r.platform, (m.get(r.platform) ?? 0) + 1)
    return ['전체', ...[...m.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p)]
  }, [rows])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^@/, '')
    const list = rows.filter((r) =>
      (tab === 'core' ? core?.has(r.key)
        : tab === 'open' ? r.status === 'open'
        : tab === 'regular' ? r.worked >= 6
        : tab === 'repeat' ? r.worked >= 2
        : tab === 'busy' ? r.status !== 'open'
        : true)
      && (plat === '전체' || r.platform === plat)
      && (cat === '전체' || (cat === '기타' ? r.cats.length === 0 : r.cats.includes(cat)))
      && (!t || r.handle.includes(t) || r.name.toLowerCase().includes(t)),
    )
    const dir = desc ? 1 : -1
    return [...list].sort((a, b) => {
      if (coreTop) {
        const c = Number(!!core?.has(b.key)) - Number(!!core?.has(a.key))
        if (c !== 0) return c
      }
      if (sort === 'worked') return (b.worked - a.worked) * dir || (b.lastAt ?? '').localeCompare(a.lastAt ?? '')
      if (sort === 'recent') return (b.lastAt ?? '').localeCompare(a.lastAt ?? '') * dir || b.worked - a.worked
      return ((b.followers ?? -1) - (a.followers ?? -1)) * dir || b.worked - a.worked
    })
  }, [rows, tab, plat, q, cat, core, sort, desc, coreTop])

  const pages = Math.max(1, Math.ceil(list.length / size))
  const cur = Math.min(page, pages - 1)
  const shown = list.slice(cur * size, cur * size + size)

  const reset = () => setPage(0)
  const flip = (k: SortKey) => {
    if (sort === k) setDesc((v) => !v)
    else { setSort(k); setDesc(true) }
    setPage(0)
  }

  return (
    <>
      <div className="zh" style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--line-2)' }}>
        <div className="seg">
          {TABS.map((t) => (
            <button
              key={t.k}
              className={tab === t.k ? 'on' : ''}
              onClick={() => { setTab(t.k); reset() }}
              title={t.d}
            >
              {t.l}
            </button>
          ))}
        </div>
        <div className="right" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="btn"
            value={cat}
            onChange={(e) => { setCat(e.target.value as Category | '전체'); reset() }}
            style={{ padding: '8px 12px', fontSize: 12.5 }}
          >
            <option value="전체">카테고리 전체</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="btn"
            value={plat}
            onChange={(e) => { setPlat(e.target.value); reset() }}
            style={{ padding: '8px 12px', fontSize: 12.5 }}
          >
            {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input
            className="fin"
            placeholder="계정 검색"
            value={q}
            onChange={(e) => { setQ(e.target.value); reset() }}
            style={{ width: 180 }}
          />
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{cnt(list.length)}명</span>
        </div>
      </div>

      <div className="core-bar" style={{ margin: 0, border: 0, borderBottom: '1px solid var(--line-2)', borderRadius: 0 }}>
        <div className="cb-g">
          <span className="k">정렬</span>
          <div className="seg">
            {SORTS.map((x) => (
              <button key={x.k} className={sort === x.k ? 'on' : ''} onClick={() => flip(x.k)}>
                {x.l}{sort === x.k && <i className="dir">{desc ? '↓' : '↑'}</i>}
              </button>
            ))}
          </div>
          <span className="dirn">{desc ? '내림차순' : '오름차순'}</span>
        </div>
        <div className="cb-g">
          <span className="k">한 쪽에</span>
          <div className="seg">
            {SIZES.map((n) => (
              <button key={n} className={size === n ? 'on' : ''} onClick={() => { setSize(n); setPage(0) }}>{n}</button>
            ))}
          </div>
        </div>
        <div className="cb-g right">
          <button className={`opt ${coreTop ? 'on' : ''}`} onClick={() => { setCoreTop((v) => !v); setPage(0) }}>
            ★ 핵심 먼저
          </button>
        </div>
      </div>

      <div className="sheet tall" style={{ border: 0, borderRadius: 0 }}>
        <table>
          <thead>
            <tr>
              <th>인플루언서</th>
              <th style={{ width: 140 }}>카테고리</th>
              <th className="n" style={{ width: 78 }}>협업</th>
              <th className="n" style={{ width: 92 }}>팔로워</th>
              <th className="n" style={{ width: 68 }}>ER</th>
              <th className="n" style={{ width: 104 }}>최근 단가</th>
              <th style={{ width: 200 }}>최근 협업</th>
              <th style={{ width: 110 }}>일정</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.key} onClick={() => setOpen(r)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className="hl2">
                    {core?.has(r.key) && <span className="corestar" title="핵심 인플루언서">★</span>}
                    {at(r.handle)}
                  </span>
                  <small>{r.platform}{r.brands.length > 0 ? ` · ${r.brands.slice(0, 2).join(' · ')}` : ''}</small>
                </td>
                <td>
                  {r.cats.length === 0
                    ? <span className="ccat none">미분류</span>
                    : r.cats.map((c) => <span className="ccat" key={c}>{c}</span>)}
                </td>
                <td className="n">
                  <b style={{ color: r.worked >= 6 ? 'var(--accent)' : 'inherit' }}>{r.worked}</b>회
                </td>
                <td className="n">{cnt(r.followers)}</td>
                <td className="n">{r.er != null ? `${r.er.toFixed(1)}%` : '—'}</td>
                <td className="n">{won(r.fee)}</td>
                <td>
                  <span className="lastc">{ymd(r.lastAt)}</span>
                  <small>{r.lastName ?? '기록 없음'}</small>
                </td>
                <td>
                  <span className={`chip st ${r.status === 'open' ? 'pass' : r.status === 'busy' ? 'fix' : 'wait'}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div style={{ padding: 34, color: 'var(--ink-3)', fontSize: 14 }}>조건에 맞는 계정이 없습니다.</div>
        )}
      </div>

      <p className="idx-note">
        인덱싱은 여기서 더 늘어납니다 — 예시1 팔로워 구간 · 예시2 지역 · 예시3 평균 조회수 ·
        예시4 최근 업로드율. 담당자가 이어서 붙일 자리입니다.
      </p>

      <div className="pager">
        <button className="btn" disabled={cur === 0} onClick={() => setPage(0)}>처음</button>
        <button className="btn" disabled={cur === 0} onClick={() => setPage(cur - 1)}>← 이전</button>
        <span className="pg">
          {list.length === 0 ? '0' : (cur * size + 1).toLocaleString('ko-KR')}–
          {Math.min((cur + 1) * size, list.length).toLocaleString('ko-KR')}
          {' / '}{list.length.toLocaleString('ko-KR')}명 · {cur + 1}/{pages}쪽
        </span>
        <button className="btn" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>다음 →</button>
        <button className="btn" disabled={cur >= pages - 1} onClick={() => setPage(pages - 1)}>마지막</button>
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        eyebrow="CREATOR"
        title={open ? at(open.handle) : ''}
        meta={open ? `${open.platform} · 협업 ${open.worked}회` : null}
        footer={
          <>
            {open?.url && (
              <a className="btn" href={open.url} target="_blank" rel="noreferrer">프로필 열기 ↗</a>
            )}
            <button className="btn" onClick={() => setOpen(null)}>닫기</button>
          </>
        }
      >
        {open && (
          <>
            <div className="trio">
              <div><span className="k">협업</span><span className="v">{open.worked}회</span></div>
              <div><span className="k">팔로워</span><span className="v">{cnt(open.followers)}</span></div>
              <div><span className="k">최근 단가</span><span className="v">{won(open.fee)}</span></div>
            </div>

            <div className="sect">
              <h4>일정</h4>
              <div className="note info">
                <div>
                  <b>{STATUS_LABEL[open.status]}</b>
                  {open.why}
                  {open.recentBrands.length > 0 && (
                    <><br />최근 90일 함께한 거래처 — {open.recentBrands.join(' · ')}</>
                  )}
                </div>
              </div>
            </div>

            <div className="sect">
              <h4>참여한 캠페인</h4>
              <div className="rows">
                {open.campaigns.map((c, i) => (
                  <div className="row" key={i} style={{ cursor: 'default', paddingLeft: 0, paddingRight: 0 }}>
                    <span className="dot live" />
                    <span className="lead"><span className="t">{c}</span></span>
                  </div>
                ))}
              </div>
              {open.campaignsMore > 0 && (
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)' }}>
                  외 {open.campaignsMore}건
                </p>
              )}
            </div>

            {!open.detailed && (
              <div className="note info">
                <div>
                  <b>진행시트 상세가 아직 없습니다</b>
                  협업 이력은 확인되지만 팔로워 · ER · 단가는 이 계정이 들어 있던 진행시트가
                  아직 캠페인에 연결되지 않아 비어 있습니다. 연결하면 자동으로 채워집니다.
                </div>
              </div>
            )}
          </>
        )}
      </Drawer>
    </>
  )
}
