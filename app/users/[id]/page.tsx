import { createClient } from '../../../lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '../../components/Sidebar'
import SendNoteButton from '../../components/SendNoteButton'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: groups } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  // 공개 정보만 조회 (실명·전화·주소·이메일 제외)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nickname, field, bio, career_years, region, link_url, created_at')
    .eq('id', id)
    .single()

  if (!profile) {
    notFound()
  }

  // 이 사람이 쓴 글
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, created_at, view_count, like_count, comment_count, boards(slug, name)')
    .eq('author_id', id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(30)

  // 현재 로그인 사용자 (본인 프로필인지 판단)
  const { data: { user } } = await supabase.auth.getUser()
  const isMe = user?.id === id

  return (
    <div className="layout">
      <Sidebar groups={groups ?? []} />
      <main className="main">
        {/* 프로필 헤더 */}
        <div className="user-profile-card">
          <div className="user-profile-top">
            <div>
              <div className="user-profile-nickname">{profile.nickname}</div>
              <div className="user-profile-sub">
                가입 {formatDate(profile.created_at)}
              </div>
            </div>
            {!isMe && (
              <SendNoteButton targetId={profile.id} targetName={profile.nickname} asButton />
            )}
          </div>

          <div className="user-profile-bio">
            {profile.bio ? profile.bio : <span className="profile-empty-text">아직 자기소개가 없어요.</span>}
          </div>

          <div className="user-profile-meta">
            <span className="user-meta-item">
              {profile.field ? profile.field : '분야 미설정'}
            </span>
            <span className="user-meta-item">
              {profile.career_years !== null ? `경력 ${profile.career_years}년` : '경력 미설정'}
            </span>
            <span className="user-meta-item">
              📍 {profile.region ? profile.region : '지역 미설정'}
            </span>
            {profile.link_url && (
              <a href={profile.link_url} target="_blank" rel="noopener noreferrer" className="user-meta-link">
                🔗 링크
              </a>
            )}
          </div>
        </div>

        {/* 작성글 */}
        <div className="user-posts-head">
          <span>작성글</span>
          <span className="user-posts-count">{posts?.length ?? 0}</span>
        </div>

        {posts && posts.length > 0 ? (
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
        ) : (
          <div className="messages-empty">작성한 글이 없어요.</div>
        )}
      </main>
    </div>
  )
}
