import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SIRIAI — 프로토타입',
  description: '어드민 · 브랜드 · 인플루언서 세 화면의 레이아웃 미리보기',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
