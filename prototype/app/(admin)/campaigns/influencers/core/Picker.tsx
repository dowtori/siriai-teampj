'use client'

import { useMemo, useState } from 'react'
import { useCore } from '../../../Core'
import { Modal } from '@/app/ui/Overlay'
import { CATEGORIES, type Category } from '@/lib/cat-types'
import { STATUS_LABEL, type Status } from '@/lib/avail-types'

export type Pick = {
  id: string
  handle: string
  platform: string
  /** 리스트에 오른 횟수 (제안) */
  listed: number
  /** 선정된 횟수 (실제 협업) */
  picked: number
  known: boolean
  /** 마지막 협업 시점과 그때 캠페인 */
  lastAt: string | null
  lastName: string | null
  url: string | null
  cats: Category[]
  status: Status
}

const SORTS = [
  { k: 'picked', l: '선정 횟수 순' },
  { k: 'listed', l: '리스트 등재 순' },
  { k: 'recent', l: '최근 협업 순' },
] as const
type SortKey = (typeof SORTS)[number]['k']

const SIZES = [20, 50, 100, 200] as const

const at = (h: string) => '@' + h
const ymd = (d: string | null) => (d ? d.slice(2).replace(/-/g, '.') : '—')

/* 붙여넣기 한 덩어리에서 계정만 뽑는다.
   주소 형태가 제각각이라 정규식 하나로 받지 않고 조각을 내어 판단한다.
   https://www.instagram.com/handle/  ·  instagram.com/handle?igsh=...
   instagram.com/handle/reel/ABC     ·  tiktok.com/@handle
   youtube.com/@handle               ·  @handle  ·  handle */
const POST_SEG = new Set(['p', 'reel', 'reels', 'tv', 'share', 'explore', 'stories', 'video', 'channel', 'c', 'user'])

export function parseHandles(text: string): { handles: string[]; skipped: string[] } {
  const handles: string[] = []
  const skipped: string[] = []
  const seen = new Set<string>()

  for (const raw of text.split(/[\s,;\n\r\t]+/)) {
    const t = raw.trim()
    if (!t) continue

    let s = t.replace(/^["'<(]+|[">)\].,]+$/g, '')
    s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
    s = s.split('#')[0].split('?')[0]            // 쿼리와 앵커를 버린다
    s = s.replace(/^m\./i, '')

    // 도메인이 붙어 있으면 떼고 경로만 본다
    const dom = s.match(/^([\w.-]*\.(?:com|net|me|kr|co\.kr|to|tv))\/(.*)$/i)
    let path = s
    if (dom) path = dom[2]
    else if (/^[\w.-]*\.(?:com|net|me|kr|to|tv)$/i.test(s)) { skipped.push(t); continue }

    const segs = path.split('/').filter(Boolean)
    if (segs.length === 0) { skipped.push(t); continue }

    let h = segs[0]
    // instagram.com/p/ABC 처럼 계정이 없는 게시물 주소
    if (POST_SEG.has(h.toLowerCase())) { skipped.push(t); continue }
    h = h.replace(/^@/, '').toLowerCase()
    if (!h || !/^[a-z0-9._-]+$/.test(h)) { skipped.push(t); continue }

    if (!seen.has(h)) { seen.add(h); handles.push(h) }
  }
  return { handles, skipped }
}

