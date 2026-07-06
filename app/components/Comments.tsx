'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'
import SendNoteButton from './SendNoteButton'

type Comment = {
  id: number
  body: string
  created_at: string
  author_id: string
  parent_id: number | null
  profiles: { nickname: string } | { nickname: string }[] | null
}

export default function Comments({ postId }: { postId: number }) {
  const router = useRouter()
  const supabase = createClient()

  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // 답글 작성 상태: 어느 댓글에 답글 다는 중인지 + 답글 입력 내용
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyBody, setReplyBody] = useState('')

  // 댓글 목록 불러오기
  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('id, body, created_at, author_id, parent_id, profiles(nickname)')
      .eq('post_id', postId)
      .eq('status', 'published')
      .order('created_at', { ascending: true })
    setComments(data ?? [])
  }

  // 처음 열릴 때: 로그인 유저 확인 + 댓글 로드
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      await loadComments()
    }
    init()
  }, [postId])

  // 댓글 등록
  async function handleSubmit() {
    if (!body.trim()) return

    if (!userId) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: userId,
      body: body.trim(),
    })

    setLoading(false)

    if (error) {
      alert('댓글 등록에 실패했습니다: ' + error.message)
      return
    }

    setBody('')
    await loadComments()
  }

  // 답글 등록
  async function handleReplySubmit(parentId: number) {
    if (!replyBody.trim()) return

    if (!userId) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: userId,
      parent_id: parentId,
      body: replyBody.trim(),
    })

    if (error) {
      alert('답글 등록에 실패했습니다: ' + error.message)
      return
    }

    setReplyBody('')
    setReplyTo(null)
    await loadComments()
  }

  // 댓글 삭제
  async function handleDelete(commentId: number) {
    if (!confirm('이 댓글을 삭제할까요?')) return

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      alert('댓글 삭제에 실패했습니다: ' + error.message)
      return
    }

    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  // 날짜 포맷 헬퍼
  function formatDate(iso: string) {
    const d = new Date(iso)
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  // 부모 댓글만 추려내기 (parent_id가 없는 것)
  const parentComments = comments.filter((c) => c.parent_id === null)
  // 특정 부모의 답글들 추려내기
  function repliesOf(parentId: number) {
    return comments.filter((c) => c.parent_id === parentId)
  }

  // 댓글 하나 렌더링 (부모/답글 공용)
  function renderComment(c: Comment, isReply: boolean) {
    const author = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    return (
      <div className={isReply ? 'comment-item comment-reply' : 'comment-item'} key={c.id}>
        <div className="comment-meta">
          {isReply && <span className="reply-arrow">↳</span>}
          <span className="comment-author">
            <SendNoteButton targetId={c.author_id} targetName={author?.nickname ?? '익명'} />
          </span>
          <span className="comment-date">{formatDate(c.created_at)}</span>
          {!isReply && userId && (
            <button className="comment-reply-btn" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
              답글
            </button>
          )}
          {userId === c.author_id && (
            <button className="comment-delete" onClick={() => handleDelete(c.id)}>
              삭제
            </button>
          )}
        </div>
        <div className="comment-body">{c.body}</div>

        {/* 답글 입력창 (이 댓글에 답글 다는 중일 때만) */}
        {replyTo === c.id && (
          <div className="reply-write">
            <textarea
              className="comment-input"
              placeholder="답글을 입력하세요"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={2}
            />
            <button className="comment-submit" onClick={() => handleReplySubmit(c.id)}>
              답글 등록
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="comments">
      <div className="comments-head">댓글 {comments.length}</div>

      {/* 댓글 목록 */}
      {parentComments.length > 0 ? (
        <div className="comment-list">
          {parentComments.map((c) => (
            <div key={c.id}>
              {renderComment(c, false)}
              {repliesOf(c.id).map((r) => renderComment(r, true))}
            </div>
          ))}
        </div>
      ) : (
        <div className="comment-empty">첫 댓글을 남겨보세요.</div>
      )}

      {/* 댓글 작성 */}
      <div className="comment-write">
        <textarea
          className="comment-input"
          placeholder={userId ? '댓글을 입력하세요' : '로그인 후 댓글을 작성할 수 있어요'}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <button className="comment-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? '등록 중…' : '댓글 등록'}
        </button>
      </div>
    </div>
  )
}