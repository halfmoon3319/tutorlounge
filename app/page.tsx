import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import Sidebar from './components/Sidebar'

export default async function Home() {
  const { data: groups, error } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  // 최신 게시글 5개
  const { data: latestPosts } = await supabase
    .from('posts')
    .select('id, title, like_count, comment_count, created_at, boards(slug, name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5)

  // 인기글 5개 (좋아요 순)
  const { data: popularPosts } = await supabase
    .from('posts')
    .select('id, title, like_count, comment_count, created_at, boards(slug, name)')
    .eq('status', 'published')
    .order('like_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    return (
      <div className="layout">
        <main className="main">
          <p style={{ color: 'red' }}>데이터를 불러오지 못했습니다: {error.message}</p>
        </main>
      </div>
    )
  }

  // 글 목록 하나를 렌더링하는 함수
  function renderPostList(
    posts: {
      id: number
      title: string
      like_count: number
      comment_count: number
      created_at: string
      boards: { slug: string; name: string } | { slug: string; name: string }[]
    }[] | null
  ) {
    if (!posts || posts.length === 0) {
      return (
        <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
          아직 게시글이 없습니다.
        </p>
      )
    }
    return (
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
    )
  }

  return (
    <div className="layout">
      <Sidebar groups={groups ?? []} />
      <main className="main">
        <div className="hero">
          <div>
            <div className="hero-eyebrow">📢 공식 공지</div>
            <div className="hero-title">TutorLounge에 오신 것을 환영합니다 👋</div>
            <div className="hero-desc">강사·교육 종사자라면 누구나. 자료를 나누고 정보를 주고받아요.</div>
          </div>
          <Link href="/boards/notice" className="hero-btn">공지 보기</Link>
        </div>

        <section className="section">
          <div className="section-head">
            <div className="section-title"><span>🕐</span>최신 게시글</div>
            <Link href="/latest" className="section-more">더보기 ›</Link>
          </div>
          {renderPostList(latestPosts)}
        </section>

        <section className="section">
          <div className="section-head">
            <div className="section-title"><span>🔥</span>전체 인기글</div>
            <Link href="/popular" className="section-more">더보기 ›</Link>
          </div>
          {renderPostList(popularPosts)}
        </section>
      </main>
    </div>
  )
}