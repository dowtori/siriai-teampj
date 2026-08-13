'use client'

import { useEffect, useRef, useState } from 'react'

/* 인스타그램 게시물 임베드.
   API 키도 앱 심사도 필요 없다. 공개 게시물이면 지금 바로 붙는다.

   삭제된 게시물 걸러내기 —
   임베드 iframe 은 부모에게 메시지를 보낸다. 살아있으면 LOADING → MEASURE → MOUNTED 순으로 오고,
   삭제된 게시물은 LOADING 에서 멈춘다. MOUNTED 가 오지 않으면 카드를 아예 지운다. */

export function embedUrl(url: string): string | null {
  const m = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed/` : null
}

const TIMEOUT = 6000

/** iframe 이 살아있는지 판정한다. MOUNTED 가 오면 ok, 시간 안에 안 오면 dead. */
export function useAlive(src: string | null, ref: React.RefObject<HTMLIFrameElement | null>) {
  const [state, setState] = useState<'checking' | 'ok' | 'dead'>(src ? 'checking' : 'dead')

  useEffect(() => {
    if (!src) return
    let alive = false

    const onMsg = (e: MessageEvent) => {
      if (!/instagram\.com/.test(e.origin)) return
      if (e.source !== ref.current?.contentWindow) return
      let d: unknown = e.data
      if (typeof d === 'string') { try { d = JSON.parse(d) } catch { return } }
      if (typeof d === 'object' && d && (d as { type?: string }).type === 'MOUNTED') {
        alive = true
        setState('ok')
      }
    }

    window.addEventListener('message', onMsg)
    const t = setTimeout(() => { if (!alive) setState('dead') }, TIMEOUT)
    return () => { window.removeEventListener('message', onMsg); clearTimeout(t) }
  }, [src, ref])

  return state
}

export default function Embed({
  url, handle, followers, meta,
}: {
  url: string
  /** 표시 이름 대신 핸들을 쓴다 — 이모지·특수문자로 깨지는 걸 막는다 */
  handle: string | null
  followers?: number | null
  meta?: string
}) {
  const src = embedUrl(url)
  const ref = useRef<HTMLIFrameElement>(null)
  const [state, setState] = useState<'checking' | 'ok' | 'dead'>(src ? 'checking' : 'dead')

  useEffect(() => {
    if (!src) return
    let alive = false

    const onMsg = (e: MessageEvent) => {
      if (!/instagram\.com/.test(e.origin)) return
      if (e.source !== ref.current?.contentWindow) return
      let d: unknown = e.data
      if (typeof d === 'string') { try { d = JSON.parse(d) } catch { return } }
      if (typeof d === 'object' && d && (d as { type?: string }).type === 'MOUNTED') {
        alive = true
        setState('ok')
      }
    }

    window.addEventListener('message', onMsg)
    const t = setTimeout(() => { if (!alive) setState('dead') }, TIMEOUT)
    return () => { window.removeEventListener('message', onMsg); clearTimeout(t) }
  }, [src])

  // 삭제됐거나 임베드할 수 없는 게시물은 자리 자체를 없앤다
  if (state === 'dead') return null

  const at = handle ? (handle.startsWith('@') ? handle : '@' + handle.replace('instagram.com/', '')) : null

  return (
    <article className="ecard">
      <div className={`efr ${state === 'checking' ? 'load' : ''}`}>
        {state === 'checking' && <span className="espin" aria-hidden />}
        <iframe
          ref={ref}
          src={src!}
          title={at ?? '게시물'}
          loading="lazy"
          scrolling="no"
          frameBorder={0}
          style={{ opacity: state === 'ok' ? 1 : 0 }}
        />
      </div>
      <div className="ebd">
        <a href={url} target="_blank" rel="noreferrer" className="enm">
          {at ?? '게시물 보기'} ↗
        </a>
        <span className="emt">
          {followers != null && <b>{followers.toLocaleString('ko-KR')} 팔로워</b>}
          {followers != null && meta ? ' · ' : ''}
          {meta}
        </span>
      </div>
    </article>
  )
}
