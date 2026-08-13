'use client'

import Act from '@/app/ui/Act'

/* 인플루언서 화면의 실행 버튼들 — 전부 끝까지 동작합니다. */

export function AddressAct({ campaign }: { campaign: string }) {
  return (
    <Act
      id="c-address"
      variant="mbtn"
      label="주소 입력하기"
      doneLabel="주소 입력 완료"
      eyebrow="DELIVERY"
      title="배송지 입력"
      intro={<><b>제품을 보내드릴 주소입니다</b>{campaign} 발송에 사용됩니다. 캠페인 종료 후 파기합니다.</>}
      fields={[
        { name: 'name', label: '수령인', placeholder: '실명', required: true },
        { name: 'phone', label: '연락처', placeholder: '010-0000-0000', type: 'tel', required: true },
        { name: 'addr', label: '주소', placeholder: '도로명 주소', required: true },
        { name: 'addr2', label: '상세 주소', placeholder: '동 · 호수' },
        { name: 'memo', label: '요청사항', placeholder: '부재 시 문 앞 등', type: 'textarea' },
      ]}
      confirmLabel="주소 저장"
      doneTitle="주소를 저장했습니다"
      doneNote="담당자가 확인 후 발송합니다. 송장번호가 등록되면 알림톡으로 알려드립니다."
    />
  )
}

export function AskAct() {
  return (
    <Act
      id="c-ask"
      variant="mbtn ghost"
      label="문의"
      doneLabel="문의 접수됨"
      eyebrow="SUPPORT"
      title="담당자에게 문의"
      fields={[
        { name: 'kind', label: '문의 종류', type: 'select', options: ['배송', '콘텐츠 가이드', '정산', '일정 변경', '기타'], value: '배송' },
        { name: 'body', label: '내용', placeholder: '어떤 점이 궁금하신가요?', type: 'textarea', required: true },
      ]}
      confirmLabel="보내기"
      doneTitle="문의를 보냈습니다"
      doneNote="영업일 기준 1일 이내에 담당자가 알림톡으로 답변드립니다."
    />
  )
}

export function SettleAct({ earned }: { earned: string }) {
  return (
    <Act
      id="c-settle"
      variant="btn pri"
      label="정산자료 제출"
      doneLabel="정산자료 제출 완료"
      eyebrow="SETTLEMENT"
      title="정산자료 제출"
      intro={<><b>지급까지 한 단계 남았습니다</b>아래 자료를 제출하면 검수 완료 후 순차 지급됩니다. 예정 금액 {earned}</>}
      fields={[
        { name: 'holder', label: '예금주', placeholder: '실명', required: true },
        { name: 'bank', label: '은행', type: 'select', options: ['국민', '신한', '우리', '하나', '농협', '카카오뱅크', '토스뱅크', '기업', '기타'], value: '국민' },
        { name: 'acct', label: '계좌번호', placeholder: '- 없이 입력', required: true },
      ]}
      confirmLabel="제출"
      doneTitle="정산자료를 제출했습니다"
      doneNote="검수가 끝나면 지급이 시작됩니다. 지급일에 알림톡으로 알려드립니다."
    >
      <div className="note" style={{ marginTop: 4 }}>
        <div>
          <b>통장 사본과 신분증은 별도 안내드립니다</b>
          원천징수 3.3% 처리를 위해 필요합니다. 제출하신 정보는 암호화해 보관하고 정산 후 파기합니다.
        </div>
      </div>
    </Act>
  )
}
