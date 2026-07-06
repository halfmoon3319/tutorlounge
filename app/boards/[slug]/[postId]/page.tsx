import { createClient } from '../../../../lib/supabase-server'
import Sidebar from '../../../components/Sidebar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Comments from '../../../components/Comments'
import LikeButton from '../../../components/LikeButton'
import PostActions from '../../../components/PostActions'
import sanitizeHtml from 'sanitize-html'
import SendNoteButton from '../../../components/SendNoteButton'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>
}) {
  const { slug, postId } = await params
  const supabase = await createClient()

  const { data: groups } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, body, view_count, like_count, comment_count, created_at, author_id, profiles(nickname)')
    .eq('id', postId)
    .eq('status', 'published')
    .single()

  if (!post) {
    notFound()
  }

  const { data: attachments } = await supabase
    .from('post_attachments')
    .select('id, file_url, file_name, file_size, is_image, download_count')
    .eq('post_id', post.id)
    .order('created_at')

  await supabase
    .from('posts')
    .update({ view_count: post.view_count + 1 })
    .eq('id', post.id)

  const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
  const nickname = author?.nickname ?? '알 수 없음'

  const date = new Date(post.created_at)
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`

  // 본문 HTML을 안전하게 정화 (악성 태그 제거, 서식·이미지 태그는 허용)
  const cleanBody = sanitizeHtml(post.body ?? '', {
    allowedTags: [
      'p', 'br', 'strong', 'em', 's', 'h2', 'h3',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'style', 'width', 'height', 'data-align'],
      p: ['style'],
      h2: ['style'],
      h3: ['style'],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^(left|center|right)$/],
        'width': [/^\d+(\.\d+)?px$/],
        'height': [/^\d+(\.\d+)?px$/],
      },
    },
    allowedSchemes: ['http', 'https'],
  })
  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="layout">
      <Sidebar groups={groups ?? []} />
      <main className="main">
        <div className="post-detail">
          <Link href={`/boards/${slug}`} className="back-link">‹ 목록으로</Link>

          <h1 className="post-title">{post.title}</h1>

          <div className="post-meta">
            <span className="author">
              <SendNoteButton targetId={post.author_id} targetName={nickname} />
            </span>
            <span>{dateStr}</span>
            <span>조회 {post.view_count}</span>
            <PostActions
              postId={post.id}
              slug={slug}
              authorId={post.author_id}
              body={post.body ?? ''}
              attachments={attachments ?? []}
            />
          </div>

          <div
            className="post-body tiptap-body"
            dangerouslySetInnerHTML={{ __html: cleanBody }}
          />

          {attachments && attachments.length > 0 && (
            <div className="attachment-box">
              <div className="attachment-head">첨부파일 {attachments.length}</div>
              <div className="attachment-list">
                {attachments.map((file) => {
                  const sizeText = formatFileSize(file.file_size)
                  const icon = file.is_image ? '🖼️' : '📄'
                  return (
                    <a key={file.id} href={file.file_url} target="_blank" rel="noopener noreferrer" className="attachment-item">
                      <span className="attachment-ico">{icon}</span>
                      <div className="attachment-info">
                        <span className="attachment-name">{file.file_name}</span>
                        <span className="attachment-size">{sizeText}</span>
                      </div>
                      <span className="attachment-download">↓</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          <LikeButton postId={post.id} initialCount={post.like_count} />

          <Comments postId={post.id} />
        </div>
      </main>
    </div>
  )
}