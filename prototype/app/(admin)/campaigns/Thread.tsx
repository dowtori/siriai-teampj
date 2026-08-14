'use client'

import { useEffect, useRef, useState } from 'react'

/* 캠페인 메모 — 슬랙에서 하던 대화를 캠페인에 붙여둔다.
   지금은 캠페인 하나를 두고 슬랙 채널과 시트 비고란에 나뉘어 적는다.
   여기서는 그 기록이 캠페인에 남고, 담당자를 부르고, 할 일로 바꿔 추적한다. */

export type Member = { id: string; name: string; short: string }

export const MEMBERS: Member[] = [
  { id: 'lead', name: '운영 총괄', short: '운' },
  { id: 'camp', name: '캠페인 담당', short: '캠' },
  { id: 'sales', name: '세일즈', short: '세' },
  { id: 'ext', name: '외부 협력', short: '외' },
]

const TAGS = ['확인 요청', '지연', '공유', '결정'] as const

type Note = {
  id: string
  who: string
  at: string
  body: string
  mentions: string[]
  tags: string[]
  /** 할 일로 표시된 메모 */
  todo: boolean
  done: boolean
}

/* 캠페인마다 다른 대화가 붙어 있어야 화면이 살아 보인다.
   id 에서 뽑은 값으로 고정해 새로고침해도 같은 내용이 나온다. */
function seed(id: string, name: string): Note[] {
  const h = [...id].reduce((a, c) => a + c.charCodeAt(0), 0)
  const packs: Note[][] = [
    [
      { id: 's1', who: 'camp', at: '어제 17:04', body: '@세일즈 이번 회차 제품 수량이 두 개 모자랍니다. 브랜드에 추가 요청 넣어주실 수 있을까요?', mentions: ['sales'], tags: ['확인 요청'], todo: true, done: false },
      { id: 's2', who: 'sales', at: '어제 17:22', body: '확인했습니다. 담당자분께 메일 보냈고 내일 오전에 답 준다고 하셨어요.', mentions: [], tags: [], todo: false, done: false },
    ],
    [
      { id: 's1', who: 'lead', at: '어제 11:31', body: `${name} 선정 인원 컨펌이 이틀째 안 오고 있습니다. @캠페인 담당 한 번 더 리마인드 부탁드려요.`, mentions: ['camp'], tags: ['지연'], todo: true, done: false },
      { id: 's2', who: 'camp', at: '어제 13:08', body: '오늘 오후에 다시 연락드렸습니다. 내일까지는 준다고 하셨어요.', mentions: [], tags: [], todo: false, done: true },
    ],
    [
      { id: 's1', who: 'camp', at: '오늘 09:12', body: '업로드 마감 전날입니다. 아직 안 올린 인원 리마인드 돌렸습니다.', mentions: [], tags: ['공유'], todo: false, done: false },
      { id: 's2', who: 'lead', at: '오늘 09:40', body: '@캠페인 담당 가드닝까지 확인되면 검수 넘겨주세요.', mentions: ['camp'], tags: ['확인 요청'], todo: true, done: false },
    ],
    [
      { id: 's1', who: 'sales', at: '3일 전', body: '이번 건은 계산서를 월말에 한 번에 끊기로 했습니다. 개별 발행 아닙니다.', mentions: [], tags: ['결정'], todo: false, done: false },
    ],
  ]
  return packs[h % packs.length]
}

const nameOf = (id: string) => MEMBERS.find((m) => m.id === id)?.name ?? id
const shortOf = (id: string) => MEMBERS.find((m) => m.id === id)?.short ?? '?'

/** 본문에서 @이름을 찾아 강조한다 */
function render(body: string) {
  const names = MEMBERS.map((m) => m.name).sort((a, b) => b.length - a.length)
  const re = new RegExp(`@(${names.join('|')})`, 'g')
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    if (m.index > last) out.push(body.slice(last, m.index))
    out.push(<b className="mention" key={m.index}>@{m[1]}</b>)
    last = m.index + m[0].length
  }
  if (last < body.length) out.push(body.slice(last))
  return out
}

