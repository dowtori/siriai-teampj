import { getDb } from './db'

/* 협업 횟수를 두 값으로 나눈다.

   지금까지 '협업 횟수'로 쓰던 값은 진행시트 리스트에 이름이 오른 횟수다.
   제안만 하고 선정되지 않은 것도 전부 세고 있었다.
   실제로 1,184명 중 679명(57%)이 리스트에만 오르고 선정된 적이 없고,
   '협업 37회'인 사람의 실제 선정은 1회다.
   이 값으로 정예를 뽑으면 같이 일한 적 없는 사람이 맨 위에 온다.

   · listed — 리스트에 오른 횟수 (제안). 명단 전체에 있다.
   · picked — 선정된 횟수 (실제 협업). 진행시트가 캠페인에 붙은 계정만 알 수 있다.
   · known  — 선정 여부를 확인할 수 있는 계정인가.
              모르는 것을 0으로 적으면 "한 번도 같이 안 했다"는 거짓말이 된다. */

export type Collab = { listed: number; picked: number; known: boolean }

let cache: Map<string, Collab> | null = null

export function collab(): Map<string, Collab> {
  if (cache) return cache
  const db = getDb()
  const out = new Map<string, Collab>()

  // 명단에 오른 횟수
  for (const c of db.creators ?? []) {
    out.set(c.handle, { listed: c.campaignCount, picked: 0, known: false })
  }

  // 진행시트에서 실제로 선정된 횟수
  for (const p of db.participations) {
    if (!p.handleUrl) continue
    const h = p.handleUrl.split('/').pop()!.toLowerCase()
    const cur = out.get(h) ?? { listed: 0, picked: 0, known: false }
    cur.known = true
    if (p.selected) cur.picked += 1
    out.set(h, cur)
  }

  cache = out
  return out
}

export function collabOf(handle: string): Collab {
  return collab().get(handle.toLowerCase()) ?? { listed: 0, picked: 0, known: false }
}

export function collabCounts() {
  const c = collab()
  let known = 0, worked = 0
  for (const v of c.values()) {
    if (!v.known) continue
    known += 1
    if (v.picked > 0) worked += 1
  }
  return { total: c.size, known, worked, unknown: c.size - known }
}
