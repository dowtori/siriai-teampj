/* 가용성 표기 — 클라이언트에서도 쓴다.
   availability.ts 는 fs 로 데이터를 읽으므로 클라이언트에서 import 하면 번들이 깨진다.
   화면에 필요한 타입과 라벨만 여기 따로 둔다. */

export type Status = 'busy' | 'cooling' | 'open'

export const STATUS_LABEL: Record<Status, string> = {
  open: '지금 가능',
  busy: '진행 중',
  cooling: '쿨다운',
}
