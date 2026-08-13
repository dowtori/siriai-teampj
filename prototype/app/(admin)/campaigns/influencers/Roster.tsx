'use client'

import { useMemo, useState } from 'react'

export type CreatorRow = {
  key: string
  name: string
  url: string | null
  followers: number | null
  er: number | null
  proposals: number
  picks: number
  posts: number
  fee: number | null
  verified: boolean
  brands: string[]
}

const cnt = (n: number | null) => (n == null ? '—' : n.toLocaleString('ko-KR'))
const won = (n: number | null) => (n == null ? '—' : '₩' + n.toLocaleString('ko-KR'))

type Tab = 'worked' | 'repeat' | 'verified' | 'all'
const TABS: { k: Tab; l: string }[] = [
  { k: 'worked', l: '협업함' },
  { k: 'repeat', l: '재협업' },
  { k: 'verified', l: '정보 확보' },
  { k: 'all', l: '전체' },
]

export default function Roster({ rows }: { rows: CreatorRow[] }) {
  const [tab, setTab] = useState<Tab>('worked')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(10)

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return rows
      .filter((r) =>
        tab === 'worked' ? r.picks > 0
        : tab === 'repeat' ? r.picks > 1
        : tab === 'verified' ? r.verified
        : true,
      )
      .filter((r) => !t || r.name.toLowerCase().includes(t) || (r.url ?? '').includes(t))
  }, [rows, tab, q])

  return (
    <>
      <div className="zh">
        <h2>명단</h2>
        <p>{list.length}명</p>
        <div className="right">
          <div className="seg">
            {TABS.map((t) => (
              <button key={t.k} className={tab === t.k ? 'on' : ''}
                onClick={() => { setTab(t.k); setLimit(10) }}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-2)' }}>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setLimit(10) }}
            placeholder="이름이나 계정으로 찾기"
            style={{ width: '100%', border: 0, background: 'transparent', outline: 'none',
                     font: 'inherit', fontSize: 14.5, color: 'var(--ink)', letterSpacing: '-.014em' }}
          />
        </div>

        <div className="rows">
          {list.slice(0, limit).map((r) => (
            <div className="row" key={r.key} style={{ cursor: 'default' }}>
              <span className="ring" style={{ ['--p' as string]: r.proposals ? Math.round((r.picks / r.proposals) * 100) : 0 }}>
                <b>{r.picks}</b>
              </span>
              <span className="lead">
                <span className="t">
                  {r.name}
                  {r.picks > 1 && <span className="chip sel" style={{ marginLeft: 9, fontSize: 11 }}>재협업 {r.picks}회</span>}
                </span>
                <span className="s">
                  {r.url ? r.url.replace('instagram.com/', '@') : '계정 미확인'}
                  {r.brands.length > 0 ? ` · ${r.brands.slice(0, 2).join(' · ')}` : ''}
                  {r.verified ? ' · 정보 확보' : ''}
                </span>
              </span>
              <span className="tail">
                <span className="met"><b>{cnt(r.followers)}</b><span>FOLLOWERS</span></span>
                <span className="met"><b>{r.posts}</b><span>UPLOADS</span></span>
                <span className="met"><b>{won(r.fee)}</b><span>FEE</span></span>
              </span>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{ padding: 34, color: 'var(--ink-3)', fontSize: 14 }}>찾는 인원이 없습니다.</div>
          )}
        </div>

        {limit < list.length && (
          <button className="more" onClick={() => setLimit((n) => n + 25)}>
            {list.length - limit}명 더 보기
          </button>
        )}
      </div>
    </>
  )
}
