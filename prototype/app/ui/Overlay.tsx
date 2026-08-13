'use client'

import { useEffect, type ReactNode } from 'react'

/* 정보 층위의 2·3단.
   1단은 화면에 있는 큰 수치와 목록,
   2단은 슬라이드오버(맥락을 잃지 않고 한 건을 본다),
   3단은 모달(한 가지 일에 집중한다). */

function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
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
