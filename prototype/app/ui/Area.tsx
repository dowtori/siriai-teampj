import Link from 'next/link'

/* 아직 화면이 없는 영역의 공통 틀.
   비어 있는 페이지 대신, 그 자리가 무슨 일을 할지와 지금 확인된 숫자를 같이 보여준다.
   협업이 끝나면 무엇이 들어설지 미리 보이게 하는 것이 이 프로토타입의 목적이다. */

export type Stat = { k: string; v: string; s?: string }
export type Role = { pk: string; h: string; p: string }

export default function Area({
  eyebrow, title, lede, stats, roles, source, next,
}: {
  eyebrow: string
  title: string
  lede: string
  stats?: Stat[]
  roles: Role[]
  source?: string
  next?: { href: string; label: string }
}) {
  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
        </div>
        <div className="right">
          <span className="chip line">준비 중</span>
          {next && <Link className="btn" href={next.href}>{next.label} →</Link>}
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="scores">
          {stats.map((s) => (
            <div className="score" key={s.k}>
              <span className="sk">{s.k}</span>
              <span className="sv">{s.v}</span>
              {s.s && <span className="sd">{s.s}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="zone">
        <div className="zh">
          <h2>이 영역이 할 일</h2>
          <p>협업이 끝나면 여기에 들어설 것</p>
        </div>
        <div className="plans">
          {roles.map((r) => (
            <div className="plan" key={r.pk}>
              <span className="pk">{r.pk}</span>
              <h3>{r.h}</h3>
              <p>{r.p}</p>
            </div>
          ))}
        </div>
      </div>

      {source && (
        <div className="note info">
          <div>
            <b>지금은 어디서 하고 있나</b>
            {source}
          </div>
        </div>
      )}
    </div>
  )
}
