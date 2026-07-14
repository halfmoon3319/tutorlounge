import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import Sidebar from './components/Sidebar'
import RoleBadge from './components/RoleBadge'

// 과목·자료 바로가기 카드 (자료 게시판)
const QUICK_LINKS = [
  { slug: 'material-elem', name: '초등', emoji: '🧒', className: 'ql-elem' },
  { slug: 'material-midhigh', name: '중·고등', emoji: '📚', className: 'ql-midhigh' },
  { slug: 'material-cert', name: '자격증', emoji: '📝', className: 'ql-cert' },
  { slug: 'material-free', name: '자유자료', emoji: '🗂️', className: 'ql-free' },
]

// 게시판별 미리보기 대상
const PREVIEW_BOARDS = [
  { slug: 'material-elem', name: '초등', emoji: '🧒' },
  { slug: 'material-midhigh', name: '중·고등', emoji: '📚' },
  { slug: 'talk-daily', name: '잡담·일상', emoji: '💬' },
  { slug: 'talk-worry', name: '고민·상담', emoji: '🤝' },
  { slug: 'talk-qna', name: '질문&답변', emoji: '❓' },
  { slug: 'career-job', name: '채용·구인', emoji: '📌' },
]

type HomePost = {
  id: number
  title: string
  like_count: number
  comment_count: number
  created_at: string
  boards: { slug: string; name: string } | { slug: string; name: string }[]
  profiles: { nickname: string; role?: string } | { nickname: string; role?: string }[] | null
}

export default async function Home() {
  const { data: groups, error } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  // 최신 게시글 5개
  const { data: latestPosts } = await supabase
    .from('posts')
    .select('id, title, like_count, comment_count, created_at, boards(slug, name), profiles(nickname, role)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5)
  // 인기글 5개 (좋아요 순)
  const { data: popularPosts } = await supabase
    .from('posts')
    .select('id, title, like_count, comment_count, created_at, boards(slug, name), profiles(nickname, role)')
    .eq('status', 'published')
    .order('like_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5)

  // 게시판별 미리보기: 각 게시판의 board id를 먼저 찾고, 최근 글 4개씩 조회
  const { data: previewBoardRows } = await supabase
    .from('boards')
    .select('id, slug, name')
    .in('slug', PREVIEW_BOARDS.map((b) => b.slug))

  const previewData: {
    slug: string
    name: string
    emoji: string
    posts: HomePost[]
  }[] = []

  for (const pb of PREVIEW_BOARDS) {
    const boardRow = previewBoardRows?.find((b) => b.slug === pb.slug)
    if (!boardRow) {
      previewData.push({ ...pb, posts: [] })
      continue
    }
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title, like_count, comment_count, created_at, boards(slug, name)')
      .eq('board_id', boardRow.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(4)
    previewData.push({ ...pb, posts: (posts as HomePost[]) ?? [] })
  }

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
  function renderPostList(posts: HomePost[] | null) {
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
          const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
          const role = (author as { role?: string })?.role
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
                <span className="hpt-text">{post.title}</span>
                {post.comment_count > 0 && (
                  <span className="reply-cnt">[{post.comment_count}]</span>
                )}
              </span>
              <span className="home-post-meta">
                <span className={`home-post-author ${role === 'admin' ? 'is-admin' : role === 'official' ? 'is-official' : ''}`}>
                  <RoleBadge role={role} />
                  {author?.nickname ?? '익명'}
                </span>
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

        {/* 과목·자료 바로가기 */}
        <div className="quick-links">
          {QUICK_LINKS.map((q) => (
            <Link href={`/boards/${q.slug}`} className={`quick-card ${q.className}`} key={q.slug}>
              <span className="quick-emoji">{q.emoji}</span>
              <span className="quick-name">{q.name}</span>
              <span className="quick-sub">자료 보기 ›</span>
            </Link>
          ))}
        </div>

        <div className="home-row">
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
        </div>

        {/* 게시판별 미리보기 */}
        <section className="section">
          <div className="section-head">
            <div className="section-title"><span>🗂️</span>게시판 둘러보기</div>
          </div>
          <div className="board-preview-grid">
            {previewData.map((bp) => (
              <div className="board-preview" key={bp.slug}>
                <div className="board-preview-head">
                  <Link href={`/boards/${bp.slug}`} className="board-preview-title">
                    <span>{bp.emoji}</span> {bp.name}
                  </Link>
                  <Link href={`/boards/${bp.slug}`} className="board-preview-more">＋</Link>
                </div>
                {bp.posts.length > 0 ? (
                  <div className="board-preview-list">
                    {bp.posts.map((post) => {
                      const d = new Date(post.created_at)
                      const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
                      return (
                        <Link
                          href={`/boards/${bp.slug}/${post.id}`}
                          className="board-preview-item"
                          key={post.id}
                        >
                          <span className="bp-title">
                            {post.title}
                            {post.comment_count > 0 && (
                              <span className="reply-cnt">[{post.comment_count}]</span>
                            )}
                          </span>
                          <span className="bp-date">{dateStr}</span>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="board-preview-empty">아직 글이 없어요.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
