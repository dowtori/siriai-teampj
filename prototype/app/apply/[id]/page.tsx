import { notFound } from 'next/navigation'
import { getDb, cnt, won, ymd } from '@/lib/db'
import { getPrefill } from '@/lib/public'
import Embed from '../../b/Embed'
import ApplyForm from './ApplyForm'

/* 인플루언서 지원 랜딩 — 기존 가이드 페이지(moev-invite 등)와 같은 구성.
   개요 · 혜택 · 가이드라인 · 레퍼런스 · 프로세스 · 주의사항 · 신청 폼. */

export default async function ApplyPage(props: PageProps<'/apply/[id]'>) {
  const { id } = await props.params
  const sp = await props.searchParams
  const back = typeof sp.from === 'string' ? `/c/${sp.from}` : null

  const db = getDb()
  const c = db.campaigns.find((x) => x.id === id)
  if (!c) notFound()

  const title = c.name.replace(/^\[[^\]]+\]\s*/, '')
  const brand = c.brandName ?? 'SIRIAI'
  const detail = c.detail?.replace(/\n/g, ' · ') ?? ''

  // 레퍼런스 — 같은 브랜드의 실제 게시물
  const refs = db.participations
    .filter((p) => p.contentUrl?.startsWith('http'))
    .filter((p) => {
      const pc = db.campaigns.find((x) => x.id === p.campaignId)
      return pc?.brandId === c.brandId
    })
    .slice(0, 3)

  const fallback = db.participations.filter((p) => p.contentUrl?.startsWith('http')).slice(0, 3)
  const shown = refs.length > 0 ? refs : fallback

  const fee = db.participations
    .filter((p) => p.campaignId === c.id && p.proposedFee)
    .map((p) => p.proposedFee!)
  const feeText = fee.length
    ? `${won(Math.min(...fee))} ~ ${won(Math.max(...fee))}`
    : '개별 협의'

  // 코드로 들어온 사람의 등록 정보 — 폼에 미리 채운다
  const me = typeof sp.from === 'string' ? getPrefill(sp.from) : null

  // 이 캠페인에서 고를 수 있는 제품 옵션
  const options = (c.detail ?? '')
    .split(/[\n,+·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 24)
    .slice(0, 5)

  return (
    <div className="pub">
      <header className="pub-top">
        <div className="pub-in">
          <span className="mk">SIRIAI</span>
          <span className="who">{brand} 캠페인 지원</span>
          <div className="right">
            <span className="code-chip">모집 중</span>
          </div>
        </div>
      </header>

      <div className="ap-cover">
        <img src="/img/hero.jpg" alt={`${brand} 캠페인`} />
        <span className="veil" />
        <div className="in">
          <div className="pub-in">
            <div className="bd2">{brand} <i /> SIRIAI</div>
            <h1>{title}</h1>
          </div>
        </div>
      </div>

      <section className="pub-in" style={{ paddingTop: 'clamp(26px,4vw,44px)' }}>
        {detail && <p className="sub" style={{ margin: 0, fontSize: 'clamp(15px,1.4vw,19px)', color: 'var(--ink-2)', lineHeight: 1.6 }}>{detail}</p>}
        <div className="ap-meta">
          <span className="chip line">{c.monthLabel ?? '상시 모집'}</span>
          {c.counts.offered && <span className="chip line">{cnt(c.counts.offered)}명 모집</span>}
          {c.dates.due && <span className="chip line">마감 {ymd(c.dates.due)}</span>}
        </div>
      </section>

      <section className="pub-in pub-sec">
        <div className="pub-sh"><h2>캠페인 개요</h2></div>
        <div className="ap-facts">
          <div>
            <span className="k">제공 제품</span>
            <span className="v">{detail || '캠페인 제품'}</span>
          </div>
          <div>
            <span className="k">원고료</span>
            <span className="v">{feeText}</span>
          </div>
          <div>
            <span className="k">모집 인원</span>
            <span className="v">{c.counts.offered ? `${cnt(c.counts.offered)}명` : '협의'}</span>
          </div>
          <div>
            <span className="k">업로드</span>
            <span className="v">인스타그램 릴스</span>
          </div>
        </div>
      </section>

      <section className="pub-in pub-sec">
        <div className="pub-sh"><h2>제공 제품</h2><p>선정되시면 아래 제품을 보내드립니다</p></div>
        <div className="goods">
          {(options.length > 0 ? options : ['캠페인 제품']).slice(0, 4).map((o, i) => (
            <div className="good" key={o + i}>
              <div className="im"><img src={`/img/prod-${(i % 4) + 1}.jpg`} alt={o} loading="lazy" /></div>
              <div className="nm2">{o}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="pub-in pub-sec">
        <div className="pub-sh"><h2>콘텐츠 가이드라인</h2></div>
        <div className="ap-list">
          {[
            ['제품이 화면에 명확히 보이도록 촬영해 주세요', '패키지와 사용 장면이 함께 들어가면 좋습니다.'],
            ['협찬 표기는 필수입니다', '본문 상단에 #광고 또는 유료 광고 표시를 넣어 주세요.'],
            ['지정 해시태그를 포함해 주세요', '선정 후 안내드리는 태그를 그대로 넣어 주세요.'],
            ['게시 후 30일간 유지해 주세요', '기간 내 삭제 시 원고료 지급이 어렵습니다.'],
          ].map(([t, d], i) => (
            <div className="ap-item" key={i}>
              <span className="no">{String(i + 1).padStart(2, '0')}</span>
              <span className="tx"><b>{t}</b>{d}</span>
            </div>
          ))}
        </div>
      </section>

      {shown.length > 0 && (
        <section className="pub-in pub-sec">
          <div className="pub-sh">
            <h2>레퍼런스 콘텐츠</h2>
            <p>이전 캠페인에 올라온 실제 게시물</p>
          </div>
          <div className="egrid">
            {shown.map((p, i) => (
              <Embed key={i} url={p.contentUrl!} handle={p.handleUrl} followers={p.followers} />
            ))}
          </div>
        </section>
      )}

      <section className="pub-in pub-sec">
        <div className="pub-sh"><h2>진행 프로세스</h2></div>
        <div className="ap-flow">
          {[
            ['STEP 1', '신청', '아래 폼을 작성해 주세요.'],
            ['STEP 2', '선정 안내', '검토 후 3일 이내 알림톡으로 안내드립니다.'],
            ['STEP 3', '제품 수령', '입력하신 주소로 발송됩니다.'],
            ['STEP 4', '콘텐츠 업로드', '가이드라인에 맞춰 게시해 주세요.'],
            ['STEP 5', '정산', '검수 완료 후 원고료를 지급합니다.'],
          ].map(([n, t, d]) => (
            <div className="ap-step" key={n}>
              <span className="n">{n}</span>
              <b>{t}</b>
              <span>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pub-in pub-sec">
        <div className="pub-sh"><h2>주의사항</h2></div>
        <div className="note">
          <div>
            <b>신청 전에 확인해 주세요</b>
            비공개 계정은 선정이 어렵습니다. 선정 후 무단 취소나 기한 내 미게시가 반복되면
            다음 캠페인 참여가 제한될 수 있습니다. 제품은 반품·교환이 불가합니다.
          </div>
        </div>
      </section>

      <section className="pub-in pub-sec" id="form">
        <div className="pub-sh">
          <h2>신청 폼</h2>
          <p>작성 완료 후 브랜드에서 검토하여, 선정된 분께 담당자가 개별 연락드립니다</p>
        </div>
        <ApplyForm campaign={title} brand={brand} backTo={back} me={me} options={options} />
      </section>

      <footer className="pub-foot">
        <div className="pub-in">
          <span>SIRIAI</span>
          <span>{brand} × SIRIAI</span>
        </div>
      </footer>
    </div>
  )
}
