/* 캠페인 커버 — 브랜드 제품 이미지.
   인플루언서 콘텐츠가 아니라 캠페인이 무엇을 주는지가 보여야 한다.
   지금은 참고한 가이드 페이지(moev-invite)의 히어로·제품 이미지를 쓰고 있고,
   실제로는 어드민에서 캠페인 만들 때 올린 이미지가 들어간다. */

const POOL = ['/img/prod-1.jpg', '/img/prod-2.jpg', '/img/prod-3.jpg', '/img/prod-4.jpg']

export function coverFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return POOL[h % POOL.length]
}

export default function Cover({
  seed, brand, badge, height = 172,
}: {
  seed: string
  brand: string
  badge?: string
  height?: number
}) {
  return (
    <div className="cover" style={{ height }}>
      <img src={coverFor(seed)} alt={`${brand} 제품`} loading="lazy" />
      <span className="veil" />
      {badge && <span className="tag2">{badge}</span>}
      <span className="brand2">{brand}</span>
    </div>
  )
}
