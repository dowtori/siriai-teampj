import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBrandView } from '@/lib/public'
import { won, cnt, rate, ymd, stage } from '@/lib/db'

/* 브랜드 페이지 — 고객사가 받아보는 화면.
   어드민처럼 다 보여주지 않는다. 자기 캠페인만, 크게, 정리해서. */

export default async function BrandPage(props: PageProps<'/b/[code]'>) {
  const { code } = await props.params
  const v = getBrandView(code)
  if (!v) notFound()

  const { brand, campaigns, running, totals, people, contents } = v
  const recent = campaigns.slice(0, 4)

  return (
    <div className="pub">
      <header className="pub-top">
        <div className="pub-in">
          <span className="mk">SIRIAI</span>
          <span className="who">{brand.name}</span>
          <div className="right">
            <span className="code-chip">{v.code}</span>
          </div>
        </div>
      </header>

      <section className="pub-in pub-hero">
        <p className="eb">CAMPAIGN REPORT · 2026</p>
        <h1>
          <em>{brand.name}</em>님과 함께한
          <br />
          캠페인 {totals.campaigns}건입니다.
        </h1>
        <p>
          진행 중인 캠페인과 지금까지 올라온 콘텐츠를 한자리에 모았습니다.
          궁금한 점은 담당자에게 바로 말씀해 주세요.
        </p>
      </section>

      <div className="pub-in">
        <div className="pub-stats">
          <div>
            <span className="k">CREATORS</span>
            <span className="v">{cnt(totals.selected)}</span>
            <span className="s">함께한 인플루언서</span>
          </div>
          <div>
            <span className="k">CONTENTS</span>
            <span className="v">{cnt(totals.uploaded)}</span>
            <span className="s">게시된 콘텐츠</span>
          </div>
          <div>
            <span className="k">EST. REACH</span>
            <span className="v">{totals.reach >= 10000 ? `${Math.round(totals.reach / 10000)}만` : cnt(totals.reach)}</span>
            <span className="s">예상 노출</span>
          </div>
          <div>
            <span className="k">RUNNING</span>
            <span className="v">{cnt(running.length)}</span>
            <span className="s">진행 중</span>
          </div>
        </div>
      </div>

      <section className="pub-in pub-sec">
        <div className="pub-sh">
          <h2>캠페인</h2>
          <p>최근 순</p>
        </div>
        <div className="bcards">
          {recent.map((c) => {
            const st = stage(c.status)
            const up = c.rates.upload ?? 0
            return (
              <article className="bcard" key={c.id}>
                <div>
                  <div className="bt">{c.name.replace(/^\[[^\]]+\]\s*/, '')}</div>
                  <div className="bs">
                    {c.monthLabel ?? ''} {c.detail ? `· ${c.detail.replace(/\n/g, ' ')}` : ''} · {st.label}
                  </div>
                </div>
                <div className="bm">
                  <div>
                    <span className="k">SELECTED</span>
                    <span className="v">{cnt(c.counts.selected)}</span>
                  </div>
                  <div>
                    <span className="k">UPLOADED</span>
                    <span className="v">{cnt(c.counts.uploaded)}</span>
                  </div>
                  <div>
                    <span className="k">진척</span>
                    <span className="v">{rate(c.rates.upload)}</span>
                  </div>
                </div>
                <div className="track">
                  <i style={{ width: `${Math.min(up * 100, 100)}%` }} />
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {contents.length > 0 && (
        <section className="pub-in pub-sec">
          <div className="pub-sh">
            <h2>올라온 콘텐츠</h2>
            <p>눌러서 원본을 봅니다</p>
          </div>
          <div className="cgrid">
            {contents.map((c, i) => (
              <a className="cthumb" key={i} href={c.url} target="_blank" rel="noreferrer">
                <span className="sq" />
                <span className="cn">{c.name}</span>
                <span className="cm">{c.views ? `${cnt(c.views)} 조회` : '게시 완료'}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section className="pub-in pub-sec">
          <div className="pub-sh">
            <h2>참여 인플루언서</h2>
            <p>팔로워 순 {people.length}명</p>
          </div>
          <div className="people">
            {people.map((p, i) => (
              <div className="person" key={i}>
                <span className="av" />
                <span>
                  <span className="pn">{p.name}</span>
                  <span className="pm" style={{ display: 'block', marginTop: 2 }}>
                    {cnt(p.followers)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="pub-in pub-end">
        <h2>다음 캠페인도 준비되어 있습니다</h2>
        <p>
          이번 캠페인에서 반응이 좋았던 인플루언서를 기준으로 다음 명단을 제안드릴 수 있습니다.
        </p>
        <div className="pub-btns">
          <button className="pbtn">담당자에게 문의</button>
          <button className="pbtn ghost">리포트 내려받기</button>
        </div>
      </section>

      <footer className="pub-foot">
        <div className="pub-in">
          <span>SIRIAI</span>
          <span>이 페이지는 {brand.name}님께만 공유됩니다</span>
        </div>
      </footer>
    </div>
  )
}
