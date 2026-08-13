'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Modal } from './Overlay'

/* 버튼이 보이면 끝까지 눌러진다.
   누르면 모달이 열리고, 내용을 확인하거나 입력하고, 실행하면 완료 화면이 나온다.
   완료 상태는 세션 동안 유지되어 발표 중에 되돌아와도 그대로다. */

export type Field = {
  name: string
  label: string
  placeholder?: string
  type?: 'text' | 'tel' | 'textarea' | 'select'
  options?: string[]
  required?: boolean
  value?: string
}

function useDone(id: string) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    try { setDone(sessionStorage.getItem('act:' + id) === '1') } catch {}
  }, [id])
  const mark = () => {
    setDone(true)
    try { sessionStorage.setItem('act:' + id, '1') } catch {}
  }
  return [done, mark] as const
}

export default function Act({
  id, label, doneLabel, variant = 'btn', size,
  title, eyebrow, intro, fields, summary,
  confirmLabel = '실행', doneTitle = '처리했습니다', doneNote,
  onDone, children,
}: {
  id: string
  label: string
  doneLabel?: string
  variant?: 'btn' | 'btn pri' | 'pbtn' | 'pbtn ghost' | 'mbtn' | 'mbtn ghost'
  size?: 'sm'
  title: string
  eyebrow?: string
  intro?: ReactNode
  fields?: Field[]
  summary?: ReactNode
  confirmLabel?: string
  doneTitle?: string
  doneNote?: ReactNode
  onDone?: () => void
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [done, mark] = useDone(id)
  const [vals, setVals] = useState<Record<string, string>>({})

  const missing = (fields ?? []).some((f) => f.required && !(vals[f.name] ?? f.value ?? '').trim())

  const run = () => {
    setSent(true)
    mark()
    onDone?.()
  }

  const close = () => { setOpen(false); setTimeout(() => setSent(false), 250) }

  return (
    <>
      <button
        className={variant}
        style={size === 'sm' ? { padding: '8px 14px', fontSize: 12.5 } : undefined}
        onClick={() => setOpen(true)}
      >
        {done && <span aria-hidden style={{ color: 'var(--ok)' }}>✓</span>}
        {done ? (doneLabel ?? label) : label}
      </button>

      <Modal
        open={open}
        onClose={close}
        eyebrow={eyebrow}
        title={sent ? doneTitle : title}
        footer={
          sent ? (
            <button className="btn pri" onClick={close}>닫기</button>
          ) : (
            <>
              <button className="btn pri" onClick={run} disabled={missing}>{confirmLabel}</button>
              <button className="btn" onClick={close}>취소</button>
              {missing && (
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>필수 항목을 채워주세요</span>
              )}
            </>
          )
        }
      >
        {sent ? (
          <div className="act-done">
            <span className="mark">✓</span>
            <p>{doneNote ?? '실제 시스템에서는 여기서 알림이 나가고 상태가 다음 단계로 넘어갑니다.'}</p>
          </div>
        ) : (
          <>
            {intro && <div className="note info"><div>{intro}</div></div>}
            {summary}
            {fields && fields.length > 0 && (
              <div className="form">
                {fields.map((f) => (
                  <div className="frow" key={f.name}>
                    <div className="fl">
                      <b>{f.label}{f.required && <span style={{ color: 'var(--warn)' }}> *</span>}</b>
                    </div>
                    {f.type === 'textarea' ? (
                      <textarea
                        className="field"
                        rows={3}
                        placeholder={f.placeholder}
                        defaultValue={f.value}
                        onChange={(e) => setVals((v) => ({ ...v, [f.name]: e.target.value }))}
                      />
                    ) : f.type === 'select' ? (
                      <select
                        className="field"
                        defaultValue={f.value}
                        onChange={(e) => setVals((v) => ({ ...v, [f.name]: e.target.value }))}
                      >
                        {(f.options ?? []).map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        className="field"
                        type={f.type ?? 'text'}
                        placeholder={f.placeholder}
                        defaultValue={f.value}
                        onChange={(e) => setVals((v) => ({ ...v, [f.name]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            {children}
          </>
        )}
      </Modal>
    </>
  )
}