export default function Thread({ campaignId, campaignName }: { campaignId: string; campaignName: string }) {
  const key = `thread:${campaignId}`
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [todo, setTodo] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)

  // 캠페인이 바뀌면 그 캠페인의 기록을 불러온다
  useEffect(() => {
    let saved: Note[] | null = null
    try {
      const raw = sessionStorage.getItem(key)
      if (raw) saved = JSON.parse(raw) as Note[]
    } catch { /* 저장소를 못 쓰면 씨앗만 쓴다 */ }
    setNotes(saved ?? seed(campaignId, campaignName))
    setText(''); setTags([]); setTodo(false)
  }, [key, campaignId, campaignName])

  const save = (next: Note[]) => {
    setNotes(next)
    try { sessionStorage.setItem(key, JSON.stringify(next)) } catch { /* 무시 */ }
  }

  const add = () => {
    const body = text.trim()
    if (!body) return
    const mentions = MEMBERS.filter((m) => body.includes('@' + m.name)).map((m) => m.id)
    save([...notes, {
      id: 'n' + notes.length + body.length,
      who: 'lead', at: '방금', body, mentions, tags, todo, done: false,
    }])
    setText(''); setTags([]); setTodo(false)
  }

  const toggleDone = (id: string) =>
    save(notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n)))

  const mention = (m: Member) => {
    setText((t) => (t ? t.replace(/\s*$/, ' ') : '') + '@' + m.name + ' ')
    box.current?.focus()
  }

  const open = notes.filter((n) => n.todo && !n.done).length

  return (
    <div className="sect">
      <h4>
        메모 · 업무 추적
        {open > 0 && <span className="thr-open">할 일 {open}</span>}
      </h4>

      <div className="thr">
        {notes.map((n) => (
          <div className={`msg ${n.todo ? 'is-todo' : ''} ${n.done ? 'is-done' : ''}`} key={n.id}>
            <span className="msg-av" aria-hidden>{shortOf(n.who)}</span>
            <div className="msg-b">
              <div className="msg-h">
                <b>{nameOf(n.who)}</b>
                <span className="t">{n.at}</span>
                {n.tags.map((t) => <span className="tagc" key={t}>{t}</span>)}
              </div>
              <p>{render(n.body)}</p>
              {n.todo && (
                <button
                  className={`todo ${n.done ? 'on' : ''}`}
                  onClick={() => toggleDone(n.id)}
                  aria-pressed={n.done}
                >
                  <i>✓</i>{n.done ? '처리함' : '할 일로 표시됨 — 누르면 처리'}
                </button>
              )}
            </div>
          </div>
        ))}
        {notes.length === 0 && <p className="thr-empty">아직 메모가 없습니다.</p>}
      </div>

      <div className="thr-form">
        <textarea
          ref={box}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) add() }}
          placeholder="메모를 남기세요. 담당자를 부르려면 아래에서 이름을 누르세요."
          rows={2}
        />
        <div className="thr-tools">
          <span className="thr-at">
            {MEMBERS.map((m) => (
              <button key={m.id} onClick={() => mention(m)} title={`${m.name} 부르기`}>@{m.name}</button>
            ))}
          </span>
          <span className="thr-tags">
            {TAGS.map((t) => (
              <button
                key={t}
                className={tags.includes(t) ? 'on' : ''}
                onClick={() => setTags((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]))}
              >
                {t}
              </button>
            ))}
          </span>
          <label className="thr-todo">
            <input type="checkbox" checked={todo} onChange={(e) => setTodo(e.target.checked)} />
            할 일로 표시
          </label>
          <button className="btn pri" onClick={add} disabled={!text.trim()}>남기기</button>
        </div>
      </div>
    </div>
  )
}
