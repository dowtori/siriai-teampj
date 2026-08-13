'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/* 코드 게이트 — 실제로 입력하고 들어갑니다. */

export default function Gate({
  base, codes, placeholder = '코드 6자리',
}: {
  base: '/b' | '/c'
  codes: string[]
  placeholder?: string
}) {
  const router = useRouter()
  const [v, setV] = useState('')
  const [err, setErr] = useState('')

  const go = () => {
    const code = v.trim().toUpperCase()
    if (!code) return
    if (!codes.includes(code)) {
      setErr('없는 코드입니다. 아래 데모 코드로 들어가 보세요.')
      return
    }
    router.push(`${base}/${code}`)
  }

  return (
    <>
      <div className="gate-in">
        <input
          value={v}
          onChange={(e) => { setV(e.target.value.toUpperCase()); setErr('') }}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          placeholder={placeholder}
          maxLength={6}
          autoFocus
        />
        <button className="pbtn" onClick={go} disabled={!v.trim()}>입장</button>
      </div>
      {err && (
        <p style={{ margin: '-14px 0 0', fontSize: 12.5, color: 'var(--warn)', letterSpacing: '-.01em' }}>
          {err}
        </p>
      )}
    </>
  )
}
