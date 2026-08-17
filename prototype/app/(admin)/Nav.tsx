'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNotices } from './Notices'

/* 매일 쓰는 영역(홈 · 대시보드 · 세일즈 · 캠페인)을 위에,
   진입 빈도가 다른 영역(정산 · 관리)을 구분선 아래에 둔다. */

type Item = { label: string; href: string; sub?: Item[] }
type Group = { label: string; href?: string; items?: Item[] }

const TOP: Group[] = [
  { label: '홈', href: '/' },
  { label: '대시보드', items: [{ label: '오늘 할 일', href: '/dashboard' }] },
  {
    label: '세일즈',
    items: [
      { label: '거래처', href: '/sales' },
      { label: '제안 · 견적', href: '/sales/proposals' },
      { label: '브랜드 페이지 발급', href: '/sales/pages' },
      { label: '랜딩 · 리드', href: '/sales/leads' },
    ],
  },
  {
    label: '캠페인',
    items: [
      { label: '캠페인 목록', href: '/campaigns' },
      { label: '모집 · 선정', href: '/campaigns/recruit' },
      { label: '배송 · 콘텐츠', href: '/campaigns/delivery' },
      { label: '검수', href: '/campaigns/review' },
      {
        label: '인플루언서 명단', href: '/campaigns/influencers',
        sub: [{ label: '핵심 인플루언서 설정', href: '/campaigns/influencers/core' }],
      },
    ],
  },
]

const BOTTOM: Group[] = [
  { label: '정산', href: '/settlement' },
  { label: '관리 · 설정', href: '/settings' },
]

const EXACT = ['/', '/sales']
/* /campaigns 아래 다른 메뉴가 있어 단순 startsWith 로는 겹친다.
   상세(/campaigns/{id})는 목록 항목이 켜져야 한다. */
const SIBLINGS = ['/campaigns/recruit', '/campaigns/delivery', '/campaigns/review', '/campaigns/influencers']
const EXACT_ONLY = ['/campaigns/influencers']

function isOn(path: string, href: string) {
  // 하위가 딸린 항목은 자기 경로일 때만 켠다
  if (EXACT_ONLY.includes(href)) return path === href
  if (href === '/campaigns') {
    return path === '/campaigns' || (path.startsWith('/campaigns/') && !SIBLINGS.some((s) => path.startsWith(s)))
  }
  return EXACT.includes(href) ? path === href : path.startsWith(href)
}

export default function Nav() {
  const path = usePathname()
  const nt = useNotices()

  /* 숫자는 "아직 확인하지 않은 새 항목" 이다.
     탭에 들어가는 것으로는 줄지 않는다. 항목을 확인해야 줄어든다. */
  const badge = (href: string) => {
    const n = nt?.countFor(href) ?? 0
    if (!n) return null
    return <span className="nb">{n > 99 ? '99+' : n}</span>
  }

  const row = (g: Group) => {
    if (!g.items) {
      return (
        <Link key={g.label} href={g.href!} className={`top ${isOn(path, g.href!) ? 'on' : ''}`}>
          <span className="d" />
          {g.label}
          {badge(g.href!)}
        </Link>
      )
    }
    const open = g.items.some((i) => isOn(path, i.href))
    // 접힌 그룹은 하위 표시를 모아서 머리에 붙인다
    const sum = g.items.reduce((n, i) => n + (nt?.countFor(i.href) ?? 0), 0)
    return (
      <div className="grp" key={g.label}>
        <p className={`gh ${open ? 'on' : ''}`}>
          {g.label}
          {sum > 0 && <span className="nb soft">{sum > 99 ? '99+' : sum}</span>}
        </p>
        <div className="sub">
          {g.items.map((i) => (
            <div key={i.label} className="sub-i">
              <Link href={i.href} className={isOn(path, i.href) ? 'on' : undefined}>
                {i.label}
                {badge(i.href)}
              </Link>
              {i.sub?.map((x) => (
                <Link key={x.href} href={x.href} className={`sub2 ${path === x.href ? 'on' : ''}`}>
                  {x.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <aside className="rail">
      <div className="mk">
        SIRIAI
        <small>어드민 프로토타입</small>
      </div>
      <nav className="navg">{TOP.map(row)}</nav>
      <div className="rail-foot">
        <div className="sep" />
        <nav className="navg">{BOTTOM.map(row)}</nav>

        <div className="sep" style={{ marginTop: 12 }} />
        <nav className="navg">
          <p className="gh-label">외부 화면</p>
          <Link href="/b" className="top" style={{ fontWeight: 500 }}>
            <span className="d" />
            브랜드 페이지
            {badge('/b')}
          </Link>
          <Link href="/c" className="top" style={{ fontWeight: 500 }}>
            <span className="d" />
            인플루언서 페이지
          </Link>
        </nav>

        <p className="legend">협업 결과물이 어떤 모습일지 미리 보는 화면입니다</p>
      </div>
    </aside>
  )
}
