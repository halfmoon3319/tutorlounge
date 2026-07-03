import Link from 'next/link'
import { createClient } from '../../../lib/supabase-server'
import Sidebar from '../../components/Sidebar'
import { notFound } from 'next/navigation'

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string }>
}) {
  const { slug } = await params
  const { category: categoryParam } = await searchParams
  const supabase = await createClient()

  const { data: groups } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  const { data: board } = await supabase
    .from('boards')
    .select('id, slug, name, description, layout_type, uses_category, allows_files')
    .eq('slug', slug)
    .single()

  if (!board) {
    notFound()
  }

  const { data: categories } = board.uses_category
    ? await supabase
        .from('categories')
        .select('id, name')
        .eq('board_id', board.id)
        .order('sort_order')
    : { data: [] as { id: number; name: string }[] }

  const selectedCategoryId = categoryParam ? Number(categoryParam) : null

  let postsQuery = supabase
    .from('posts')
    .select(
      'id, title, view_count, like_count, comment_count, download_count, created_at, category_id, profiles(nickname), categories(name), post_attachments(id)'
    )
    .eq('board_id', board.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (selectedCategoryId) {
    postsQuery = postsQuery.eq('category_id', selectedCategoryId)
  }

  const { data: posts } = await postsQuery

  const isResource = board.layout_type === 'resource'

  return (
    <div className="layout">
      <Sidebar groups={groups ?? []} />
      <main className="main">

        <div className="board-head">
          <div className="board-titlebox">
            <div className="board-title">{board.name}</div>
            {board.description && (
              <div className="board-desc">{board.description}</div>
            )}
          </div>
          <Link href={`/boards/${slug}/write`} className="board-write">＋ 글쓰기</Link>
        </div>

        {board.uses_category && categories && categories.length > 0 && (
          <div className="filterbar">
            <Link
              href={`/boards/${slug}`}
              className={!selectedCategoryId ? 'chip active' : 'chip'}
            >
              전체
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/boards/${slug}?category=${c.id}`}
                className={selectedCategoryId === c.id ? 'chip active' : 'chip'}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {posts && posts.length > 0 ? (
          <div className="list">
            <div className={board.uses_category ? 'list-header' : 'list-header no-cat'}>
              {board.uses_category && <span className="col-cat">분류</span>}
              <span className="col-title">제목</span>
              <span className="col-author">작성자</span>
              <span className="col-date">날짜</span>
              <span className="col-dl">{isResource ? '↓받음' : '조회'}</span>
              <span className="col-like">♥</span>
            </div>

            {posts.map((post) => {
              const d = new Date(post.created_at)
              const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
              const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
              const category = Array.isArray(post.categories) ? post.categories[0] : post.categories
              const hasAttachment = Array.isArray(post.post_attachments) && post.post_attachments.length > 0

              return (
                <div className={board.uses_category ? 'list-row' : 'list-row no-cat'} key={post.id}>
                  {board.uses_category && (
                    <div className="col-cat">
                      {category && <span className="cat-tag">{category.name}</span>}
                    </div>
                  )}
                  <div className="col-title">
                    <Link
                      href={`/boards/${slug}/${post.id}`}
                      className="row-title"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {hasAttachment && <span className="file-ico">📎</span>}
                      {post.title}
                      {post.comment_count > 0 && (
                        <span className="reply-cnt">[{post.comment_count}]</span>
                      )}
                    </Link>
                  </div>
                  <div className="col-author">{author?.nickname ?? '익명'}</div>
                  <div className="col-date">{dateStr}</div>
                  <div className="col-dl">
                    {isResource
                      ? (post.download_count > 0 ? <b>{post.download_count}</b> : '–')
                      : post.view_count}
                  </div>
                  <div className="col-like">{post.like_count > 0 ? <b>{post.like_count}</b> : '–'}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="list-empty">아직 게시글이 없습니다. 첫 글을 작성해보세요.</p>
        )}

      </main>
    </div>
  )
}