import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCampaign, getParticipations,
  won, cnt, rate, ymd, stage,
  maskName, maskPhone, maskAddress,
} from '@/lib/db'
import Roster, { type Row } from './Roster'

export default async function CampaignDetail(props: PageProps<'/campaigns/[id]'>) {
  const { id } = await props.params
  const c = getCampaign(id)
  if (!c) notFound()

  const parts = getParticipations(c.id)
  const st = stage(c.status)
  const paid = c.finance.paymentStatus === '입금완료'

  const rows: Row[] = parts.map((p) => ({
    id: p.id,
    name: p.displayName,
    url: p.handleUrl,
    followers: p.followers,
    er: p.er,
    fee: p.proposedFee,
    selected: p.selected,
    posted: !!p.contentUrl,
    shipped: p.shipping,
    comment: p.managerComment,
    masked: {
      name: maskName(p.pii.realName),
      phone: maskPhone(p.pii.phone),
      address: maskAddress(p.pii.address),
    },
    real: {
      name: p.pii.realName ?? '—',
      phone: p.pii.phone ?? '—',
      address: p.pii.address ?? '—',
    },
  }))

  const docs = ([
    ['가이드', c.links.guide], ['진행시트', c.links.tracker], ['검수시트', c.links.review],
    ['모집', c.links.recruit], ['응답', c.links.response],
  ] as const).filter(([, v]) => v && v.startsWith('http'))

  return (
    <div className="wrap">
      <div className="ph">
        <div>
          <p className="eb">CAMPAIGN {c.code ?? ''}</p>
          <h1>{c.name}</h1>
          <p className="lede">
            {c.brandName ?? '거래처 미기재'} · {c.monthLabel ?? '귀속 미기재'} · {c.owner ?? '—'}
            {c.detail ? ` · ${c.detail.replace(/\n/g, ' ')}` : ''}
          </p>
        </div>
        <div className="right">
          <span className={`chip ${st.tone === 'done' ? '' : st.tone}`}>{st.label}</span>
          <Link className="btn" href="/campaigns">← 목록</Link>
        </div>
      </div>

      <div className="hero">
        <div className="hero-main">
          <div>
            <span className="k">REVENUE</span>
            <div className="v">{won(c.finance.revenue)}</div>
            <p className="cap">
              순이익 {won(c.finance.profit)} · 마진 {rate(c.finance.margin)} · 원고료 {won(c.finance.fee)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className={`chip ${paid ? 'live' : 'issue'}`}>{c.finance.paymentStatus ?? '입금 미기재'}</span>
            <span className="chip line">계산서 {ymd(c.finance.invoiceDate)}</span>
          </div>
        </div>
        <div className="hero-side">
          <div className="stat accent">
            <span className="sv">{cnt(c.counts.selected)}</span>
            <span className="sl"><b>선정</b>제공 {cnt(c.counts.offered)}명 중 · 컨펌율 {rate(c.rates.confirm)}</span>
          </div>
          <div className="stat">
            <span className="sv">{rate(c.rates.upload)}</span>
            <span className="sl"><b>업로드율</b>{cnt(c.counts.uploaded)}건 확인 · 잔여 {cnt(c.counts.remaining)}</span>
          </div>
          <div className="stat">
            <span className="sv">{cnt(parts.length)}</span>
            <span className="sl"><b>참여 기록</b>진행시트에서 옮겨온 행</span>
          </div>
        </div>
      </div>

      {parts.length > 0 ? (
        <div className="zone">
          <Roster rows={rows} />
        </div>
      ) : (
        <div className="zone">
          <div className="zh"><h2>참여 명단</h2></div>
          <div className="note info">
            <div>
              <b>진행시트가 아직 이 캠페인에 붙지 않았습니다</b>
              탭 제목과 캠페인명이 서로 다른 규칙이라 자동으로 이어붙이지 못했습니다.
              직접 연결하는 화면이 1주차 작업에 들어갑니다.
            </div>
          </div>
        </div>
      )}

      <div className="zone">
        <div className="zh">
          <h2>기록</h2>
          <p>일정과 연결된 문서</p>
        </div>
        <div className="panel">
          <div className="panel-bd">
            <dl className="kv">
              <dt>납품예정</dt><dd className="num">{ymd(c.dates.due)}</dd>
              <dt>기간</dt>
              <dd className="num">
                {ymd(c.dates.start)} — {c.dates.end ? ymd(c.dates.end) : (c.dates.endLabel ?? '—')}
              </dd>
              <dt>견적서</dt><dd className="num">{ymd(c.finance.quoteDate)}</dd>
              <dt>계산서</dt><dd className="num">{ymd(c.finance.invoiceDate)}</dd>
              <dt>문서</dt>
              <dd>
                {docs.length === 0 ? '—' : docs.map(([k, v]) => (
                  <a key={k} href={v as string} target="_blank" rel="noreferrer" style={{ marginRight: 16 }}>
                    {k} ↗
                  </a>
                ))}
              </dd>
              {c.note && (<><dt>비고</dt><dd>{c.note}</dd></>)}
              {c.remark && (<><dt>특이사항</dt><dd>{c.remark}</dd></>)}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
