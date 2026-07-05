'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase-browser'

type Attachment = {
  file_url: string
}

export default function PostActions({
  postId,
  slug,
  authorId,
  body,
  attachments,
}: {
  postId: number
  slug: string
  authorId: string
  body: string
  attachments: Attachment[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 로그인한 사용자가 글쓴이인지 확인
  if (!checked) {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
      setChecked(true)
    })
  }

  // 본인 글이 아니면 아무것도 안 보여줌
  if (!checked || currentUserId !== authorId) {
    return null
  }

  // Storage public URL에서 파일 경로(key)만 추출
  function extractStoragePath(url: string): string | null {
    const marker = '/storage/v1/object/public/attachments/'
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(url.slice(idx + marker.length))
  }

  async function handleDelete() {
    const ok = window.confirm('이 글을 삭제할까요? 삭제한 글은 되돌릴 수 없습니다.')
    if (!ok) return

    setDeleting(true)

    // 1) 지울 Storage 파일 경로 모으기 (본문 이미지 + 첨부파일)
    const pathsToRemove: string[] = []

    // 본문 이미지 URL 추출
    const imgMatches = body.match(/<img[^>]+src="([^"]+)"/g) || []
    for (const tag of imgMatches) {
      const srcMatch = tag.match(/src="([^"]+)"/)
      if (srcMatch) {
        const path = extractStoragePath(srcMatch[1])
        if (path) pathsToRemove.push(path)
      }
    }

    // 첨부파일 URL 추출
    for (const att of attachments) {
      const path = extractStoragePath(att.file_url)
      if (path) pathsToRemove.push(path)
    }

    // 2) Storage에서 파일 삭제
    if (pathsToRemove.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove(pathsToRemove)
      if (storageError) {
        console.error('이미지/파일 삭제 실패:', storageError)
        // Storage 삭제 실패해도 글은 계속 삭제 진행
      }
    }

    // 3) 글 삭제
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (deleteError) {
      alert('글 삭제에 실패했습니다: ' + deleteError.message)
      setDeleting(false)
      return
    }

    router.push(`/boards/${slug}`)
    router.refresh()
  }

  return (
    <div className="post-actions">
      <Link href={`/boards/${slug}/${postId}/edit`} className="post-action-btn">수정</Link>
      <button className="post-action-btn" onClick={handleDelete} disabled={deleting}>
        {deleting ? '삭제 중…' : '삭제'}
      </button>
    </div>
  )
}