import fs from 'node:fs'
import path from 'node:path'

/* 운영 구글시트에서 이관한 실데이터.
   scripts/migrate.py 가 생성하며, 구조는 향후 PostgreSQL 스키마와 동일하다. */

export type Money = number | null

export interface Brand {
  id: string
  name: string
  campaignCount: number
}

export interface Campaign {
  id: string
  code: string | null
  name: string
  status: string
  month: string | null
  monthLabel: string | null
  detail: string | null
  owner: string | null
  country: string | null
  brandName: string | null
  brandId?: string
  links: {
    recruit: string | null
    response: string | null
    guide: string | null
    tracker: string | null
    review: string | null
  }
  dates: { due: string | null; start: string | null; end: string | null; endLabel: string | null }
  counts: { offered: number | null; selected: number | null; uploaded: number | null; remaining: number | null }
  rates: { confirm: number | null; upload: number | null }
  finance: {
    expected: Money
    revenue: Money
    fee: Money
    profit: Money
    margin: number | null
    quoteDate: string | null
    invoiceDate: string | null
    paymentStatus: string | null
  }
  note: string | null
  remark: string | null
}

export interface Participation {
  id: string
  campaignId: string | null
  trackerTitle: string
  no: string | null
  displayName: string
  handleUrl: string | null
  followers: number | null
  region: string | null
  language: string | null
  estViews: number | null
  er: number | null
  avgLikes: number | null
  avgComments: number | null
  proposedFee: Money
  selected: boolean
  campaignChoice: string | null
  remark: string | null
  managerComment: string | null
  pii: { realName: string | null; phone: string | null; address: string | null }
  shipping: string | null
  contentUrl: string | null
  threadMirror: string | null
  feedback: string | null
}

export interface DB {
  meta: {
    source: string
    note: string
    campaignCount: number
    participationCount: number
    trackerCount: number
    linkedTrackers: number
    unlinkedTrackers: { title: string; rows: number }[]
    dataIssueCount: number
    dataIssues: { field: string; value: string; why: string; tracker: string; who: string }[]
  }
  kpi: {
    revenue: number; profit: number; paid: number; outstanding: number
    margin: number; uploadRate: number; campaignsTotal: number; campaignsRunning: number
  }
  sheetDashboard: {
    revenue: Money; profit: Money; paid: Money; outstanding: Money
    margin: number | null; uploadRate: number | null; running: number | null
  }
  byMonth: { month: string; revenue: number; profit: number; count: number }[]
  brands: Brand[]
  campaigns: Campaign[]
  participations: Participation[]
}

let cache: DB | null = null

/* 로컬에 실데이터(db.local.json)가 있으면 그것을 쓰고,
   없으면 가명 처리된 db.json 을 쓴다. 배포에는 db.json 만 올라간다. */
export function getDb(): DB {
  if (!cache) {
    const dir = path.join(process.cwd(), 'data')
    const local = path.join(dir, 'db.local.json')
    const p = fs.existsSync(local) ? local : path.join(dir, 'db.json')
    cache = JSON.parse(fs.readFileSync(p, 'utf8')) as DB
  }
  return cache
}

export function getCampaign(id: string): Campaign | undefined {
  return getDb().campaigns.find((c) => c.id === id)
}

export function getParticipations(campaignId: string): Participation[] {
  return getDb().participations.filter((p) => p.campaignId === campaignId)
}

/* ── 표시 헬퍼 ── */

export const won = (n: Money): string => (n == null ? '—' : '₩' + n.toLocaleString('ko-KR'))
export const cnt = (n: number | null): string => (n == null ? '—' : n.toLocaleString('ko-KR'))
export const rate = (n: number | null): string => (n == null ? '—' : (n * 100).toFixed(1) + '%')

export function ymd(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${y.slice(2)}.${m}.${day}`
}

/** 진행 단계 — 시트의 상태값을 화면용으로 정리 */
export function stage(status: string): { label: string; tone: 'done' | 'live' | 'issue' } {
  if (status.includes('완전 종료')) return { label: '종료', tone: 'done' }
  if (status.includes('상시')) return { label: '상시 진행', tone: 'live' }
  if (status.includes('이슈')) return { label: '이슈', tone: 'issue' }
  return { label: status || '미지정', tone: 'live' }
}

/** 개인정보 가리기 — 역할에 따라 서버에서 결정할 자리 */
export function maskPhone(v: string | null): string {
  if (!v) return '—'
  const d = v.replace(/\D/g, '')
  if (d.length < 8) return '•'.repeat(Math.max(v.length, 4))
  return `${d.slice(0, 3)}-${'•'.repeat(4)}-${d.slice(-4)}`
}

export function maskAddress(v: string | null): string {
  if (!v) return '—'
  const head = v.trim().split(/\s+/).slice(0, 2).join(' ')
  return `${head} ${'•'.repeat(6)}`
}

export function maskName(v: string | null): string {
  if (!v) return '—'
  const s = v.trim()
  if (s.length <= 1) return s
  if (s.length === 2) return s[0] + '•'
  return s[0] + '•'.repeat(s.length - 2) + s[s.length - 1]
}
