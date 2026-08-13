import Link from 'next/link'
import { listBrands } from '@/lib/public'
import Gate from '@/app/ui/Gate'

/* 브랜드 코드 게이트 — 로그인이 아니라 코드 하나로 들어온다. */

export default function BrandGate() {
  const all = listBrands()
  const brands = all.slice(0, 6)
  return (
    <div className="gate">
      <div className="gate-box">
        <span className="mk">SIRIAI</span>
        <div>
          <h1>캠페인 현황을 확인합니다</h1>
          <p style={{ marginTop: 14 }}>
            전달받으신 코드를 입력해 주세요. 별도 가입이나 로그인은 없습니다.
          </p>
        </div>

        <Gate base="/b" codes={all.map((b) => b.code)} />

        <div className="gate-demo">
          <span>DEMO</span>
          {brands.map(({ brand, code }) => (
            <Link key={code} href={`/b/${code}`}>
              {brand.name}
              <small>{code}</small>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
