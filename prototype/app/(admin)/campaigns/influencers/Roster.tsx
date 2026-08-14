'use client'

import { useMemo, useState } from 'react'
import { Drawer } from '@/app/ui/Overlay'

export type CreatorRow = {
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

type Tab = 'regular' | 'repeat' | 'detailed' | 'all'
const TABS: { k: Tab; l: string; d: string }[] = [
  { k: 'regular', l: '단골', d: '여섯 번 이상' },
  { k: 'repeat', l: '재협업', d: '두 번 이상' },
  { k: 'detailed', l: '상세 확보', d: '팔로워 · 단가 있음' },
  { k: 'all', l: '전체', d: '' },
]

const PAGE = 12

export default function Roster({ rows }: { rows: CreatorRow[] }) {
  const [tab, setTab] = useState<Tab>('regular')
  const [q, setQ] = useState('')
  const [plat, setPlat] = useState('전체')
  const [limit, setLimit] = useState(PAGE)
  const [open, setOpen] = useState<CreatorRow | null>(null)

  const platforms = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) m.set(r.platform, (m.get(r.platform) ?? 0) + 1)
    return ['전체', ...[...m.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p)]
  }, [rows])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^@/, '')
    return rows.filter((r) =>
      (tab === 'regular' ? r.worked >= 6
        : tab === 'repeat' ? r.worked >= 2
        : tab === 'detailed' ? r.detailed
        : true)
      && (plat === '전체' || r.platform === plat)
      && (!t || r.handle.includes(t) || r.name.toLowerCase().includes(t)),
    )
  }, [rows, tab, plat, q])

  const reset = () => setLimit(PAGE)

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
        <div className="right" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

      <div className="sheet" style={{ maxHeight: 'none', border: 0, borderRadius: 0 }}>
        <table>
          <thead>
            <tr>
              <th>인플루언서</th>
              <th style={{ width: 88 }}>플랫폼</th>
              <th className="n" style={{ width: 78 }}>협업</th>
              <th className="n" style={{ width: 92 }}>팔로워</th>
              <th className="n" style={{ width: 68 }}>ER</th>
              <th className="n" style={{ width: 104 }}>최근 단가</th>
              <th style={{ width: 62 }}>상세</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, limit).map((r) => (
              <tr key={r.key} onClick={() => setOpen(r)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className="hl2">{at(r.handle)}</span>
                  {r.brands.length > 0 && <small>{r.brands.slice(0, 2).join(' · ')}</small>}
                </td>
                <td>{r.platform}</td>
                <td className="n">
                  <b style={{ color: r.worked >= 6 ? 'var(--accent)' : 'inherit' }}>{r.worked}</b>회
                </td>
                <td className="n">{cnt(r.followers)}</td>
                <td className="n">{r.er != null ? `${r.er.toFixed(1)}%` : '—'}</td>
                <td className="n">{won(r.fee)}</td>
                <td style={{ color: 'var(--ink-3)' }}>{r.detailed ? '있음' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div style={{ padding: 34, color: 'var(--ink-3)', fontSize: 14 }}>조건에 맞는 계정이 없습니다.</div>
        )}
      </div>

      {limit < list.length && (
        <button className="more" onClick={() => setLimit((n) => n + 24)}>
          {cnt(list.length - limit)}명 더 보기
        </button>
      )}

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
