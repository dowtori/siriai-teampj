/* 활동 카테고리 — 클라이언트에서도 쓴다.
   여러 영역에서 활동하는 인원은 중복으로 갖는다. */

export const CATEGORIES = ['색조', '스킨케어', '패션', '라이프스타일', 'F&B', '기타'] as const
export type Category = (typeof CATEGORIES)[number]
