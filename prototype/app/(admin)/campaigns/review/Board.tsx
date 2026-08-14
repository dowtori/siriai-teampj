'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Drawer } from '@/app/ui/Overlay'
import Act from '@/app/ui/Act'
import { embedUrl, useAlive } from '@/app/b/Embed'
import { useNotices } from '../../Notices'
import {
  PRE, CON, POST, STATUS_LABEL,
  load, save, progress, personStatus, uploadStatus,
  type Person, type Store, type Status, type Upload,
} from './state'

export type CampRow = {
  id: string
  name: string
  brand: string
  month: string
  due: string | null
  uploads: number
  selected: number
}

const cnt = (n: number) => n.toLocaleString('ko-KR')

/* 세는 단위가 다르다. 콘텐츠 상태는 건, 사람 상태는 명.
   같은 숫자판에 섞어두면 "통과 0"처럼 말이 안 되는 값이 나온다. */
const TILES: { k: Status | 'post'; label: string; hint: string; unit: '건' | '명' }[] = [
  { k: 'none', label: '미업로드', hint: '선정됐는데 콘텐츠가 없는 사람', unit: '명' },
  { k: 'wait', label: '검수 대기', hint: '올라왔지만 확인이 끝나지 않은 건', unit: '건' },
  { k: 'fix', label: '수정 요청', hint: '다시 올려달라고 보낸 뒤 기다리는 건', unit: '건' },
  { k: 'blind', label: '확인 불가', hint: '삭제 · 비공개로 원본을 볼 수 없는 건', unit: '건' },
  { k: 'pass', label: '통과', hint: '콘텐츠 5항목이 다 확정된 건', unit: '건' },
  { k: 'post', label: '사후 대기', hint: '통과했지만 정산 항목이 남은 사람', unit: '명' },
]

