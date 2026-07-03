'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'

export default function LikeButton({
  postId,
  initialCount,
}: {
  postId: number
  initialCount: number
}) {
  const router = useRouter()
  const supabase = createClient()

  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // 처음 열릴 때: 로그인 유저 확인 + 내가 이미 눌렀는지 확인
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      if (user) {
        const { data } = await supabase
          .from('reactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('target_type', 'post')
          .eq('target_id', postId)
          .maybeSingle()
        setLiked(!!data)
      }
    }
    init()
  }, [postId])

  async function handleToggle() {
    if (!userId) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }
    if (busy) return
    setBusy(true)

    if (liked) {
      // 좋아요 취소
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('user_id', userId)
        .eq('target_type', 'post')
        .eq('target_id', postId)

      if (!error) {
        setLiked(false)
        setCount((n) => n - 1)
      }
    } else {
      // 좋아요 추가
      const { error } = await supabase.from('reactions').insert({
        user_id: userId,
        target_type: 'post',
        target_id: postId,
      })

      if (!error) {
        setLiked(true)
        setCount((n) => n + 1)
      }
    }

    setBusy(false)
  }

  return (
    <div className="like-wrap">
      <button
        className={liked ? 'like-btn liked' : 'like-btn'}
        onClick={handleToggle}
        disabled={busy}
      >
        <span className="like-heart">{liked ? '♥' : '♡'}</span>
        <span className="like-count">{count}</span>
      </button>
    </div>
  )
}