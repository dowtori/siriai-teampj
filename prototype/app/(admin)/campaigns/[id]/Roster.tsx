'use client'

import { useMemo, useState } from 'react'
import { Modal } from '@/app/ui/Overlay'

/* 참여 명단 — 캠페인 하나에 최대 90여 명.
   전부 펼치지 않고 5명씩, 검색과 필터로 좁힌다.
   개인정보는 목록에 아예 내보내지 않고 한 명씩 열어서 본다. */

export type Row = {
  id: string
  name: string
  url: string | null
  followers: number | null
  er: number | null
  fee: number | null
  selected: boolean
  posted: boolean
  shipped: string | null
  comment: string | null
  masked: { name: string; phone: string; address: string }
  real: { name: string; phone: string; address: string }
}

const cnt = (n: number | null) => (n == null ? '—' : n.toLocaleString('ko-KR'))
const won = (n: number | null) => (n == null ? '—' : '₩' + n.toLocaleString('ko-KR'))

export default function Roster({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState('')
  const [only, setOnly] = useState<'all' | 'sel'>('sel')
  const [limit, setLimit] = useState(5)
  const [open, setOpen] = useState<Row | null>(null)

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return rows
      .filter((r) => (only === 'sel' ? r.selected : true))
      .filter((r) => !t || r.name.toLowerCase().includes(t) || (r.url ?? '').includes(t))
  }, [rows, q, only])

  const selCount = rows.filter((r) => r.selected).length

  return (
    <>
      <div className="zh">
        <h2>참여 명단</h2>
        <p>제안 {rows.length}명 · 선정 {selCount}명</p>
        <div className="right">
          <div className="seg">
            <button className={only === 'sel' ? 'on' : ''} onClick={() => { setOnly('sel'); setLimit(5) }}>선정</button>
            <button className={only === 'all' ? 'on' : ''} onClick={() => { setOnly('all'); setLimit(5) }}>전체</button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-2)' }}>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setLimit(5) }}
            placeholder="이름이나 계정으로 찾기"
            style={{
              width: '100%', border: 0, background: 'transparent', outline: 'none',
              font: 'inherit', fontSize: 14.5, color: 'var(--ink)', letterSpacing: '-.014em',
            }}
          />
        </div>

        <div className="rows">
          {list.slice(0, limit).map((r) => (
            <button className="row" key={r.id} onClick={() => setOpen(r)}>
              <span className={`dot ${r.posted ? 'live' : r.selected ? 'issue' : ''}`} />
              <span className="lead">
                <span className="t">{r.name}</span>
                <span className="s">
                  {r.url ? r.url.replace('instagram.com/', '@') : '계정 미확인'}
                  {r.comment ? ` · ${r.comment}` : ''}
                </span>
              </span>
              <span className="tail">
                <span className="met">
                  <b>{cnt(r.followers)}</b>
                  <span>FOLLOWERS</span>
                </span>
                <span className="met">
                  <b>{won(r.fee)}</b>
                  <span>FEE</span>
                </span>
                <span className="arrow">→</span>
              </span>
            </button>
          ))}
          {list.length === 0 && (
            <div style={{ padding: 30, color: 'var(--ink-3)', fontSize: 14 }}>찾는 인원이 없습니다.</div>
          )}
        </div>

        {limit < list.length && (
          <button className="more" onClick={() => setLimit((n) => n + 15)}>
            {list.length - limit}명 더 보기
          </button>
        )}
      </div>

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        eyebrow="CREATOR"
        title={open?.name ?? ''}
        meta={open?.url ? open.url.replace('instagram.com/', '@') : null}
        footer={
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            실제 시스템에서는 권한에 따라 아래 정보가 아예 내려오지 않고, 누가 언제 열었는지 기록이 남습니다.
          </span>
        }
      >
        {open && (
          <>
            <div className="trio">
              <div>
                <span className="k">FOLLOWERS</span>
                <span className="v">{cnt(open.followers)}</span>
                <span className="s">{open.er != null ? `ER ${open.er.toFixed(1)}%` : 'ER 미확인'}</span>
              </div>
              <div>
                <span className="k">FEE</span>
                <span className="v">{won(open.fee)}</span>
                <span className="s">제안비용</span>
              </div>
              <div>
                <span className="k">STATUS</span>
                <span className="v" style={{ fontSize: 16 }}>
                  {open.posted ? '업로드' : open.selected ? '선정' : '제안'}
                </span>
                <span className="s">{open.shipped ?? '출고 전'}</span>
              </div>
            </div>

            <div className="sect">
              <h4>개인정보</h4>
              <dl className="kv">
                <dt>성함</dt><dd>{open.real.name}</dd>
                <dt>연락처</dt><dd className="num">{open.real.phone}</dd>
                <dt>주소</dt><dd>{open.real.address}</dd>
              </dl>
              <div className="note">
                <div>
                  <b>목록에는 이 정보를 내보내지 않습니다</b>
                  지금 검수시트에는 실명 · 연락처 · 자택 주소가 그대로 적혀 있고 링크를 아는 사람이면 볼 수 있습니다.
                  이 화면에서는 한 명씩 열어야 보이고, 실제로는 권한에 따라 서버가 아예 내려주지 않습니다.
                </div>
              </div>
            </div>

            {open.comment && (
              <div className="sect">
                <h4>담당자 메모</h4>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)' }}>{open.comment}</p>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
