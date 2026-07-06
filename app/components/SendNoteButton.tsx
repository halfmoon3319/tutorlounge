'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'

export default function SendNoteButton({
  targetId,
  targetName,
  asButton = false,
}: {
  targetId: string
  targetName: string
  asButton?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  // 닉네임/버튼 클릭 → 메뉴 열기 (asButton이면 바로 쪽지)
  async function handleTriggerClick() {
    if (asButton) {
      await openNotePopup()
    } else {
      setMenuOpen(true)
    }
  }

  // 쪽지 쓰기 팝업 열기 (본인 체크)
  async function openNotePopup() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    if (user.id === targetId) {
      alert('자신에게는 쪽지를 보낼 수 없어요.')
      return
    }
    setMenuOpen(false)
    setNoteOpen(true)
    setBody('')
  }

  function goProfile() {
    setMenuOpen(false)
    router.push(`/users/${targetId}`)
  }

  async function send() {
    if (!body.trim()) return
    setSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('로그인이 필요합니다.')
      setSending(false)
      return
    }

    const { error } = await supabase.from('notes').insert({
      sender_id: user.id,
      receiver_id: targetId,
      body: body.trim(),
    })

    setSending(false)

    if (error) {
      alert('쪽지 전송에 실패했습니다: ' + error.message)
      return
    }

    setBody('')
    setNoteOpen(false)
    alert('쪽지를 보냈습니다.')
  }

  return (
    <span className="nickname-wrap">
      {asButton ? (
        <button type="button" className="user-note-btn" onClick={handleTriggerClick}>
          ✉️ 쪽지 보내기
        </button>
      ) : (
        <button type="button" className="nickname-btn" onClick={handleTriggerClick}>
          {targetName}
        </button>
      )}

      {/* 닉네임 클릭 드롭다운 */}
      {menuOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setMenuOpen(false)} />
          <div className="nickname-dropdown" onClick={(e) => e.stopPropagation()}>
            <button className="nickname-menu-item" onClick={goProfile}>
              👤 프로필 보기
            </button>
            <button className="nickname-menu-item" onClick={openNotePopup}>
              ✉️ 쪽지 보내기
            </button>
          </div>
        </>
      )}

      {/* 쪽지 쓰기 팝업 */}
      {noteOpen && (
        <div className="note-modal-backdrop" onClick={() => setNoteOpen(false)}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-head">
              <span className="note-modal-partner">{targetName}님에게 쪽지</span>
            </div>
            <textarea
              className="note-reply-input"
              placeholder="쪽지 내용을 입력하세요"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className="note-modal-actions">
              <button className="note-close-btn" onClick={() => setNoteOpen(false)}>취소</button>
              <button className="btn-primary" onClick={send} disabled={sending}>
                {sending ? '보내는 중…' : '보내기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  )
}
