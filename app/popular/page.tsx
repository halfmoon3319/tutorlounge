import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import Sidebar from '../components/Sidebar'

export default async function PopularPage() {
  const { data: groups } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  // 7일 전 시각 계산
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // 최근 7일 이내 글 중 좋아요 순 20개
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, like_count, comment_count, created_at, boards(slug, name)')
    .eq('status', 'published')
    .gte('created_at', weekAgo.toISOString())
    .order('like_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="layout">
      <Sidebar groups={groups ?? []} />
      <main className="main">
        <div className="board-head">
          <div className="board-titlebox">
            <div className="board-title">🔥 인기 게시글</div>
            <div className="board-desc">최근 일주일간 가장 많은 공감을 받은 글이에요.</div>
          </div>
        </div>

        {posts && posts.length > 0 ? (
          <div className="home-list">
            {posts.map((post, index) => {
              const board = Array.isArray(post.boards) ? post.boards[0] : post.boards
              const d = new Date(post.created_at)
              const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
              return (
                <Link
                  href={`/boards/${board?.slug}/${post.id}`}
                  className="home-post"
                  key={post.id}
                >
                  <span className="popular-rank">{index + 1}</span>
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
        ) : (
          <p className="list-empty">최근 일주일간 올라온 게시글이 없습니다.</p>
        )}
      </main>
    </div>
  )
}
