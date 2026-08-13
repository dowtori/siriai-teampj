import Nav from './Nav'

/* 어드민 셸 — 좌측 메뉴 + 본문.
   브랜드 · 인플루언서 화면은 이 셸을 쓰지 않는다. */

export default function AdminLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="shell">
      <Nav />
      <main className="main">{children}</main>
    </div>
  )
}
