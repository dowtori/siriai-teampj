'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/* 정보 층위의 2·3단.
   1단은 화면에 있는 큰 수치와 목록,
   2단은 슬라이드오버(맥락을 잃지 않고 한 건을 본다),
   3단은 모달(한 가지 일에 집중한다). */

/* 겹쳐 뜬 것의 수를 센다.
   드로어 위에 모달이 겹친 상태에서 Esc 를 누르면 둘이 같은 커밋에서 닫히는데,
   각자 "열기 전 값"을 기억했다 되돌리면 서로의 hidden 을 되살려 스크롤이 잠긴 채 남는다.
   0 이 될 때만 푼다. */
let locks = 0

function lock() {
  if (locks === 0) document.body.style.overflow = 'hidden'
  locks += 1
}

function unlock() {
  locks = Math.max(0, locks - 1)
  if (locks === 0) document.body.style.overflow = ''
}

function useOverlay(open: boolean, onClose: () => void) {
  // onClose 가 매 렌더 새 함수여도 효과가 다시 돌지 않게 잡아둔다
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current() }
    /* 겹쳐 뜬 것이 있으면 뒤로가기는 그것부터 닫는다.
       안 그러면 모달은 떠 있는데 뒤에 깔린 화면만 바뀐다. */
    const onPop = () => close.current()
    lock()
    document.addEventListener('keydown', onKey)
    window.addEventListener('popstate', onPop)
    return () => {
      unlock()
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
    }
  }, [open])
}

export function Drawer({
  open, onClose, eyebrow, title, meta, footer, children,
}: {
  open: boolean
  onClose: () => void
  eyebrow?: string
  title: string
  meta?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  useOverlay(open, onClose)
  if (!open) return null
  return (
    <>
      <div className="ov" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dr-h">
          <div style={{ minWidth: 0 }}>
            {eyebrow && <p className="eb">{eyebrow}</p>}
            <h3>{title}</h3>
            {meta && <p className="meta">{meta}</p>}
          </div>
          <button className="x" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="dr-b">{children}</div>
        {footer && <div className="dr-f">{footer}</div>}
      </aside>
    </>
  )
}

export function Modal({
  open, onClose, eyebrow, title, meta, footer, children, wide,
}: {
  open: boolean
  onClose: () => void
  eyebrow?: string
  title: string
  meta?: ReactNode
  footer?: ReactNode
  children: ReactNode
  /** 표나 격자처럼 폭이 필요한 내용일 때 */
  wide?: boolean
}) {
  useOverlay(open, onClose)
  if (!open) return null
  return (
    <>
      {/* 드로어 위에 한 겹 더 — 3단은 2단을 덮는다 */}
      <div className="ov ov2" onClick={onClose} />
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dr-h">
          <div style={{ minWidth: 0 }}>
            {eyebrow && <p className="eb">{eyebrow}</p>}
            <h3>{title}</h3>
            {meta && <p className="meta">{meta}</p>}
          </div>
          <button className="x" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="dr-b">{children}</div>
        {footer && <div className="dr-f">{footer}</div>}
      </div>
    </>
  )
}
