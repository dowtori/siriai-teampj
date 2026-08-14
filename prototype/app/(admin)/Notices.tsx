'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Drawer } from '@/app/ui/Overlay'
import type { Notice } from '@/lib/badges'

/* 새 항목 알림.
   탭에 들어가는 것으로는 안 지워진다. 그 항목을 하나씩 확인해야 줄어든다.
   숫자를 찾기 어려울 때를 위해 우상단에 떠 있는 종을 두고, 거기서 한 번에 처리한다. */

type Ctx = {
  all: Notice[]
  unread: Set<string>
  countFor: (tab: string) => number
  /** 이 캠페인에 걸린 새 항목 — 화면 안 카드 옆에 붙일 표시 */
  forCampaign: (campaignId: string) => Notice[]
  /** 그 캠페인을 열어보면 걸려 있던 것이 확인 처리된다 */
  readCampaign: (campaignId: string) => void
  read: (id: string) => void
  readAll: () => void
  openPanel: () => void
}

const NoticeCtx = createContext<Ctx | null>(null)
export const useNotices = () => useContext(NoticeCtx)

const KEY = 'notice:read'

/* 눌러본 흔적을 전부 지우고 처음 화면으로 되돌린다.
   알림 · 검수 체크 · 캠페인 메모 · 실행 버튼 완료 표시 · 브랜드가 본 캠페인. */
export function resetDemo() {
  try {
    const kill: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (!k) continue
      if (
        k === 'notice:read' || k === 'nav:seen' ||
        k.startsWith('act:') || k.startsWith('rv:') ||
        k.startsWith('thread:') || k.startsWith('bseen:')
      ) kill.push(k)
    }
    for (const k of kill) sessionStorage.removeItem(k)
  } catch { /* 무시 */ }
  location.reload()
}

export function NoticeProvider({ items, children }: { items: Notice[]; children: React.ReactNode }) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [panel, setPanel] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY)
      if (raw) setReadIds(new Set(JSON.parse(raw) as string[]))
    } catch { /* 무시 */ }
  }, [])

  const persist = (s: Set<string>) => {
    try { sessionStorage.setItem(KEY, JSON.stringify([...s])) } catch { /* 무시 */ }
  }

  const read = useCallback((id: string) => {
    setReadIds((s) => {
      if (s.has(id)) return s
      const next = new Set(s); next.add(id); persist(next); return next
    })
  }, [])

  const readAll = useCallback(() => {
    setReadIds(() => {
      const next = new Set(items.map((i) => i.id)); persist(next); return next
    })
  }, [items])

  const unread = useMemo(
    () => new Set(items.filter((i) => !readIds.has(i.id)).map((i) => i.id)),
    [items, readIds],
  )

  const countFor = useCallback(
    (tab: string) => items.filter((i) => i.tab === tab && unread.has(i.id)).length,
    [items, unread],
  )

  const forCampaign = useCallback(
    (campaignId: string) =>
      items.filter((i) => i.id.endsWith(':' + campaignId) && unread.has(i.id)),
    [items, unread],
  )

  const readCampaign = useCallback((campaignId: string) => {
    setReadIds((s) => {
      const hit = items.filter((i) => i.id.endsWith(':' + campaignId) && !s.has(i.id))
      if (hit.length === 0) return s
      const next = new Set(s)
      for (const h of hit) next.add(h.id)
      persist(next)
      return next
    })
  }, [items])

  const value: Ctx = {
    all: items, unread, countFor, forCampaign, readCampaign, read, readAll,
    openPanel: () => setPanel(true),
  }

  const list = items.filter((i) => unread.has(i.id))

  return (
    <NoticeCtx.Provider value={value}>
      {children}

      {/* 우상단에 떠 있는 종 — 숫자를 좌측에서 못 찾아도 여기서 다 처리한다.
          다 확인한 뒤에도 남겨둔다. 여기 안에 시연용 초기화가 들어 있다. */}
      <button
        className={`bell ${unread.size === 0 ? 'quiet' : ''}`}
        onClick={() => setPanel(true)}
        aria-label={unread.size > 0 ? `새 항목 ${unread.size}개` : '새 항목 없음'}
      >
        <span className="ic" aria-hidden>●</span>
        새 항목
        <span className="n">{unread.size}</span>
      </button>

      <Drawer
        open={panel}
        onClose={() => setPanel(false)}
        eyebrow="NEW"
        title="새 항목"
        meta={`${unread.size}개 · 확인하면 좌측 숫자가 줄어듭니다`}
        footer={
          <>
            <button className="btn" onClick={() => { readAll(); setPanel(false) }}>
              전체 확인 처리
            </button>
            <button className="btn" onClick={() => setPanel(false)}>닫기</button>
            {/* 시연 전에 처음 상태로 되돌린다. 미리 눌러본 것 때문에
                보여줄 게 사라지면 시연이 안 된다. */}
            <button className="btn reset" onClick={resetDemo} style={{ marginLeft: 'auto' }}>
              시연용 초기화
            </button>
          </>
        }
      >
        {list.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)' }}>새로 생긴 항목이 없습니다.</p>
        ) : (
          <div className="rows">
            {list.map((i) => (
              <div className="row" key={i.id} style={{ cursor: 'default' }}>
                <span className={`kchip k-${i.kind}`}>{i.kind}</span>
                <span className="lead">
                  <span className="t">{i.title}</span>
                  <span className="s">{i.sub}</span>
                </span>
                <span className="tail" style={{ gap: 8 }}>
                  <Link className="btn ghost" href={i.href} onClick={() => { read(i.id); setPanel(false) }}>
                    보러 가기
                  </Link>
                  <button className="btn ghost" onClick={() => read(i.id)}>확인</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </NoticeCtx.Provider>
  )
}
