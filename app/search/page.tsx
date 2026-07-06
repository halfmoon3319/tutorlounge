import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import Sidebar from '../components/Sidebar'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? '').trim()

  const { data: groups } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  // 제목 또는 본문에 검색어가 포함된 글 조회
  let posts: {
    id: number
    title: string
    like_count: number
    comment_count: number
    created_at: string
    boards: { slug: string; name: string } | { slug: string; name: string }[] | null
  }[] = []

  if (query) {
    const { data } = await supabase
      .from('posts')
      .select('id, title, like_count, comment_count, created_at, boards(slug, name)')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)
    posts = data ?? []
  }

  return (
    <div className="layout">
      <Sidebar groups={groups ?? []} />
      <main className="main">
        <div className="board-head">
          <div className="board-titlebox">
            <div className="board-title">🔍 검색 결과</div>
            <div className="board-desc">
              {query
                ? <>&lsquo;<b>{query}</b>&rsquo; 검색 결과 {posts.length}건</>
                : '검색어를 입력해주세요.'}
            </div>
          </div>
        </div>

        {query && posts.length > 0 ? (
          <div className="home-list">
            {posts.map((post) => {
              const board = Array.isArray(post.boards) ? post.boards[0] : post.boards
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
                    <span>{formatDate(post.created_at)}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        ) : query ? (
          <div className="messages-empty">&lsquo;{query}&rsquo;에 대한 검색 결과가 없어요.</div>
        ) : (
          <div className="messages-empty">위 검색창에 키워드를 입력해보세요.</div>
        )}
      </main>
    </div>
  )
}
