'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Prefill } from '@/lib/public'

/* 지원 폼.
   이미 등록된 인플루언서에게 코드를 주는 페이지이므로, 아는 정보는 미리 채워 둔다.
   확인하고 그대로 제출하거나 고치면 되고, 캠페인마다 새로 받아야 하는 것만 빈칸이다. */

type Extra = { option: string; platform: string; plan: string }

export default function ApplyForm({
  campaign, brand, backTo, me, options,
}: {
  campaign: string
  brand: string
  backTo: string | null
  me: Prefill | null
  options: string[]
}) {
  const [edit, setEdit] = useState(false)
  const [sent, setSent] = useState(false)
  const [agree, setAgree] = useState({ terms: false, privacy: false, reuse: false })
  const [extra, setExtra] = useState<Extra>({ option: options[0] ?? '', platform: '', plan: '' })
  const [p, setP] = useState({
    name: me?.name ?? '',
    realName: me?.realName ?? '',
    phone: me?.phone ?? '',
    handle: me?.handle ? `https://${me.handle}` : '',
    address: me?.address ?? '',
  })

  const on = (k: keyof typeof p) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setP((v) => ({ ...v, [k]: e.target.value }))

  const ready = agree.terms && agree.privacy && p.name.trim() && p.phone.trim() && p.address.trim()

  if (sent) {
    return (
      <div className="ap-form">
        <div className="ap-done">
          <span className="mk2">✓</span>
          <h3>신청이 접수되었습니다</h3>
          <p>
            브랜드에서 검토한 뒤, 선정되면 <b>영업일 기준 3일 이내</b>로 알림톡을 보내드립니다.
          </p>
          <div className="ap-recv">
            <div><span className="k">캠페인</span><span className="v">{campaign}</span></div>
            {extra.option && <div><span className="k">선택 옵션</span><span className="v">{extra.option}</span></div>}
            <div><span className="k">활동명</span><span className="v">{p.name}</span></div>
            <div><span className="k">연락처</span><span className="v">{p.phone}</span></div>
            <div><span className="k">접수번호</span><span className="v">AP-{campaign.length}{p.name.length}{options.length}0{brand.length}</span></div>
          </div>
          {backTo && (
            <Link className="pbtn" href={backTo} style={{ marginTop: 10 }}>
              내 캠페인으로 돌아가기
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ap-form">
      <div className="ap-body">
        {/* 1. 등록된 정보 — 확인만 하면 된다 */}
        <div className="me-card">
          <div className="me-h">
            <div>
              <span className="me-k">등록된 정보</span>
              <b>{p.name}</b>
              {me?.handle && <span className="me-at">@{me.handle.replace('instagram.com/', '')}</span>}
            </div>
            <button className="pbtn ghost" onClick={() => setEdit((v) => !v)}>
              {edit ? '수정 마치기' : '정보 변경'}
            </button>
          </div>

          {!edit ? (
            <dl className="me-dl">
              <div><dt>수령인</dt><dd>{p.realName || p.name}</dd></div>
              <div><dt>연락처</dt><dd className="num">{p.phone || '미등록 — 입력이 필요합니다'}</dd></div>
              <div><dt>주소</dt><dd>{p.address || '미등록 — 입력이 필요합니다'}</dd></div>
              {me?.followers != null && (
                <div><dt>팔로워</dt><dd className="num">{me.followers.toLocaleString('ko-KR')}</dd></div>
              )}
            </dl>
          ) : (
            <div className="ap-body" style={{ padding: 0, gap: 14 }}>
              <div className="ap-2">
                <div className="ap-fld">
                  <label>활동명</label>
                  <input value={p.name} onChange={on('name')} />
                </div>
                <div className="ap-fld">
                  <label>수령인 (실명)</label>
                  <input value={p.realName} onChange={on('realName')} placeholder="배송용" />
                </div>
              </div>
              <div className="ap-2">
                <div className="ap-fld">
                  <label>연락처 <em>*</em></label>
                  <input value={p.phone} onChange={on('phone')} type="tel" placeholder="010-0000-0000" />
                </div>
                <div className="ap-fld">
                  <label>인스타그램</label>
                  <input value={p.handle} onChange={on('handle')} />
                </div>
              </div>
              <div className="ap-fld">
                <label>주소 <em>*</em></label>
                <input value={p.address} onChange={on('address')} placeholder="제품을 받으실 주소" />
              </div>
            </div>
          )}
        </div>

        {/* 2. 이 캠페인에서만 받는 것 */}
        <div className="ap-only">
          <span className="ap-only-k">이 캠페인에서 선택할 것</span>

          {options.length > 0 && (
            <div className="ap-fld">
              <label>제품 옵션 <em>*</em></label>
              <div className="opts">
                {options.map((o) => (
                  <button
                    key={o}
                    className={`opt ${extra.option === o ? 'on' : ''}`}
                    onClick={() => setExtra((x) => ({ ...x, option: o }))}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ap-fld">
            <label>추가 업로드 플랫폼</label>
            <input
              value={extra.platform}
              onChange={(e) => setExtra((x) => ({ ...x, platform: e.target.value }))}
              placeholder="유튜브 · 틱톡 · 블로그 (선택, 비용 없음)"
            />
            <span className="hint">함께 올려주실 수 있으면 적어주세요. 필수는 아닙니다.</span>
          </div>

          <div className="ap-fld">
            <label>기획 방향</label>
            <textarea
              value={extra.plan}
              onChange={(e) => setExtra((x) => ({ ...x, plan: e.target.value }))}
              placeholder="어떤 콘셉트로 만들지 간단히 적어주세요"
            />
          </div>
        </div>

        {/* 3. 동의 */}
        {([
          ['terms', '캠페인 참여 조건에 동의합니다', '게시 일정과 가이드라인을 지키기로 합니다. 필수'],
          ['privacy', '개인정보 수집·이용에 동의합니다', '배송과 정산에만 씁니다. 캠페인 종료 후 파기합니다. 필수'],
          ['reuse', '콘텐츠 2차 활용에 동의합니다', '브랜드 채널과 광고 소재로 쓰일 수 있습니다. 선택'],
        ] as const).map(([k, t, d]) => (
          <div
            key={k}
            className={`ap-agree ${agree[k] ? 'on' : ''}`}
            onClick={() => setAgree((a) => ({ ...a, [k]: !a[k] }))}
          >
            <i>✓</i>
            <div>
              <div className="t">{t}</div>
              <div className="d">{d}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="ap-foot">
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
          {ready ? '확인되면 바로 제출됩니다' : '필수 항목과 동의를 확인해 주세요'}
        </span>
        <div className="right">
          <button className="pbtn" disabled={!ready} onClick={() => setSent(true)}>
            이대로 지원하기
          </button>
        </div>
      </div>
    </div>
  )
}
