import { getDb, cnt, won } from '@/lib/db'
import { availability } from '@/lib/availability'
import { collab } from '@/lib/collab'
import Act from '@/app/ui/Act'
import PageBuilder, { type Pool } from './PageBuilder'

/* 모집 · 선정 — 지원자를 훑고 골라 담는 화면.
   왼쪽에서 고르고, 오른쪽에서 무엇을 담았는지 보고, 아래에서 실행한다. */

export default function Recruit() {
  const db = getDb()

  const pool = db.participations
    .filter((p) => p.handleUrl && p.followers)
    .slice(0, 12)
    .map((p, i) => ({
      id: p.id,
      name: p.displayName,
      handle: p.handleUrl!.replace('instagram.com/', '@'),
      followers: p.followers,
      fee: p.proposedFee,
      on: i < 4,
    }))

  const picked = pool.filter((p) => p.on)
  const sum = picked.reduce((s, p) => s + (p.fee ?? 0), 0)

  /* 노출 대상 후보 — 협업 인플루언서 명단 전체가 모집단이다.
     협업 횟수는 진행시트를 되짚어 센 값이고, 팔로워 · 지역은 진행시트에서 나온 계정에만 있다. */
  const info = new Map<string, { followers: number | null; region: string | null }>()
  for (const p of db.participations) {
    if (!p.handleUrl) continue
    const k = p.handleUrl.replace(/^.*instagram\.com\//, '').replace(/^[/@]+|[/@ ]+$/g, '').toLowerCase()
    const cur = info.get(k) ?? { followers: null, region: null }
    if ((p.followers ?? 0) > (cur.followers ?? 0)) cur.followers = p.followers
    if (!cur.region && p.region) cur.region = p.region
    info.set(k, cur)
  }

  const av = availability()
  const col = collab()
  const pool2: Pool[] = (db.creators ?? []).map((c) => {
    const d = info.get(c.handle)
    const a = av.get(c.handle)
    return {
      key: c.id,
      name: c.name,
      handle: '@' + c.handle,
      platform: c.platformLabel,
      followers: d?.followers ?? null,
      listed: col.get(c.handle)?.listed ?? c.campaignCount,
      picked: col.get(c.handle)?.picked ?? 0,
      known: col.get(c.handle)?.known ?? false,
      region: d?.region ?? null,
      status: a?.status ?? 'open',
      why: a?.reason ?? '진행 중인 건이 없습니다',
      recentBrands: a?.recentBrands ?? [],
    }
  })

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">CAMPAIGNS</p>
          <h1>모집 · 선정</h1>
          <p className="lede">
            명단에서 조건으로 좁히고 골라 담습니다. 담은 인원과 예상 비용이 오른쪽에서 바로 보입니다.
          </p>
        </div>
        <div className="right">
          <span className="chip line">레이아웃 미리보기</span>
        </div>
      </div>

      <div className="zone">
        <div className="zh">
          <h2>지원 페이지</h2>
          <p>어드민에서 만들고, 조건에 맞는 인플루언서에게만 노출합니다</p>
        </div>
        <PageBuilder
          pool={pool2}
          campaign="오드타입 26년 9월 1주차"
          brands={db.brands.map((b) => b.name)}
        />
      </div>

      <div className="zone">
        <div className="flow">
          <span className="fs on">모집 열기 <span className="n">1</span></span>
          <span className="fs">지원 받기 <span className="n">2</span></span>
          <span className="fs">고르기 <span className="n">3</span></span>
          <span className="fs">선정 안내 <span className="n">4</span></span>
        </div>

        <div className="work">
          <div className="panel">
            <div className="bar">
              <input className="field" placeholder="이름 · 계정으로 찾기" readOnly />
              <div className="seg">
                <button className="on">전체</button>
                <button>협업 경험</button>
                <button>신규</button>
              </div>
            </div>
            <div className="bar" style={{ borderBottom: '1px solid var(--line-2)' }}>
              <span className="chip line">팔로워 1만 이상</span>
              <span className="chip line">뷰티</span>
              <span className="chip sel">업로드율 80%↑</span>
              <span className="chip line">+ 조건 추가</span>
              <div className="right">
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{pool.length}명</span>
              </div>
            </div>

            <div className="pad">
              <div className="pick-grid">
                {pool.map((p) => (
                  <div className={`pick ${p.on ? 'on' : ''}`} key={p.id}>
                    <span className="box">✓</span>
                    <span className="av" />
                    <div>
                      <div className="pn">{p.name}</div>
                      <div className="pm" style={{ marginTop: 4 }}>
                        <span>{cnt(p.followers)}</span>
                        <span>{won(p.fee)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="actionbar">
              <span className="sum">
                <b>{picked.length}</b>명 담음 · 예상 비용 <b>{won(sum)}</b>
              </span>
              <div className="right">
                <Act
                  id="rc-save" variant="btn" label="명단으로 저장" doneLabel="명단 저장됨"
                  eyebrow="POOL" title="명단으로 저장"
                  intro={<><b>고른 {picked.length}명을 명단으로 남깁니다</b>다음 캠페인에서 바로 불러올 수 있습니다.</>}
                  fields={[{ name: 'nm', label: '명단 이름', placeholder: '예: 무신사 뷰티 · 1만 이하', required: true }]}
                  confirmLabel="저장" doneTitle="명단으로 저장했습니다"
                  doneNote="인플루언서 명단 화면에서 불러올 수 있습니다."
                />
                <Act
                  id="rc-invite" variant="btn pri" label="선정 안내 보내기" doneLabel="선정 안내 발송됨"
                  eyebrow="NOTIFY" title="선정 안내 보내기"
                  intro={<><b>{picked.length}명에게 알림톡이 나갑니다</b>보내면 캠페인 단계가 &lsquo;선정&rsquo;으로 넘어가고, 각자 페이지에서 주소를 입력할 수 있게 됩니다.</>}
                  fields={[
                    { name: 'tpl', label: '문구', type: 'select', value: '선정 안내 (기본)',
                      options: ['선정 안내 (기본)', '선정 안내 + 일정 강조', '급건 안내'] },
                    { name: 'add', label: '덧붙일 말', type: 'textarea', placeholder: '캠페인별 안내사항' },
                  ]}
                  confirmLabel={`${picked.length}명에게 보내기`}
                  doneTitle="선정 안내를 보냈습니다"
                  doneNote="알림톡이 발송됐습니다. 주소를 입력한 인원부터 배송 단계로 넘어갑니다."
                />
              </div>
            </div>
          </div>

          <div className="side">
            <div className="panel">
              <div className="bar"><b style={{ fontSize: 14 }}>담은 인원</b>
                <div className="right"><span className="chip sel">{picked.length}</span></div>
              </div>
              <div className="rows">
                {picked.map((p) => (
                  <div className="row" key={p.id} style={{ cursor: 'default', padding: '13px 20px' }}>
                    <span className="av" style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--line-2)' }} />
                    <span className="lead">
                      <span className="t" style={{ fontSize: 14 }}>{p.name}</span>
                      <span className="s">{p.handle}</span>
                    </span>
                    <span className="tail">
                      <span className="met"><b>{won(p.fee)}</b><span>FEE</span></span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="pad-sm">
                <div className="gh-stack">
                  <span className="gh t" />
                  <span className="gh l w1" />
                  <span className="gh l w2" />
                  <span className="gh l w3" />
                </div>
                <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  고른 인원의 예상 도달과 카테고리 분포가 여기 들어갑니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
