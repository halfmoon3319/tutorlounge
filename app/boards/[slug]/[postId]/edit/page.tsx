'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '../../../../../lib/supabase-browser'
import Sidebar from '../../../../components/Sidebar'
import Editor from '../../../../components/Editor'
import { navGuard } from '../../../../components/navigationGuard'

type Category = { id: number; name: string }

type BoardConfig = {
  id: number
  name: string
  uses_category: boolean
}

type BoardGroup = {
  id: number
  name: string
  sort_order: number
  boards: { id: number; slug: string; name: string; sort_order: number }[]
}

// Tiptap이 빈 내용일 때 반환하는 값들 (실제 내용 없음으로 취급)
function isEmptyHtml(html: string) {
  const stripped = html
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, '')
    .trim()
  return stripped.length === 0
}

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const postId = params.postId as string
  const supabase = createClient()

  const [groups, setGroups] = useState<BoardGroup[]>([])
  const [board, setBoard] = useState<BoardConfig | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [initialBody, setInitialBody] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다.')
        router.push('/login')
        return
      }

      // 사이드바용 게시판 그룹
      const { data: groupData } = await supabase
        .from('board_groups')
        .select('id, name, sort_order, boards(id, slug, name, sort_order)')
        .order('sort_order')
        .order('sort_order', { referencedTable: 'boards' })
      setGroups(groupData ?? [])

      // 기존 글 불러오기
      const { data: post } = await supabase
        .from('posts')
        .select('id, title, body, category_id, author_id, board_id')
        .eq('id', postId)
        .single()

      if (!post) {
        setError('글을 찾을 수 없습니다.')
        setChecking(false)
        return
      }

      // 본인 글이 아니면 차단
      if (post.author_id !== user.id) {
        alert('본인이 작성한 글만 수정할 수 있습니다.')
        router.push(`/boards/${slug}/${postId}`)
        return
      }

      const { data: boardData } = await supabase
        .from('boards')
        .select('id, name, uses_category')
        .eq('id', post.board_id)
        .single()

      if (boardData) {
        setBoard(boardData)
        if (boardData.uses_category) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id, name')
            .eq('board_id', boardData.id)
            .order('sort_order')
          setCategories(categoryData ?? [])
        }
      }

      // 기존 값 채우기
      setTitle(post.title)
      setBody(post.body ?? '')
      setInitialBody(post.body ?? '')
      setCategoryId(post.category_id)

      setChecking(false)
      setReady(true)
    }
    init()
  }, [slug, postId, router, supabase])

  // 수정 중 내용이 바뀌었는지 판단
  const isDirty = ready && (title.trim().length > 0 || !isEmptyHtml(body))

  // 브라우저 이탈 경고
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !loading) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, loading])

  // 사이드바 등 내부 이동 가드
  useEffect(() => {
    navGuard.isDirty = isDirty && !loading
    return () => {
      navGuard.isDirty = false
    }
  }, [isDirty, loading])

  async function handleSubmit() {
    setError('')

    if (!title.trim() || isEmptyHtml(body)) {
      setError('제목과 내용을 모두 입력해주세요.')
      return
    }
    if (!board) return
    if (board.uses_category && !categoryId) {
      setError('카테고리를 선택해주세요.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title: title.trim(),
        body: body,
        category_id: categoryId,
      })
      .eq('id', postId)

    if (updateError) {
      setError('글 수정에 실패했습니다: ' + updateError.message)
      setLoading(false)
      return
    }

    navGuard.isDirty = false
    setLoading(false)
    router.push(`/boards/${slug}/${postId}`)
    router.refresh()
  }

  if (checking) {
    return (
      <div className="layout">
        <Sidebar groups={groups} />
        <main className="main">
          <p style={{ color: 'var(--muted)', fontSize: '13px', padding: '40px 0' }}>
            불러오는 중…
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="layout">
      <Sidebar groups={groups} />
      <main className="main">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {board?.name} 글 수정
          </div>
        </div>

        {board?.uses_category && (
          <div className="filterbar">
            {categories.map((c) => (
              <span
                key={c.id}
                className={categoryId === c.id ? 'chip active' : 'chip'}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </span>
            ))}
          </div>
        )}

        <div className="write-form">
          <input
            className="input-field"
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {ready && <Editor content={initialBody} onChange={setBody} />}

          <button className="btn-primary write-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? '수정 중…' : '수정 완료'}
          </button>
        </div>

        {error && <div className="auth-msg error">{error}</div>}
      </main>
    </div>
  )
}