export default function Picker({ rows }: { rows: Pick[] }) {
  const core = useCore()
  const [sort, setSort] = useState<SortKey>('picked')
  const [desc, setDesc] = useState(true)
  const [size, setSize] = useState<number>(50)
  const [page, setPage] = useState(0)
  /* 카테고리는 겹쳐서 고른다. 아무것도 안 고르면 전체다. */
  const [cats, setCats] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [bulk, setBulk] = useState(false)
  const [paste, setPaste] = useState('')
  const [result, setResult] = useState<{ hit: string[]; miss: string[] } | null>(null)

  const sorted = useMemo(() => {
    const list = rows.filter((r) =>
      cats.length === 0 ||
      cats.some((c) => (c === '기타' ? r.cats.length === 0 : r.cats.includes(c))),
    )
    const dir = desc ? 1 : -1
    return [...list].sort((a, b) => {
      if (sort === 'picked') return (b.picked - a.picked) * dir || b.listed - a.listed
      if (sort === 'listed') return (b.listed - a.listed) * dir || b.picked - a.picked
      return (b.lastAt ?? '').localeCompare(a.lastAt ?? '') * dir || b.picked - a.picked
    })
  }, [rows, sort, desc, cats])

  const pages = Math.max(1, Math.ceil(sorted.length / size))
  const cur = Math.min(page, pages - 1)
  const shown = sorted.slice(cur * size, cur * size + size)

  const found = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^@/, '')
    if (!t) return []
    return rows.filter((r) => r.handle.includes(t)).slice(0, 8)
  }, [rows, q])

  const chosen = useMemo(() => rows.filter((r) => core?.has(r.id)), [rows, core])
  const pageAllIn = shown.length > 0 && shown.every((r) => core?.has(r.id))

  const flip = (k: SortKey) => {
    if (sort === k) setDesc((v) => !v)
    else { setSort(k); setDesc(true) }
    setPage(0)
  }

  const toggleCat = (c: Category) => {
    setCats((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]))
    setPage(0)
  }

  const runPaste = () => {
    const { handles, skipped } = parseHandles(paste)
    const byHandle = new Map(rows.map((r) => [r.handle, r]))
    const hit: string[] = []
    const miss: string[] = [...skipped]
    for (const h of handles) {
      const r = byHandle.get(h)
      if (r) hit.push(r.id)
      else miss.push('@' + h)
    }
    core?.addMany(hit)
    setResult({ hit, miss })
  }

  return (
    <>
      <div className="core-bar">
        <div className="cb-g">
          <span className="k">정렬</span>
          <div className="seg">
            {SORTS.map((s) => (
              <button key={s.k} className={sort === s.k ? 'on' : ''} onClick={() => flip(s.k)}>
                {s.l}
                {sort === s.k && <i className="dir">{desc ? '↓' : '↑'}</i>}
              </button>
            ))}
          </div>
          <span className="dirn">{desc ? '내림차순' : '오름차순'}</span>
        </div>

        <div className="cb-g">
          <span className="k">한 쪽에</span>
          <div className="seg">
            {SIZES.map((n) => (
              <button key={n} className={size === n ? 'on' : ''} onClick={() => { setSize(n); setPage(0) }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="cb-g">
          <span className="k">카테고리</span>
          <div className="opts">
            <button className={`opt ${cats.length === 0 ? 'on' : ''}`} onClick={() => { setCats([]); setPage(0) }}>
              전체
            </button>
            {CATEGORIES.map((c) => (
              <button key={c} className={`opt ${cats.includes(c) ? 'on' : ''}`} onClick={() => toggleCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="cb-g right">
          <input
            className="fin"
            placeholder="계정으로 개별 지정"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 200 }}
          />
          <button className="btn" onClick={() => { setBulk(true); setResult(null); setPaste('') }}>
            일괄 업로드
          </button>
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
              <i>선정 {r.known ? r.picked + '회' : '확인 필요'}</i>
            </button>
          ))}
        </div>
      )}

      <div className="work">
        <div className="panel">
          <div className="zh" style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--line-2)' }}>
            <h2 style={{ fontSize: 16 }}>
              {SORTS.find((s) => s.k === sort)!.l} · {desc ? '내림차순' : '오름차순'}
            </h2>
            <p>
              {sorted.length.toLocaleString('ko-KR')}명
              {cats.length > 0 && ` · ${cats.join(' + ')}`}
              {' · '}{cur + 1}/{pages}쪽
            </p>
            <div className="right">
              <button
                className="btn"
                onClick={() => (pageAllIn
                  ? core?.removeMany(shown.map((r) => r.id))
                  : core?.addMany(shown.map((r) => r.id)))}
              >
                {pageAllIn ? `이 쪽 ${shown.length}명 해제` : `이 쪽 ${shown.length}명 담기`}
              </button>
            </div>
          </div>

          <div className="sheet tall" style={{ border: 0, borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>핵심</th>
                  <th>인플루언서</th>
                  <th style={{ width: 150 }}>카테고리</th>
                  <th className="n" style={{ width: 74 }}>선정</th>
                  <th className="n" style={{ width: 80 }}>리스트</th>
                  <th style={{ width: 210 }}>최근 협업</th>
                  <th style={{ width: 92 }}>일정</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const on = !!core?.has(r.id)
                  return (
                    <tr key={r.id} className={on ? 'is-core' : ''} onClick={() => core?.toggle(r.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <span className={`tick ${on ? 'on' : ''}`} aria-hidden>✓</span>
                      </td>
                      <td>
                        <span className="hl2">{at(r.handle)}</span>
                        <small>{r.platform}</small>
                      </td>
                      <td>
                        {r.cats.length === 0
                          ? <span className="ccat none">미분류</span>
                          : r.cats.map((c) => <span className="ccat" key={c}>{c}</span>)}
                      </td>
                      <td className="n">
                        {r.known
                          ? <><b style={{ color: r.picked >= 3 ? 'var(--accent)' : 'inherit' }}>{r.picked}</b>회</>
                          : <span className="unk" title="진행시트가 캠페인에 붙지 않아 선정 여부를 알 수 없습니다">확인 필요</span>}
                      </td>
                      <td className="n" style={{ color: 'var(--ink-3)' }}>{r.listed}회</td>
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
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <button className="btn" disabled={cur === 0} onClick={() => setPage(0)}>처음</button>
            <button className="btn" disabled={cur === 0} onClick={() => setPage(cur - 1)}>← 이전</button>
            <span className="pg">
              {(cur * size + 1).toLocaleString('ko-KR')}–{Math.min((cur + 1) * size, sorted.length).toLocaleString('ko-KR')}
              {' / '}{sorted.length.toLocaleString('ko-KR')}명
            </span>
            <button className="btn" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>다음 →</button>
            <button className="btn" disabled={cur >= pages - 1} onClick={() => setPage(pages - 1)}>마지막</button>
          </div>
        </div>

        <div className="side sticky-side">
          <div className="panel">
            <div className="bar">
              <b style={{ fontSize: 14 }}>핵심 인플루언서</b>
              <div className="right"><span className="chip sel">{core?.size ?? 0}</span></div>
            </div>
            <div className="rows" style={{ maxHeight: 520, overflowY: 'auto' }}>
              {chosen.slice(0, 60).map((r) => (
                <div className="row" key={r.id} style={{ padding: '11px 20px', cursor: 'default' }}>
                  <span className="lead">
                    <span className="t" style={{ fontSize: 13.5 }}>{at(r.handle)}</span>
                    <span className="s">선정 {r.known ? r.picked + '회' : '확인 필요'} · 리스트 {r.listed}회</span>
                  </span>
                  <span className="tail">
                    <button className="btn ghost" onClick={() => core?.toggle(r.id)}>빼기</button>
                  </span>
                </div>
              ))}
              {chosen.length === 0 && (
                <div style={{ padding: 26, fontSize: 13.5, color: 'var(--ink-3)' }}>
                  아직 아무도 담기지 않았습니다. 왼쪽에서 체크하거나, 계정을 검색하거나,
                  일괄 업로드로 주소를 붙여넣으세요.
                </div>
              )}
              {chosen.length > 60 && (
                <div style={{ padding: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
                  외 {chosen.length - 60}명
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
                왼쪽 체크가 곧 이 명단입니다. 체크를 풀면 여기서도 빠집니다.
                여기 담긴 사람은 인플루언서 명단 맨 위에 오고,
                모집 폼을 만들 때 발송 대상으로 기본 선택됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={bulk}
        onClose={() => setBulk(false)}
        eyebrow="BULK"
        title="계정 일괄 담기"
        meta="주소를 붙여넣으면 명단에서 찾아 담습니다"
        footer={
          <>
            <button className="btn pri" onClick={runPaste} disabled={!paste.trim()}>
              담기
            </button>
            <button className="btn" onClick={() => setBulk(false)}>닫기</button>
            {result && (
              <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-3)' }}>
                담김 {result.hit.length} · 못 찾음 {result.miss.length}
              </span>
            )}
          </>
        }
      >
        <div className="note info">
          <div>
            <b>주소 형태는 신경 쓰지 않아도 됩니다</b>
            줄바꿈 · 쉼표 · 공백 아무거나로 나눠 붙여넣으세요.
            https 유무, www, 뒤에 붙은 ?igsh=…, /reel/…, @핸들, 계정만 적은 것 모두 받습니다.
            게시물만 가리키는 주소(instagram.com/p/…)는 계정을 알 수 없어 못 찾음으로 갑니다.
          </div>
        </div>

        <textarea
          className="fin"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={7}
          placeholder={'https://www.instagram.com/heamiun/\ninstagram.com/_ezlloh?igsh=abc\n@crystalyxo\nbeureyu'}
          style={{ width: '100%', resize: 'vertical', lineHeight: 1.6, marginTop: 14 }}
        />

        {result && (
          <div className="sect">
            <h4>결과</h4>
            <div className="rows">
              <div className="row" style={{ cursor: 'default', paddingLeft: 0 }}>
                <span className="dot done" />
                <span className="lead">
                  <span className="t">{result.hit.length}명 담았습니다</span>
                  <span className="s">
                    {rows.filter((r) => result.hit.includes(r.id)).slice(0, 6).map((r) => at(r.handle)).join(' · ')}
                    {result.hit.length > 6 ? ` 외 ${result.hit.length - 6}` : ''}
                  </span>
                </span>
              </div>
              {result.miss.length > 0 && (
                <div className="row" style={{ cursor: 'default', paddingLeft: 0 }}>
                  <span className="dot issue" />
                  <span className="lead">
                    <span className="t">{result.miss.length}건은 명단에 없습니다</span>
                    <span className="s">{result.miss.slice(0, 8).join(' · ')}{result.miss.length > 8 ? ' …' : ''}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
