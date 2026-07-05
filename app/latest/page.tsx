import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import Sidebar from '../components/Sidebar'

const PAGE_SIZE = 20

export default async function LatestPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: groups } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  // 전체 글 수 (페이지 계산용) + 현재 페이지 글
  const { data: posts, count } = await supabase
    .from('posts')
    .select('id, title, like_count, comment_count, created_at, boards(slug, name)', { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1

  return (
    <div className="layout">
      <Sidebar groups={groups ?? []} />
      <main className="main">
        <div className="board-head">
          <div className="board-titlebox">
            <div className="board-title">🕐 최신 게시글</div>
            <div className="board-desc">모든 게시판의 새 글을 최신순으로 모아봤어요.</div>
          </div>
        </div>

        {posts && posts.length > 0 ? (
          <>
            <div className="home-list">
              {posts.map((post) => {
                const board = Array.isArray(post.boards) ? post.boards[0] : post.boards
                const d = new Date(post.created_at)
                const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
                return (
                  <Link
                    href={`/boards/${board?.slug}/${post.id}`}
                    className="home-post"
                    key={post.id}
                  >
                    <span className="home-post-board">{board?.name}</span>
                    <span className="home-post-title">
                      {post.title}
                      {post.comment_count > 0 && (
                        <span className="reply-cnt">[{post.comment_count}]</span>
                      )}
                    </span>
                    <span className="home-post-meta">
                      {post.like_count > 0 && <span className="home-like">♥ {post.like_count}</span>}
                      <span>{dateStr}</span>
                    </span>
                  </Link>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                {page > 1 && (
                  <Link href={`/latest?page=${page - 1}`} className="page-btn arrow">‹</Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/latest?page=${p}`}
                    className={p === page ? 'page-btn active' : 'page-btn'}
                  >
                    {p}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link href={`/latest?page=${page + 1}`} className="page-btn arrow">›</Link>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="list-empty">아직 게시글이 없습니다.</p>
        )}
      </main>
    </div>
  )
}