export default function Board({
  camps, one, people,
}: {
  camps: CampRow[]
  one: CampRow | null
  people: Person[]
}) {
  const nt = useNotices()
  const mark = (id: string) => {
    const n = nt?.forCampaign(id).length ?? 0
    return n > 0 ? <span className="cnew">{n}</span> : null
  }

  /* ─────────── 캠페인 목록 ─────────── */
  if (!one) {
    return (
      <div className="wrap">
        <div className="ph">
          <div>
            <p className="eb">CAMPAIGNS</p>
            <h1>검수</h1>
            <p className="lede">
              캠페인 하나에 콘텐츠가 여러 건 올라옵니다. 캠페인을 열면 건별로 확인합니다.
            </p>
          </div>
        </div>

        <div className="zone">
          <div className="zh">
            <h2>검수가 걸린 캠페인</h2>
            <p>{cnt(camps.length)}건</p>
          </div>
          <div className="panel">
            <div className="rows">
              {camps.slice(0, 20).map((c) => (
                <Link
                  className="row" key={c.id}
                  href={`/campaigns/review?c=${c.id}`}
                  onClick={() => nt?.readCampaign(c.id)}
                >
                  <span className={`dot ${c.uploads > 0 ? 'live' : 'issue'}`} />
                  <span className="lead">
                    <span className="t">{mark(c.id)}{c.name}</span>
                    <span className="s">
                      {c.brand} · {c.month}
                      {c.due ? ` · 납품 ${c.due.slice(5).replace('-', '/')}` : ''}
                    </span>
                  </span>
                  <span className="tail">
                    <span className="met">
                      <b>{cnt(c.uploads)}건</b>
                      <span>업로드</span>
                    </span>
                    <span className="met">
                      <b>{cnt(c.selected)}명</b>
                      <span>선정</span>
                    </span>
                    <span className="arrow">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <Sheet camp={one} people={people} camps={camps} />
}

/* ─────────── 캠페인 하나의 검수 보드 ─────────── */
function Sheet({ camp, people, camps }: { camp: CampRow; people: Person[]; camps: CampRow[] }) {
  const [store, setStore] = useState<Store | null>(null)
  const [filter, setFilter] = useState<Status | 'post' | null>(null)
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [desk, setDesk] = useState<{ p: Person; u: Upload } | null>(null)

  useEffect(() => { setStore(load(camp.id, people)); setSel({}) }, [camp.id, people])

  const set = (next: Store) => { setStore(next); save(camp.id, next) }

  const flipContent = (uploadId: string, key: string) => {
    if (!store) return
    const m = { ...(store.content[uploadId] ?? {}) }
    m[key] = !m[key]
    set({ ...store, content: { ...store.content, [uploadId]: m } })
  }
  const flipPerson = (personKey: string, key: string) => {
    if (!store) return
    const m = { ...(store.person[personKey] ?? {}) }
    m[key] = !m[key]
    set({ ...store, person: { ...store.person, [personKey]: m } })
  }

  const uploads = useMemo(() => people.flatMap((p) => p.uploads.map((u) => ({ p, u }))), [people])

  const prog = store ? progress(people, store) : null
  const tally = useMemo(() => {
    const t: Record<string, number> = {}
    if (!store) return t
    // 사람으로 세는 것
    for (const p of people) {
      if (!p.selected && p.uploads.length === 0) continue
      const s = personStatus(p, store)
      if (s === 'none' || s === 'post') t[s] = (t[s] ?? 0) + 1
    }
    // 건으로 세는 것
    for (const p of people) {
      for (const u of p.uploads) {
        const s = uploadStatus(u, store)
        t[s] = (t[s] ?? 0) + 1
      }
    }
    return t
  }, [people, store])

  /* 거르는 중에 방금 처리한 줄이 사라지면 마지막으로 뭘 했는지 확인할 수 없다.
     걸러진 목록은 그 화면을 여는 순간의 명단으로 고정한다. */
  const [frozen, setFrozen] = useState<string[] | null>(null)
  useEffect(() => {
    if (!filter || !store) { setFrozen(null); return }
    const keep = people
      .filter((p) => (filter === 'none' || filter === 'post')
        ? personStatus(p, store) === filter
        : p.uploads.some((u) => uploadStatus(u, store) === filter))
      .map((p) => p.key)
    setFrozen(keep)
    // filter 가 바뀔 때만 다시 잡는다 — 체크할 때마다 다시 잡으면 의미가 없다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const shown = useMemo(() => {
    const list = people.filter((p) => p.selected || p.uploads.length > 0)
    if (!store || !filter) return list
    if (frozen) return list.filter((p) => frozen.includes(p.key))
    if (filter === 'none' || filter === 'post') {
      return list.filter((p) => personStatus(p, store) === filter)
    }
    // 건 상태는 그 상태인 콘텐츠를 하나라도 가진 사람을 남긴다
    return list.filter((p) => p.uploads.some((u) => uploadStatus(u, store) === filter))
  }, [people, store, filter, frozen])

  const picked = Object.keys(sel).filter((k) => sel[k])
  const pickedUploads = uploads.filter((x) => sel[x.p.key]).map((x) => x.u.id)

  const bulkPass = () => {
    if (!store) return
    const c = { ...store.content }
    for (const id of pickedUploads) {
      c[id] = Object.fromEntries(CON.map((x) => [x.k, true]))
    }
    set({ ...store, content: c })
    setSel({})
  }

  if (!store || !prog) return <div className="wrap"><div className="ph"><h1>검수</h1></div></div>

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">CAMPAIGNS · REVIEW</p>
          <h1>{camp.name}</h1>
          <p className="lede">
            선정 {cnt(prog.people)}명 · 업로드 {cnt(prog.uploads)}건 ·
            {' '}미검수 {cnt((tally.wait ?? 0) + (tally.fix ?? 0))}건
          </p>
        </div>
        <div className="right">
          <Link className="btn" href="/campaigns/review">캠페인 바꾸기</Link>
        </div>
      </div>

      <div className="zone">
        <div className="tiles rv6">
          {TILES.map((t) => (
            <button
              key={t.k}
              className={`tile ${filter === t.k ? 'on' : ''}`}
              onClick={() => setFilter(filter === t.k ? null : t.k)}
            >
              <div className="tile-h">
                <span className="ic">{filter === t.k ? '✓' : '·'}</span>
                <span className="go">{filter === t.k ? '이것만 보는 중' : '눌러서 거르기'}</span>
              </div>
              <span className="tv">{tally[t.k] ?? 0}<em className="tu">{t.unit}</em></span>
              <span className="tl">{t.label}</span>
              <span className="ts">{t.hint}</span>
            </button>
          ))}
        </div>

        <div className="panel">
          <div className="zh" style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--line-2)' }}>
            <h2 style={{ fontSize: 16 }}>명단</h2>
            <p>{cnt(shown.length)}명{filter ? ` · ${STATUS_LABEL[filter]}만` : ''}</p>
            <div className="right">
              {filter && <button className="btn" onClick={() => setFilter(null)}>거르기 해제</button>}
            </div>
          </div>

          {/* 분모가 항목마다 다르다 — 사람 기준과 건 기준을 머리글에 적는다 */}
          <div className="rv-head">
            <span className="c0" />
            <span className="g">
              <b>사전 관리</b><i>{prog.people}명 기준</i>
              {prog.pre.map((x) => <em key={x.key}>{x.label} {x.n}/{x.d}</em>)}
            </span>
            <span className="g wide">
              <b>콘텐츠 검수</b><i>{prog.uploads}건 기준</i>
              {prog.con.map((x) => <em key={x.key}>{x.label} {x.n}/{x.d}</em>)}
            </span>
            <span className="g">
              <b>사후 관리</b><i>{prog.people}명 기준</i>
              {prog.post.map((x) => <em key={x.key}>{x.label} {x.n}/{x.d}</em>)}
            </span>
          </div>

          <div className="rv-list">
            {shown.map((p) => {
              const st = personStatus(p, store)
              const pm = store.person[p.key] ?? {}
              return (
                <div className={`rv-row st-${st}`} key={p.key}>
                  <button
                    className={`tick ${sel[p.key] ? 'on' : ''}`}
                    onClick={() => setSel((s) => ({ ...s, [p.key]: !s[p.key] }))}
                    aria-pressed={!!sel[p.key]}
                    aria-label="선택"
                  >✓</button>

                  <span className="who">
                    <b>{p.handle ?? p.name}</b>
                    <small>
                      <span className={`chip st ${st}`}>{STATUS_LABEL[st]}</span>
                      {p.uploads.length > 1 && <span className="multi">{p.uploads.length}건 올림</span>}
                      {!p.selected && p.uploads.length > 0 && <span className="multi">선정 외</span>}
                    </small>
                  </span>

                  <span className="dots">
                    {PRE.map((x) => (
                      <button
                        key={x.k}
                        className={`d ${pm[x.k] ? 'on' : ''}`}
                        title={x.l}
                        onClick={() => flipPerson(p.key, x.k)}
                      />
                    ))}
                  </span>

                  {/* 건이 여러 개면 줄이 여러 개다. 이 화면이 말해야 하는 것이 이것이다. */}
                  <span className="ups">
                    {p.uploads.length === 0 && <span className="noup">업로드 없음</span>}
                    {p.uploads.map((u, i) => {
                      const cm = store.content[u.id] ?? {}
                      const us = uploadStatus(u, store)
                      return (
                        <span className={`up st-${us}`} key={u.id}>
                          <button className="upn" onClick={() => setDesk({ p, u })}>
                            {i + 1}건째
                          </button>
                          <span className="dots">
                            {CON.map((x) => (
                              <button
                                key={x.k}
                                className={`d ${cm[x.k] ? 'on' : ''}`}
                                title={`${x.l} — ${x.hint}`}
                                onClick={() => flipContent(u.id, x.k)}
                              />
                            ))}
                          </span>
                        </span>
                      )
                    })}
                  </span>

                  <span className="dots">
                    {POST.map((x) => (
                      <button
                        key={x.k}
                        className={`d ${pm[x.k] ? 'on' : ''}`}
                        title={x.l}
                        onClick={() => flipPerson(p.key, x.k)}
                      />
                    ))}
                  </span>

                  <button
                    className="open"
                    onClick={() => p.uploads[0] && setDesk({ p, u: p.uploads[0] })}
                    disabled={p.uploads.length === 0}
                  >→</button>
                </div>
              )
            })}
            {shown.length === 0 && (
              <div style={{ padding: 34, color: 'var(--ink-3)', fontSize: 14 }}>
                {filter ? `${STATUS_LABEL[filter]}인 인원이 없습니다.` : '이 캠페인에는 명단이 없습니다.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {picked.length > 0 && (
        <div className="rv-selbar">
          <b>{picked.length}명 · 콘텐츠 {pickedUploads.length}건 선택</b>
          <div className="right">
            <button className="btn pri" onClick={bulkPass} disabled={pickedUploads.length === 0}>
              {pickedUploads.length}건 한 번에 통과
            </button>
            <Act
              id={`rv-bulk-fix-${camp.id}`}
              variant="btn" label="수정 요청" doneLabel="요청 보냄"
              eyebrow="REQUEST" title="선택한 건에 수정 요청"
              intro={<><b>{pickedUploads.length}건에 같은 사유로 요청합니다</b>알림톡이 나가고, 다시 올라오면 검수 대기로 돌아옵니다.</>}
              fields={[
                { name: 'why', label: '사유', type: 'select', value: '해시태그 누락',
                  options: ['해시태그 누락', '협찬 표기 누락', '가이드라인 불일치', '공동작업자 미설정', '기타'] },
                { name: 'memo', label: '요청 내용', type: 'textarea', required: true,
                  placeholder: '무엇을 어떻게 고쳐야 하는지' },
              ]}
              confirmLabel="요청 보내기" doneTitle="수정을 요청했습니다"
              doneNote="선택한 건이 수정 요청 상태로 바뀌었습니다."
            />
            <button className="btn" onClick={() => setSel({})}>해제</button>
          </div>
        </div>
      )}

      <Desk
        open={desk}
        store={store}
        onClose={() => setDesk(null)}
        onFlip={flipContent}
        onFlipPerson={flipPerson}
        onNext={() => {
          if (!desk) return
          const i = uploads.findIndex((x) => x.u.id === desk.u.id)
          const nx = uploads[i + 1]
          setDesk(nx ? { p: nx.p, u: nx.u } : null)
        }}
        index={desk ? uploads.findIndex((x) => x.u.id === desk.u.id) : -1}
        total={uploads.length}
      />

      {/* 캠페인 사이 이동 */}
      {camps.length > 1 && (
        <div className="zone">
          <div className="zh"><h2>다른 캠페인</h2><p>업로드가 많은 순</p></div>
          <div className="panel">
            <div className="rows">
              {camps.filter((c) => c.id !== camp.id).slice(0, 5).map((c) => (
                <Link className="row" key={c.id} href={`/campaigns/review?c=${c.id}`}>
                  <span className="dot live" />
                  <span className="lead">
                    <span className="t">{c.name}</span>
                    <span className="s">{c.brand} · 업로드 {c.uploads}건 · 선정 {c.selected}명</span>
                  </span>
                  <span className="tail"><span className="arrow">→</span></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────── 2단 — 건 하나를 보고 확정한다 ─────────── */
function Desk({
  open, store, onClose, onFlip, onFlipPerson, onNext, index, total,
}: {
  open: { p: Person; u: Upload } | null
  store: Store
  onClose: () => void
  onFlip: (uploadId: string, key: string) => void
  onFlipPerson: (personKey: string, key: string) => void
  onNext: () => void
  index: number
  total: number
}) {
  const [more, setMore] = useState(false)
  const src = open ? embedUrl(open.u.url) : null
  const ref = useRef<HTMLIFrameElement>(null)
  const alive = useAlive(src, ref)

  const cm = open ? store.content[open.u.id] ?? {} : {}
  const pm = open ? store.person[open.p.key] ?? {} : {}
  const left = CON.filter((c) => !cm[c.k]).length

  return (
    <Drawer
      open={!!open}
      onClose={onClose}
      eyebrow="REVIEW"
      title={open ? (open.p.handle ?? open.p.name) : ''}
      meta={open ? `${index + 1} / ${total}건째 · 남은 항목 ${left}개` : null}
      footer={
        open && (
          <>
            <button className="btn pri" onClick={onNext}>
              {index + 1 >= total
                ? '마지막 건입니다 · 닫기'
                : left === 0 ? '다음 건으로 →' : '이대로 다음 건 →'}
            </button>
            <button className="btn" onClick={onClose}>닫기</button>
            <a className="btn" href={open.u.url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto' }}>
              원본 ↗
            </a>
          </>
        )
      }
    >
      {open && (
        <>
          <div className="rv-desk">
            <div className="rv-shot">
              {src ? (
                <>
                  <iframe ref={ref} src={src} title="게시물" loading="lazy" scrolling="no"
                    style={{ opacity: alive === 'ok' ? 1 : 0 }} />
                  {alive !== 'ok' && (
                    <div className="rv-noshot">
                      {alive === 'checking' ? '게시물을 불러오는 중' : '삭제됐거나 비공개인 게시물입니다'}
                    </div>
                  )}
                </>
              ) : (
                <div className="rv-noshot">인스타그램 게시물이 아니라 화면에 붙일 수 없습니다</div>
              )}
            </div>

            <div className="rv-checks">
              {CON.map((c) => (
                <button
                  key={c.k}
                  className={`rv-check ${cm[c.k] ? 'on' : ''}`}
                  onClick={() => onFlip(open.u.id, c.k)}
                  aria-pressed={!!cm[c.k]}
                >
                  <i>✓</i>
                  <span>
                    <b>{c.l}</b>
                    <small>{c.hint}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="sect">
            <button className="rv-more" onClick={() => setMore((v) => !v)}>
              {more ? '▾' : '▸'} 사람 단위 항목
              <span>{open.p.uploads.length > 1 ? `이 값은 이 사람의 ${open.p.uploads.length}건이 함께 씁니다` : '사전 관리 · 사후 관리'}</span>
            </button>
            {more && (
              <div className="steps" style={{ marginTop: 12 }}>
                <div className="step">
                  <div className="sh"><b>사전 관리</b><span className="n">{PRE.filter((x) => pm[x.k]).length}/{PRE.length}</span></div>
                  <div className="checks">
                    {PRE.map((x) => (
                      <button className={`check ${pm[x.k] ? 'on' : ''}`} key={x.k}
                        onClick={() => onFlipPerson(open.p.key, x.k)}>
                        <i>✓</i>{x.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="step">
                  <div className="sh"><b>사후 관리</b><span className="n">{POST.filter((x) => pm[x.k]).length}/{POST.length}</span></div>
                  <div className="checks">
                    {POST.map((x) => (
                      <button className={`check ${pm[x.k] ? 'on' : ''}`} key={x.k}
                        onClick={() => onFlipPerson(open.p.key, x.k)}>
                        <i>✓</i>{x.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Drawer>
  )
}
