/* 검수 상태 — 캠페인 하나에 콘텐츠가 10~30건 올라온다는 전제로 만든다.

   층위가 둘이다.
   · 사전 관리 · 사후 관리 → 사람 단위 (선정 33명이면 분모가 33)
   · 콘텐츠 검수         → 건 단위 (업로드 34건이면 분모가 34)
   한 사람이 두 건을 올리면 콘텐츠 5항목은 건마다 따로 붙는다. */

export const PRE = [
  { k: 'pre.notice', l: '선정안내' },
  { k: 'pre.ask', l: '개별요청' },
  { k: 'pre.reply', l: '답변' },
] as const

export const CON = [
  { k: 'c.up', l: '업로드 여부', hint: '콘텐츠 주소가 들어왔는지' },
  { k: 'c.guide', l: '가이드라인 준수', hint: '가이드 원문과 대조' },
  { k: 'c.collab', l: '공동작업자', hint: '브랜드 계정이 공동작업자로 걸렸는지' },
  { k: 'c.tag', l: '해시태그', hint: '필수 태그와 협찬 표기' },
  { k: 'c.garden', l: '가드닝', hint: '업로드 후 댓글 · 저장 관리' },
] as const

export const POST = [
  { k: 'p.fee', l: '고료' },
  { k: 'p.doc', l: '정산자료 수령' },
  { k: 'p.drive', l: '드라이브 저장' },
  { k: 'p.folio', l: '포트폴리오 적합도' },
  { k: 'p.itv', l: '인터뷰 적합도' },
] as const

export type Marks = Record<string, boolean>

export type Upload = {
  id: string
  url: string
  /** 임베드가 죽어 원본을 볼 수 없는 건 */
  blind?: boolean
}

export type Person = {
  key: string
  name: string
  handle: string | null
  followers: number | null
  fee: number | null
  selected: boolean
  uploads: Upload[]
  /** 시트 비고에 남아 있던 말 — 수정 요청의 씨앗 */
  remark: string | null
}

export type Fix = { reason: string; note: string; at: string }

export type Store = {
  person: Record<string, Marks>
  content: Record<string, Marks>
  fix: Record<string, Fix>
  blind: Record<string, true>
}

export const empty = (): Store => ({ person: {}, content: {}, fix: {}, blind: {} })

/* 기계가 알 수 있는 것만 미리 켠다.
   캡션을 가져오지 않으므로 해시태그·공동작업자는 자동으로 셀 수 없다. */
export function seed(people: Person[]): Store {
  const s = empty()
  for (const p of people) {
    s.person[p.key] = { 'pre.notice': p.selected, 'p.fee': (p.fee ?? 0) > 0 }
    for (const u of p.uploads) {
      s.content[u.id] = { 'c.up': true }
      if (u.blind) s.blind[u.id] = true
    }
  }
  return s
}

export type Status = 'none' | 'blind' | 'fix' | 'pass' | 'wait'

export function uploadStatus(u: Upload, s: Store): Status {
  if (s.blind[u.id]) return 'blind'
  if (s.fix[u.id]) return 'fix'
  const m = s.content[u.id] ?? {}
  return CON.every((c) => m[c.k]) ? 'pass' : 'wait'
}

export function personStatus(p: Person, s: Store): Status | 'post' {
  if (p.uploads.length === 0) return 'none'
  const st = p.uploads.map((u) => uploadStatus(u, s))
  if (st.includes('fix')) return 'fix'
  if (st.includes('blind')) return 'blind'
  if (st.every((x) => x === 'pass')) {
    const m = s.person[p.key] ?? {}
    return POST.every((x) => m[x.k]) ? 'pass' : 'post'
  }
  return 'wait'
}

export const STATUS_LABEL: Record<Status | 'post', string> = {
  none: '미업로드',
  wait: '검수 대기',
  fix: '수정 요청',
  blind: '확인 불가',
  pass: '통과',
  post: '사후 대기',
}

/** 항목별 진행 — 분모가 사람이냐 건이냐가 이 화면의 핵심이다 */
export function progress(people: Person[], s: Store) {
  const ups = people.flatMap((p) => p.uploads)
  const sel = people.filter((p) => p.selected)
  const cnt = (keys: readonly { k: string; l: string }[], rows: { id: string }[], bag: Record<string, Marks>) =>
    keys.map((it) => ({
      key: it.k,
      label: it.l,
      n: rows.filter((r) => (bag[r.id] ?? {})[it.k]).length,
      d: rows.length,
    }))
  return {
    people: sel.length,
    uploads: ups.length,
    pre: cnt(PRE, sel.map((p) => ({ id: p.key })), s.person),
    con: cnt(CON, ups, s.content),
    post: cnt(POST, sel.map((p) => ({ id: p.key })), s.person),
  }
}

export function load(campaignId: string, people: Person[]): Store {
  const base = seed(people)
  try {
    const raw = sessionStorage.getItem('rv:' + campaignId)
    if (!raw) return base
    const saved = JSON.parse(raw) as Store
    return {
      person: { ...base.person, ...saved.person },
      content: { ...base.content, ...saved.content },
      fix: { ...base.fix, ...saved.fix },
      blind: { ...base.blind, ...saved.blind },
    }
  } catch {
    return base
  }
}

export function save(campaignId: string, s: Store) {
  try { sessionStorage.setItem('rv:' + campaignId, JSON.stringify(s)) } catch { /* 무시 */ }
}
