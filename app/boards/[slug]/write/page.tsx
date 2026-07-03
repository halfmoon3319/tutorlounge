'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '../../../../lib/supabase-browser'
import Sidebar from '../../../components/Sidebar'
import Editor from '../../../components/Editor'

type Category = { id: number; name: string }

type BoardConfig = {
  id: number
  name: string
  uses_category: boolean
  allows_files: boolean
  show_copyright_notice: boolean
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

export default function WritePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()

  const [groups, setGroups] = useState<BoardGroup[]>([])
  const [board, setBoard] = useState<BoardConfig | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [agreedCopyright, setAgreedCopyright] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

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

      const { data: boardData } = await supabase
        .from('boards')
        .select('id, name, uses_category, allows_files, show_copyright_notice')
        .eq('slug', slug)
        .single()

      if (!boardData) {
        setError('게시판을 찾을 수 없습니다.')
        setChecking(false)
        return
      }

      setBoard(boardData)

      if (boardData.uses_category) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id, name')
          .eq('board_id', boardData.id)
          .order('sort_order')
        setCategories(categoryData ?? [])
      }

      setChecking(false)
    }
    init()
  }, [slug, router, supabase])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    setFile(selected ?? null)
  }

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
    if (board.show_copyright_notice && !agreedCopyright) {
      setError('저작권 관련 안내에 동의해주세요.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('로그인이 만료되었습니다. 다시 로그인해주세요.')
      setLoading(false)
      return
    }

    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert({
        board_id: board.id,
        author_id: user.id,
        category_id: categoryId,
        title: title.trim(),
        body: body,
      })
      .select('id')
      .single()

    if (insertError || !newPost) {
      setError('글 등록에 실패했습니다: ' + insertError?.message)
      setLoading(false)
      return
    }

   if (file) {
      // Storage 경로(key)는 한글·공백이 들어가면 오류가 나서, 확장자만 남기고 안전한 이름으로 저장
      const extMatch = file.name.match(/\.[^.]+$/)
      const ext = extMatch ? extMatch[0] : ''
      const safeFileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
      const filePath = `${user.id}/${newPost.id}/${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) {
        console.error('파일 업로드 실패:', uploadError)
        setError('파일 업로드에 실패했습니다: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

      await supabase.from('post_attachments').insert({
        post_id: newPost.id,
        file_url: publicUrlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        is_image: file.type.startsWith('image/'),
      })
    }

    setLoading(false)
    router.push(`/boards/${slug}/${newPost.id}`)
    router.refresh()
  }

  if (checking) {
    return (
      <div className="layout">
        <Sidebar groups={groups} />
        <main className="main">
          <p style={{ color: 'var(--muted)', fontSize: '13px', padding: '40px 0' }}>
            확인 중…
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
            {board?.name}에 글쓰기
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

          <Editor content={body} onChange={setBody} />

          {board?.allows_files && (
            <div className="file-attach">
              <label htmlFor="file" className="file-attach-label">
                📎 {file ? file.name : '파일 첨부하기'}
              </label>
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="file-attach-input"
              />
            </div>
          )}

          {board?.show_copyright_notice && (
            <label className="copyright-check">
              <input
                type="checkbox"
                checked={agreedCopyright}
                onChange={(e) => setAgreedCopyright(e.target.checked)}
              />
              본인이 제작했거나 배포 권한이 있는 자료이며, 저작권을 침해하지 않음을 확인합니다.
            </label>
          )}

          <button className="btn-primary write-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? '등록 중…' : '등록하기'}
          </button>
        </div>

        {error && <div className="auth-msg error">{error}</div>}
      </main>
    </div>
  )
}