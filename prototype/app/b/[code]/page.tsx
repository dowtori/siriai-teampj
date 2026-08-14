import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBrandView } from '@/lib/public'
import { getDb, cnt, rate, ymd, won } from '@/lib/db'
import {
  STAGES, stageForDemo, pickLive, stageIndex, stageMeta, needsBrand, type StageKey,
} from '@/lib/stages'
import Embed from '../Embed'
import Act from '@/app/ui/Act'
import BrandNav, { type NavCampaign } from './BrandNav'
import Roster, { type SheetRow } from './Roster'

/* 브랜드 페이지
   ?s=단계  → 홈 안에서 그 단계만 걸러 본다 (페이지 이동 아님)
   ?c=캠페인 → 캠페인 하나를 자세히 본다 */

export default async function BrandPage(props: PageProps<'/b/[code]'>) {
  const { code } = await props.params
  const sp = await props.searchParams
  const pick = typeof sp.c === 'string' ? sp.c : null
  const filter = typeof sp.s === 'string' ? (sp.s as StageKey) : null

  const v = getBrandView(code)
  if (!v) notFound()

  const db = getDb()
  const { brand, campaigns } = v
  const liveSet = pickLive(campaigns, 4)
  const withStage = campaigns.map((c) => ({ c, st: stageForDemo(c, liveSet) }))

  const nav: NavCampaign[] = withStage.map(({ c, st }) => ({
    id: c.id,
    name: c.name.replace(/^\[[^\]]+\]\s*/, ''),
    month: c.monthLabel ?? '',
    stageKey: st,
    stageLabel: stageMeta(st).label,
  }))

  const one = pick ? campaigns.find((x) => x.id === pick) ?? null : null

  /* ─────────── 캠페인 하나 ─────────── */
  if (one) {
    const st = stageForDemo(one, liveSet)
    const si = stageIndex(st)
    const parts = db.participations.filter((p) => p.campaignId === one.id)
    const picked = parts.filter((p) => p.selected)
    const contents = picked.filter((p) => p.contentUrl?.startsWith('http')).slice(0, 9)
    const people = picked.filter((p) => p.handleUrl).sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))

    // 계정 주소가 있는 행만 브랜드에게 보여준다
    const sheet: SheetRow[] = parts.filter((p) => p.handleUrl).slice(0, 40).map((p, i) => ({
      no: i + 1,
      name: p.displayName,
      handle: p.handleUrl,
      followers: p.followers,
      region: p.region,
      language: p.language,
      estViews: p.estViews,
      er: p.er,
      likes: p.avgLikes,
      comments: p.avgComments,
      fee: p.proposedFee,
      picked: p.selected,
      note: p.campaignChoice,
      contentUrl: p.contentUrl,
    }))

    return (
      <div className="bshell">
        <BrandNav code={code} brand={brand.name} campaigns={nav} />
        <div className="bmain"><div className="pub">

          <section className="pub-in pub-hero">
            <p className="eb">{one.monthLabel ?? 'CAMPAIGN'} · {stageMeta(st).label}</p>
            <h1>{one.name.replace(/^\[[^\]]+\]\s*/, '')}</h1>
            {one.detail && <p>{one.detail.replace(/\n/g, ' · ')}</p>}
          </section>

          <section className="pub-in pub-sec no-line" style={{ paddingTop: 0 }}>
            <div className="pdots" style={{ marginBottom: 34 }}>
              {STAGES.map((s, i) => (
                <span key={s.key} className={`pd ${i < si ? 'done' : ''} ${i === si ? 'now' : ''} ${s.brandAction ? 'act' : ''}`}>
                  <i /><span>{s.label}</span>
                </span>
              ))}
            </div>

            {needsBrand(st) && (
              <div className="callout" style={{ marginBottom: 34 }}>
                <span className="big">{cnt(one.counts.selected)}</span>
                <span className="tx">
                  <b>컨펌을 기다리고 있습니다</b>
                  <span>제안드린 인원을 확인해 주시면 제품 발송이 시작됩니다.</span>
                </span>
                <span className="right">
                  <Roster key={one.id} id={one.id} rows={sheet} campaign={one.name.replace(/^\[[^\]]+\]\s*/, '')} total={picked.length} />
                </span>
              </div>
            )}

            <div className="pub-stats">
              <div>
                <span className="k">SELECTED</span>
                <span className="v">{cnt(one.counts.selected)}</span>
                <span className="s">제안 {cnt(one.counts.offered)}명 중</span>
              </div>
              <div>
                <span className="k">UPLOADED</span>
                <span className="v">{cnt(one.counts.uploaded)}</span>
                <span className="s">업로드율 {rate(one.rates.upload)}</span>
              </div>
              {/* 합산 예상 노출은 두지 않는다. 성과를 약속하는 숫자처럼 읽힌다. */}
              <div>
                <span className="k">BUDGET</span>
                <span className="v" style={{ fontSize: 22 }}>{won(one.finance.revenue)}</span>
                <span className="s">집행 금액</span>
              </div>
              <div>
                <span className="k">납품</span>
                <span className="v" style={{ fontSize: 20 }}>{ymd(one.dates.due)}</span>
                <span className="s">예정일</span>
              </div>
            </div>
          </section>

          {!needsBrand(st) && sheet.length > 0 && (
            <section className="pub-in pub-sec">
              <div className="pub-sh">
                <h2>선정 인원</h2>
                <p>{picked.length}명</p>
                <div className="right">
                  <Roster key={one.id} id={one.id} rows={sheet} campaign={one.name.replace(/^\[[^\]]+\]\s*/, '')} total={picked.length} />
                </div>
              </div>
              <div className="people">
                {people.slice(0, 16).map((p, i) => (
                  <div className="person" key={i}>
                    <span className="av" />
                    <span style={{ minWidth: 0 }}>
                      <span className="pn" style={{ fontFamily: 'var(--lt)', fontSize: 13 }}>
                        @{p.handleUrl!.replace('instagram.com/', '')}
                      </span>
                      <span className="pm" style={{ display: 'block', marginTop: 2 }}>{cnt(p.followers)} 팔로워</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {contents.length > 0 && (
            <section className="pub-in pub-sec">
              <div className="pub-sh"><h2>올라온 콘텐츠</h2><p>실제 게시물</p></div>
              <div className="egrid">
                {contents.map((p, i) => (
                  <Embed key={i} url={p.contentUrl!} handle={p.handleUrl} followers={p.followers}
                    meta={p.estViews ? `예상 ${cnt(p.estViews)} 조회` : undefined} />
                ))}
              </div>
            </section>
          )}

          <Closing brand={brand.name} code={code} n={campaigns.length} scope={one.id} />
        </div></div>
      </div>
    )
  }

  /* ─────────── 홈 ─────────── */
  const shown = filter ? withStage.filter(({ st }) => st === filter) : withStage
  const waiting = withStage.filter(({ st }) => needsBrand(st))
  const running = withStage.filter(({ st }) => st !== 'settled')
  const byStage = (k: StageKey) => withStage.filter(({ st }) => st === k)
  const liveParts = db.participations.filter(
    (p) => p.selected && running.some(({ c }) => c.id === p.campaignId),
  )

  return (
    <div className="bshell">
      <BrandNav code={code} brand={brand.name} campaigns={nav} />
      <div className="bmain"><div className="pub">

        <section className="pub-in pub-hero">
          <p className="eb">CAMPAIGN STATUS</p>
          <h1>진행중인 캠페인 <em>{running.length}건</em></h1>
          <p>
            {waiting.length > 0
              ? `이 중 ${waiting.length}건이 컨펌을 기다리고 있습니다.`
              : '확인해주실 건은 없습니다. 순조롭게 진행 중입니다.'}
          </p>
        </section>

        <section className="pub-in pub-sec no-line" style={{ paddingTop: 0 }}>
          {waiting.length > 0 ? (
            <div className="callout">
              <span className="big">{waiting.length}</span>
              <span className="tx">
                <b>컨펌을 기다리는 캠페인이 있습니다</b>
                <span>{waiting.map(({ c }) => c.name.replace(/^\[[^\]]+\]\s*/, '')).join(' · ')}</span>
              </span>
              <span className="right">
                <Link className="pbtn" href={`/b/${code}?c=${waiting[0].c.id}`}>확인하러 가기</Link>
              </span>
            </div>
          ) : (
            <div className="callout calm">
              <span className="big">✓</span>
              <span className="tx">
                <b>지금 확인해주실 건은 없습니다</b>
                <span>업로드가 끝나면 알려드리겠습니다.</span>
              </span>
            </div>
          )}
        </section>

        <section className="pub-in pub-sec">
          <div className="pub-sh">
            <h2>단계별 현황</h2>
            <p>눌러서 그 단계만 볼 수 있습니다</p>
            {filter && (
              <div className="right">
                <Link replace className="pbtn ghost" href={`/b/${code}`}>필터 해제</Link>
              </div>
            )}
          </div>
          <div className="pipe">
            {STAGES.map((s) => {
              const rows = byStage(s.key)
              const on = filter === s.key
              const cls = [
                rows.length === 0 ? 'zero' : '',
                s.brandAction && rows.length > 0 ? 'act' : '',
                on ? 'sel' : '',
              ].filter(Boolean).join(' ')
              return (
                <Link replace key={s.key} href={on ? `/b/${code}` : `/b/${code}?s=${s.key}`} className={cls}>
                  {rows.length > 0 && <span className="on-mark" />}
                  <span className="sn">STEP {stageIndex(s.key) + 1}</span>
                  <span className="sv">{rows.length}</span>
                  <span className="sl">{s.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="pub-in pub-sec">
          <div className="pub-sh">
            <h2>{filter ? `${stageMeta(filter).label} 캠페인` : '캠페인'}</h2>
            <p>
              {filter
                ? `${shown.length}건`
                : `진행중 ${running.length}건 · 참여 인플루언서 ${cnt(liveParts.length)}명`}
            </p>
          </div>

          {shown.length === 0 ? (
            <div className="note info"><div>이 단계에 있는 캠페인이 없습니다.</div></div>
          ) : (
            <div className="bcards">
              {(filter ? shown : running.length > 0 ? running : shown).slice(0, 8).map(({ c, st }) => {
                const si = stageIndex(st)
                const up = c.rates.upload ?? 0
                return (
                  <Link className="bcard" key={c.id} href={`/b/${code}?c=${c.id}${filter ? `&s=${filter}` : ''}`}>
                    <div>
                      <div className="bt">{c.name.replace(/^\[[^\]]+\]\s*/, '')}</div>
                      <div className="bs">
                        {c.monthLabel ?? ''}
                        {c.detail ? ` · ${c.detail.replace(/\n/g, ' ')}` : ''}
                        {c.dates.due ? ` · 납품 ${ymd(c.dates.due)}` : ''}
                      </div>
                    </div>
                    <div className="bm">
                      <div><span className="k">선정</span><span className="v">{cnt(c.counts.selected)}</span></div>
                      <div><span className="k">업로드</span><span className="v">{cnt(c.counts.uploaded)}</span></div>
                      <div><span className="k">진척</span><span className="v">{rate(c.rates.upload)}</span></div>
                    </div>
                    <div className="pdots" style={{ gridColumn: '1/-1', marginTop: 6 }}>
                      {STAGES.map((s, i) => (
                        <span key={s.key} className={`pd ${i < si ? 'done' : ''} ${i === si ? 'now' : ''} ${s.brandAction ? 'act' : ''}`}>
                          <i /><span>{s.short}</span>
                        </span>
                      ))}
                    </div>
                    <div className="track" style={{ gridColumn: '1/-1' }}>
                      <i style={{ width: `${Math.min(up * 100, 100)}%` }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <Closing brand={brand.name} code={code} n={campaigns.length} scope="home" />
      </div></div>
    </div>
  )
}

/* 문의는 캠페인마다 따로다.
   id 를 코드 단위로 두면 A 에 문의한 것이 B 에서도 '접수됨'으로 뜬다. */
function Closing({ brand, code, n, scope }: { brand: string; code: string; n: number; scope: string }) {
  return (
    <>
      <section className="pub-in pub-end">
        <h2>다음 캠페인도 준비되어 있습니다</h2>
        <p>이번 캠페인에서 반응이 좋았던 인플루언서를 기준으로 다음 명단을 제안드릴 수 있습니다.</p>
        <div className="pub-btns">
          <Act
            id={`b-ask-${code}-${scope}`} variant="pbtn" label="담당자에게 문의" doneLabel="문의 접수됨"
            eyebrow="CONTACT" title="담당자에게 문의"
            fields={[
              { name: 'kind', label: '문의 종류', type: 'select', value: '다음 캠페인 제안',
                options: ['다음 캠페인 제안', '명단 변경 요청', '진행중 캠페인 문의', '리포트 요청', '기타'] },
              { name: 'body', label: '내용', type: 'textarea', required: true, placeholder: '어떤 점이 궁금하신가요?' },
            ]}
            confirmLabel="보내기" doneTitle="문의를 보냈습니다"
            doneNote={`${brand} 담당자에게 전달했습니다. 영업일 기준 1일 이내에 회신드립니다.`}
          />
          <Act
            id={`b-report-${code}`} variant="pbtn ghost" label="리포트 내려받기" doneLabel="발송 완료"
            eyebrow="REPORT" title="리포트 받기"
            intro={<><b>캠페인 {n}건 전체 리포트</b>참여 인플루언서 · 콘텐츠 · 성과를 담은 문서를 메일로 보내드립니다.</>}
            fields={[
              { name: 'email', label: '받을 메일', placeholder: 'name@company.com', required: true },
              { name: 'fmt', label: '형식', type: 'select', options: ['PDF', 'Excel', '둘 다'], value: 'PDF' },
            ]}
            confirmLabel="메일로 받기" doneTitle="리포트를 보냈습니다"
            doneNote="입력하신 메일로 발송했습니다. 몇 분 안에 도착합니다."
          />
        </div>
      </section>

      <footer className="pub-foot">
        <div className="pub-in">
          <span>SIRIAI</span>
          <span>이 페이지는 {brand}님께만 공유됩니다</span>
        </div>
      </footer>
    </>
  )
}
