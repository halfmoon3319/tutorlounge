import { createClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import MypageTabs from '../components/MypageTabs'

type LikedPost = {
  id: number
  title: string
  created_at: string
  view_count: number
  like_count: number
  comment_count: number
  boards: { slug: string; name: string } | { slug: string; name: string }[] | null
}

export default async function MyPage() {
  const supabase = await createClient()

  // 로그인 확인 (안 했으면 로그인 페이지로)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 내 프로필
  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, field, created_at, bio, career_years, region, link_url')
    .eq('id', user.id)
    .single()

  // 내가 쓴 글
  const { data: myPosts } = await supabase
    .from('posts')
    .select('id, title, created_at, view_count, like_count, comment_count, boards(slug, name)')
    .eq('author_id', user.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // 내가 쓴 댓글
  const { data: myComments } = await supabase
    .from('comments')
    .select('id, body, created_at, posts(id, title, boards(slug, name))')
    .eq('author_id', user.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // 내가 공감한 글 (reactions는 target_type/target_id 다형성 구조라 외래키 조인이 안 돼서 2단계로 조회)
  const { data: myLikeRows } = await supabase
    .from('reactions')
    .select('target_id')
    .eq('user_id', user.id)
    .eq('target_type', 'post')
    .order('created_at', { ascending: false })

  const likedPostIds = (myLikeRows ?? []).map((r) => r.target_id)

  const { data: likedPostsRaw } = likedPostIds.length > 0
    ? await supabase
        .from('posts')
        .select('id, title, created_at, view_count, like_count, comment_count, boards(slug, name)')
        .in('id', likedPostIds)
    : { data: [] as LikedPost[] }

  // reactions 조회 순서(공감한 순서) 그대로 유지
  const myLikes = likedPostIds
    .map((id) => likedPostsRaw?.find((p) => p.id === id))
    .filter((p): p is LikedPost => !!p)

  // 가입일 포맷
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ko-KR')
    : ''

  return (
    <div className="layout-narrow">
      <div className="user-profile-card">
        <div className="user-profile-top">
          <div>
            <div className="user-profile-nickname">{profile?.nickname ?? '이름 없음'}</div>
            <div className="user-profile-sub">가입 {joinDate}</div>
          </div>
          <a href={`/users/${user.id}`} className="user-note-btn">내 공개 프로필 보기</a>
        </div>

        <div className="user-profile-bio">
          {profile?.bio ? profile.bio : <span className="profile-empty-text">아직 자기소개가 없어요.</span>}
        </div>

        <div className="user-profile-meta">
          <span className="user-meta-item">
            {profile?.field ? profile.field : '분야 미설정'}
          </span>
          <span className="user-meta-item">
            {profile?.career_years !== null && profile?.career_years !== undefined ? `경력 ${profile.career_years}년` : '경력 미설정'}
          </span>
          <span className="user-meta-item">
            📍 {profile?.region ? profile.region : '지역 미설정'}
          </span>
          {profile?.link_url && (
            <a href={profile.link_url} target="_blank" rel="noopener noreferrer" className="user-meta-link">
              🔗 링크
            </a>
          )}
        </div>
      </div>

      <MypageTabs
        myPosts={myPosts ?? []}
        myComments={myComments ?? []}
        myLikes={myLikes}
        userId={user.id}
        initialNickname={profile?.nickname ?? ''}
        initialField={profile?.field ?? ''}
        initialBio={profile?.bio ?? ''}
        initialCareerYears={profile?.career_years ?? null}
        initialRegion={profile?.region ?? ''}
        initialLinkUrl={profile?.link_url ?? ''}
      />
    </div>
  )
}