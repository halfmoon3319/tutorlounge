'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'

type Note = {
  id: number
  body: string
  is_read: boolean
  created_at: string
  partnerId: string
  partnerName: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function MessagesView({
  received,
  sent,
}: {
  received: Note[]
  sent: Note[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [openNote, setOpenNote] = useState<Note | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)

  const notes = tab === 'received' ? received : sent
  const unreadCount = received.filter((n) => !n.is_read).length

  // 쪽지 열기 (받은 쪽지면 읽음 처리)
  async function openMessage(note: Note) {
    setOpenNote(note)
    setReplyBody('')

    if (tab === 'received' && !note.is_read) {
      await supabase.from('notes').update({ is_read: true }).eq('id', note.id)
      router.refresh()
    }
  }

  // 답장 보내기
  async function sendReply() {
    if (!replyBody.trim() || !openNote) return
    setSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('로그인이 필요합니다.')
      setSending(false)
      return
    }

    const { error } = await supabase.from('notes').insert({
      sender_id: user.id,
      receiver_id: openNote.partnerId,
      body: replyBody.trim(),
    })

    setSending(false)

    if (error) {
      alert('쪽지 전송에 실패했습니다: ' + error.message)
      return
    }

    setReplyBody('')
    setOpenNote(null)
    alert('쪽지를 보냈습니다.')
    router.refresh()
  }

  // 쪽지 삭제 (내 쪽에서만)
  async function deleteNote(note: Note) {
    const ok = window.confirm('이 쪽지를 삭제할까요?')
    if (!ok) return

    const field = tab === 'received' ? 'receiver_deleted' : 'sender_deleted'
    const { error } = await supabase.from('notes').update({ [field]: true }).eq('id', note.id)

    if (error) {
      alert('삭제에 실패했습니다: ' + error.message)
      return
    }

    setOpenNote(null)
    router.refresh()
  }

  return (
    <div className="messages-wrap">
      <div className="messages-head">
        <h1 className="messages-title">쪽지함</h1>
      </div>

      {/* 받은/보낸 탭 */}
      <div className="messages-tabs">
        <button
          className={tab === 'received' ? 'msg-tab active' : 'msg-tab'}
          onClick={() => { setTab('received'); setOpenNote(null) }}
        >
          받은 쪽지
          {unreadCount > 0 && <span className="msg-unread-badge">{unreadCount}</span>}
        </button>
        <button
          className={tab === 'sent' ? 'msg-tab active' : 'msg-tab'}
          onClick={() => { setTab('sent'); setOpenNote(null) }}
        >
          보낸 쪽지
        </button>
      </div>

      {/* 쪽지 목록 */}
      {notes.length > 0 ? (
        <div className="note-list">
          {notes.map((note) => (
            <button
              key={note.id}
              className={`note-item${tab === 'received' && !note.is_read ? ' unread' : ''}`}
              onClick={() => openMessage(note)}
            >
              <div className="note-item-top">
                <span className="note-partner">
                  {tab === 'received' ? '보낸 사람' : '받는 사람'} · {note.partnerName}
                </span>
                <span className="note-date">{formatDate(note.created_at)}</span>
              </div>
              <div className="note-preview">{note.body}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="messages-empty">
          {tab === 'received' ? '받은 쪽지가 없어요.' : '보낸 쪽지가 없어요.'}
        </div>
      )}

      {/* 쪽지 읽기 모달 */}
      {openNote && (
        <div className="note-modal-backdrop" onClick={() => setOpenNote(null)}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-head">
              <span className="note-modal-partner">{openNote.partnerName}</span>
              <span className="note-modal-date">{formatDate(openNote.created_at)}</span>
            </div>
            <div className="note-modal-body">{openNote.body}</div>

            {/* 받은 쪽지일 때만 답장 */}
            {tab === 'received' && (
              <div className="note-reply">
                <textarea
                  className="note-reply-input"
                  placeholder="답장을 입력하세요"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={3}
                />
                <button className="btn-primary" onClick={sendReply} disabled={sending}>
                  {sending ? '보내는 중…' : '답장 보내기'}
                </button>
              </div>
            )}

            <div className="note-modal-actions">
              <button className="note-delete-btn" onClick={() => deleteNote(openNote)}>삭제</button>
              <button className="note-close-btn" onClick={() => setOpenNote(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
