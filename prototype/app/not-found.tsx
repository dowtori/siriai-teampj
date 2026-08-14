import Link from 'next/link'
import './public.css'

/* 잘못된 코드나 옛 링크로 들어온 사람이 떨어지는 자리.
   여기서 클릭으로 빠져나갈 수 없으면 그대로 막힌다. */

export default function NotFound() {
  return (
    <div className="pub">
      <div className="gate">
        <div className="gate-box">
          <span className="mk">SIRIAI</span>
          <h1>주소를 다시 확인해 주세요</h1>
          <p>
            링크가 만료됐거나 코드가 바뀐 주소입니다.
            받으신 코드로 다시 들어와 주세요.
          </p>
          <div className="pub-btns" style={{ marginTop: 26 }}>
            <Link className="pbtn" href="/c">인플루언서 코드 입력</Link>
            <Link className="pbtn ghost" href="/b">브랜드 코드 입력</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
