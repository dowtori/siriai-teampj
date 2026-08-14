'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/* 브랜드 페이지 좌측.
   6단계를 그대로 쓰되, 브랜드가 무엇을 해야 하는지 기준으로 세 덩어리로 묶는다.

   확인 필요   컨펌 — 브랜드가 손대야 넘어가는 단계
   진행중      모집 · 업로드 중 · 업로드 완료 — 우리가 돌리는 중
   마감        계산서 발행 · 정산 완료 — 돈 이야기가 끝났거나 끝나가는 것

   '완료'가 캠페인 완료인지 정산 완료인지 헷갈리지 않게 두 단계를 따로 세운다. */

export type NavCampaign = {
  id: string
  name: string
  month: string
  stageKey: string
  stageLabel: string
}

type Group = {
  key: string
  title: string
  note: string
  stages: string[]
  tone?: 'act'
  openByDefault: boolean
}

const GROUPS: Group[] = [
  { key: 'todo', title: '확인 필요', note: '컨펌해주시면 다음으로 넘어갑니다',
    stages: ['confirm'], tone: 'act', openByDefault: true },
  { key: 'live', title: '진행중', note: '저희가 돌리고 있습니다',
    stages: ['recruit', 'posting', 'posted'], openByDefault: true },
  { key: 'close', title: '마감', note: '계산서와 정산',
    stages: ['invoice', 'settled'], openByDefault: false },
]

const STAGE_LABEL: Record<string, string> = {
  recruit: '모집',
  confirm: '컨펌 대기',
  posting: '업로드 중',
  posted: '업로드 완료',
  invoice: '계산서 발행',
  settled: '정산 완료',
}

export default function BrandNav({
  code, brand, campaigns,
}: {
  code: string
  brand: string
  campaigns: NavCampaign[]
}) {
  const sp = useSearchParams()
  const path = usePathname()
  const cur = sp.get('c')
  const curStage = sp.get('s')
  const [open, setOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.map((g) => [g.key, g.openByDefault])),
  )

  const inGroup = (g: Group) => campaigns.filter((c) => g.stages.includes(c.stageKey))
  const byStage = (s: string) => campaigns.filter((c) => c.stageKey === s)

  /* 아직 열어보지 않은 캠페인에 표시를 붙인다. 한 번 열면 사라진다. */
  const [seen, setSeen] = useState<Record<string, true>>({})
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('bseen:' + code)
      if (raw) setSeen(JSON.parse(raw) as Record<string, true>)
    } catch { /* 무시 */ }
  }, [code])
  useEffect(() => {
    if (!cur) return
    setSeen((s) => {
      if (s[cur]) return s
      const next = { ...s, [cur]: true as const }
      try { sessionStorage.setItem('bseen:' + code, JSON.stringify(next)) } catch { /* 무시 */ }
      return next
    })
  }, [cur, code])

  /* 마감된 캠페인은 새 표시를 붙이지 않는다.
     이미 끝난 35건에 표시가 붙으면 정작 봐야 할 것이 묻힌다. */
  const LIVE = ['recruit', 'confirm', 'posting', 'posted']
  const isNew = (c: NavCampaign) => !seen[c.id] && LIVE.includes(c.stageKey)
  const newIn = (rows: NavCampaign[]) => rows.filter(isNew).length

  return (
    <aside className="brail">
      <div className="bh">
        <span className="mk">SIRIAI</span>
        <span className="nm">{brand}</span>
        <span className="cd">{code}</span>
      </div>

      <nav className="bnav">
        <Link href={`/b/${code}`} className={!cur && !curStage ? 'on' : undefined}>
          <span className="d" />전체 현황
        </Link>
        {/* 대행사 담당자가 브랜드를 바꿔 볼 때 레일에서 바로 나간다 */}
        <Link href="/b" className="out">
          <span className="d" />다른 코드로 보기
        </Link>
      </nav>

      {GROUPS.map((g) => {
        const rows = inGroup(g)
        const isOpen = open[g.key]
        return (
          <div className="bgrp" key={g.key}>
            <button
              className={`gh gh-btn ${g.tone === 'act' && rows.length > 0 ? 'act' : ''}`}
              onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
            >
              <span className={`car ${isOpen ? 'open' : ''}`} />
              {g.title}
              {newIn(rows) > 0 && <span className="nnew">{newIn(rows)}</span>}
              <span className={`n ${g.tone === 'act' && rows.length > 0 ? 'badge' : ''}`}>{rows.length}</span>
            </button>

            {isOpen && (
              <div className="sub">
                {rows.length === 0 && <span className="empty">해당 캠페인이 없습니다</span>}

                {g.stages.map((s) => {
                  const list = byStage(s)
                  if (list.length === 0) return null
                  return (
                    <div className="stg" key={s}>
                      <Link
                        href={`/b/${code}?s=${s}`}
                        className={`stg-h ${curStage === s ? 'on' : ''}`}
                      >
                        {STAGE_LABEL[s]}
                        {newIn(list) > 0 && <span className="nnew sm">{newIn(list)}</span>}
                        <span className="sn2">{list.length}</span>
                      </Link>
                      {list.map((c) => (
                        <Link
                          key={c.id}
                          href={`/b/${code}?c=${c.id}`}
                          className={`stg-i ${cur === c.id ? 'on' : ''}`}
                        >
                          {isNew(c) && <span className="ndot" aria-label="아직 안 봄" />}
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div className="brail-foot">
        <p className="rnote">
          <b>단계 안내</b>
          모집 → 컨펌 → 업로드 중 → 업로드 완료 → 계산서 발행 → 정산 완료
        </p>
      </div>
    </aside>
  )
}
