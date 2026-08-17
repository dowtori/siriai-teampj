'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/* 핵심 인플루언서 — 상시 데리고 가는 정예 명단.

   5,818명 전체는 인재풀로 그대로 두고, 그 위에 따로 얹는 층이다.
   여기 담긴 사람은 인플루언서 명단에서 맨 위에 오고,
   모집 폼을 만들 때 발송 대상으로 기본 체크된다.

   이름은 아직 확정이 아니다. 지금은 '핵심 인플루언서'로 부른다. */

const KEY = 'core:list'

type Ctx = {
  ids: Set<string>
  has: (id: string) => boolean
  toggle: (id: string) => void
  addMany: (ids: string[]) => void
  removeMany: (ids: string[]) => void
  replace: (ids: string[]) => void
  clear: () => void
  size: number
}

const CoreCtx = createContext<Ctx | null>(null)
export const useCore = () => useContext(CoreCtx)

export function CoreProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY)
      if (raw) setIds(new Set(JSON.parse(raw) as string[]))
    } catch { /* 무시 */ }
  }, [])

  const put = useCallback((next: Set<string>) => {
    setIds(next)
    try { sessionStorage.setItem(KEY, JSON.stringify([...next])) } catch { /* 무시 */ }
  }, [])

  const value: Ctx = {
    ids,
    size: ids.size,
    has: (id) => ids.has(id),
    toggle: (id) => {
      const n = new Set(ids)
      if (n.has(id)) n.delete(id); else n.add(id)
      put(n)
    },
    addMany: (list) => { const n = new Set(ids); for (const i of list) n.add(i); put(n) },
    removeMany: (list) => { const n = new Set(ids); for (const i of list) n.delete(i); put(n) },
    /** 명단을 통째로 갈아끼운다 */
    replace: (list) => put(new Set(list)),
    clear: () => put(new Set()),
  }

  return <CoreCtx.Provider value={value}>{children}</CoreCtx.Provider>
}
