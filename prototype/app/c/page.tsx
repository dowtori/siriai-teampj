import Link from 'next/link'
import { listCreators } from '@/lib/public'
import Gate from '@/app/ui/Gate'

/* 인플루언서 코드 게이트 — 폰으로 들어온다. */

export default function CreatorGate() {
  const all = listCreators(40)
  const people = all.slice(0, 5)
  return (
    <div className="gate">
      <div className="gate-box">
        <span className="mk">SIRIAI</span>
        <div>
          <h1>내 캠페인을 확인합니다</h1>
          <p style={{ marginTop: 14 }}>
            안내받으신 코드를 입력해 주세요. 가입할 필요 없습니다.
          </p>
        </div>

        <Gate base="/c" codes={all.map((p) => p.code)} />

        <div className="gate-demo">
          <span>DEMO</span>
          {people.map((p) => (
            <Link key={p.code} href={`/c/${p.code}`}>
              {p.name}
              <small>{p.code}</small>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
