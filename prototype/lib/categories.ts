import { getDb } from './db'
import { CATEGORIES, type Category } from './cat-types'

export { CATEGORIES, type Category } from './cat-types'

/* 활동 카테고리 판정.

   캠페인에 붙은 제품명에서 뽑는다 — "벌룬틴트 + 워터블러시" → 색조.
   그 사람이 참여한 캠페인들의 카테고리를 합쳐서 그 사람의 활동 영역으로 본다.
   여러 영역이면 중복으로 갖는다.

   판정이 안 되는 사람이 많다(약 67%). 진행시트가 캠페인에 안 붙어 있거나
   캠페인 이름에 제품이 안 적혀 있어서다. 그런 사람은 '기타'로 두고
   화면에서 직접 지정할 수 있게 한다. 억지로 채우면 필터가 거짓말을 한다. */

const KW: Record<Exclude<Category, '기타'>, string[]> = {
  색조: ['틴트', '블러쉬', '블러시', '블러', '쿠션', '립라이너', '립타투', '립', '섀도',
    '마스카라', '메이크업', '파운데이션', '컨실러', '하이라이터', '글로우', '치크', '팔레트', '아이라이너'],
  스킨케어: ['세럼', '크림', '앰플', '토너', '로션', '클렌징', '클랜징', '마스크팩', '선크림',
    '히알루론', '에센스', '미스트', '스킨케어', '필링', '패드', '수분', '보습', '트리트먼트', '샴푸', '헤어팩', '스킨'],
  패션: ['의류', '니트', '자켓', '가방', '신발', '주얼리', '액세서리', '반지', '목걸이', '패션', '슈즈'],
  라이프스타일: ['디퓨저', '향수', '캔들', '인테리어', '칫솔', '양치', '청소', '디바이스', '가전', '바디', '발을씻자', '오랄', '생활'],
  'F&B': ['음료', '커피', '유산균', '건강기능', '다이어트', '식품', '간식', '비타민', '젤리스틱', '프로틴'],
}

function pick(text: string): Category[] {
  const out: Category[] = []
  for (const k of CATEGORIES) {
    if (k === '기타') continue
    if (KW[k].some((w) => text.includes(w))) out.push(k)
  }
  return out
}

const norm = (x: string) =>
  x.replace(/^\[[^\]]*\]\s*/, '').replace(/지급완료/g, '').replace(/\s+/g, '').toLowerCase()

let cache: Map<string, Category[]> | null = null

/** 계정 → 활동 카테고리 */
export function categories(): Map<string, Category[]> {
  if (cache) return cache
  const db = getDb()

  // 캠페인마다 카테고리를 정한다
  const byCampaign = new Map<string, Category[]>()
  for (const c of db.campaigns) {
    byCampaign.set(c.id, pick(`${c.name} ${c.detail ?? ''}`))
  }

  // 캠페인명과 진행시트 탭 제목으로 찾을 수 있게 해둔다
  const lut = new Map<string, string>()
  for (const c of db.campaigns) if (!lut.has(norm(c.name))) lut.set(norm(c.name), c.id)
  for (const p of db.participations) {
    if (p.campaignId && p.trackerTitle && !lut.has(norm(p.trackerTitle))) {
      lut.set(norm(p.trackerTitle), p.campaignId)
    }
  }

  // 참여 기록이 있는 계정
  const out = new Map<string, Set<Category>>()
  const add = (k: string, cs: Category[]) => {
    if (cs.length === 0) return
    const s = out.get(k) ?? new Set<Category>()
    for (const c of cs) s.add(c)
    out.set(k, s)
  }
  for (const p of db.participations) {
    if (!p.handleUrl || !p.campaignId) continue
    add(p.handleUrl.split('/').pop()!.toLowerCase(), byCampaign.get(p.campaignId) ?? [])
  }

  // 명단만 있는 계정 — 자기 캠페인 이름으로 찾는다
  for (const cr of db.creators ?? []) {
    for (const nm of cr.campaigns) {
      const id = lut.get(norm(nm))
      add(cr.handle, id ? (byCampaign.get(id) ?? []) : pick(nm))
    }
  }

  cache = new Map([...out].map(([k, v]) => [k, [...v]]))
  return cache
}

export function categoriesOf(handle: string): Category[] {
  return categories().get(handle.toLowerCase()) ?? []
}
