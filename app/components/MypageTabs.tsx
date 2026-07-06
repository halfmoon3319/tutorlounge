'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'

type Post = {
  id: number
  title: string
  created_at: string
  view_count: number
  like_count: number
  comment_count: number
  boards: { slug: string; name: string } | { slug: string; name: string }[] | null
}

type CommentPost = {
  id: number
  title: string
  boards: { slug: string; name: string } | { slug: string; name: string }[] | null
}

type Comment = {
  id: number
  body: string
  created_at: string
  posts: CommentPost | CommentPost[] | null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function MypageTabs({
  myPosts,
  myComments,
  myLikes,
  userId,
  initialNickname,
  initialField,
  initialBio,
  initialCareerYears,
  initialRegion,
  initialLinkUrl,
}: {
  myPosts: Post[]
  myComments: Comment[]
  myLikes: Post[]
  userId: string
  initialNickname: string
  initialField: string
  initialBio: string
  initialCareerYears: number | null
  initialRegion: string
  initialLinkUrl: string
}) {
  const [tab, setTab] = useState<'posts' | 'comments' | 'likes' | 'settings'>('posts')

  // 프로필 수정 폼 상태
  const router = useRouter()
  const [nickname, setNickname] = useState(initialNickname)
  const [field, setField] = useState(initialField)
  const [bio, setBio] = useState(initialBio)
  const [careerYears, setCareerYears] = useState(
    initialCareerYears !== null ? String(initialCareerYears) : ''
  )
  const [region, setRegion] = useState(initialRegion)
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // 프로필 수정 비밀번호 확인 관문
  const [unlocked, setUnlocked] = useState(false)
  const [gatePassword, setGatePassword] = useState('')
  const [gateError, setGateError] = useState('')
  const [gateChecking, setGateChecking] = useState(false)

  // 프로필 수정 탭 진입 (매번 잠금 초기화)
  function openSettings() {
    setTab('settings')
    setUnlocked(false)
    setGatePassword('')
    setGateError('')
    setMessage('')
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setGateError('')
    if (!gatePassword) {
      setGateError('비밀번호를 입력해주세요.')
      return
    }
    setGateChecking(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setGateError('사용자 정보를 확인할 수 없어요. 다시 로그인해주세요.')
      setGateChecking(false)
      return
    }

    // 이메일 + 입력한 비밀번호로 재인증 시도
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: gatePassword,
    })

    setGateChecking(false)

    if (error) {
      setGateError('비밀번호가 일치하지 않아요.')
      return
    }

    setUnlocked(true)
    setGatePassword('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!nickname.trim()) {
      setMessage('닉네임을 입력해주세요.')
      return
    }

    // 경력연차 숫자 검증 (비워두는 건 허용)
    let careerYearsValue: number | null = null
    if (careerYears.trim() !== '') {
      const parsed = Number(careerYears)
      if (Number.isNaN(parsed) || parsed < 0) {
        setMessage('경력연차는 0 이상의 숫자로 입력해주세요.')
        return
      }
      careerYearsValue = parsed
    }

    setSaving(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        nickname: nickname.trim(),
        field: field.trim(),
        bio: bio.trim(),
        career_years: careerYearsValue,
        region: region.trim(),
        link_url: linkUrl.trim(),
      })
      .eq('id', userId)

    setSaving(false)

    if (error) {
      setMessage('저장에 실패했어요. 다시 시도해주세요.')
    } else {
      setMessage('저장됐어요.')
      router.refresh()
    }
  }

  return (
    <div className="mypage-tabs-wrap">
      {/* 탭 버튼들 */}
      <div className="mypage-tabs">
        <button
          className={tab === 'posts' ? 'mytab active' : 'mytab'}
          onClick={() => setTab('posts')}
        >
          내가 쓴 글
        </button>
        <button
          className={tab === 'comments' ? 'mytab active' : 'mytab'}
          onClick={() => setTab('comments')}
        >
          내 댓글
        </button>
        <button
          className={tab === 'likes' ? 'mytab active' : 'mytab'}
          onClick={() => setTab('likes')}
        >
          공감한 글
        </button>
        <button
          className={tab === 'settings' ? 'mytab active' : 'mytab'}
          onClick={openSettings}
        >
          프로필 수정
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="mypage-content">
        {tab === 'posts' && (
          myPosts.length > 0 ? (
            <div className="mypost-list">
              {myPosts.map((p) => {
                const board = Array.isArray(p.boards) ? p.boards[0] : p.boards
                return (
                  <Link
                    href={`/boards/${board?.slug}/${p.id}`}
                    className="mypost-item"
                    key={p.id}
                  >
                    <div className="mypost-main">
                      <span className="mypost-board">{board?.name ?? ''}</span>
                      <span className="mypost-title">{p.title}</span>
                    </div>
                    <div className="mypost-meta">
                      <span>{formatDate(p.created_at)}</span>
                      <span>조회 {p.view_count}</span>
                      <span>♥ {p.like_count}</span>
                      <span>댓글 {p.comment_count}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mypage-empty">아직 작성한 글이 없어요.</div>
          )
        )}

        {tab === 'comments' && (
          myComments.length > 0 ? (
            <div className="mypost-list">
              {myComments.map((c) => {
                const post = Array.isArray(c.posts) ? c.posts[0] : c.posts
                const board = post ? (Array.isArray(post.boards) ? post.boards[0] : post.boards) : null
                return (
                  <Link
                    href={`/boards/${board?.slug}/${post?.id}`}
                    className="mypost-item"
                    key={c.id}
                  >
                    <div className="mypost-main">
                      <span className="mypost-board">{board?.name ?? ''}</span>
                      <span className="mypost-title">{post?.title ?? '(삭제된 글)'}</span>
                    </div>
                    <div className="mypost-preview">{c.body}</div>
                    <div className="mypost-meta">
                      <span>{formatDate(c.created_at)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mypage-empty">작성한 댓글이 없어요.</div>
          )
        )}

        {tab === 'likes' && (
          myLikes.length > 0 ? (
            <div className="mypost-list">
              {myLikes.map((p) => {
                const board = Array.isArray(p.boards) ? p.boards[0] : p.boards
                return (
                  <Link
                    href={`/boards/${board?.slug}/${p.id}`}
                    className="mypost-item"
                    key={p.id}
                  >
                    <div className="mypost-main">
                      <span className="mypost-board">{board?.name ?? ''}</span>
                      <span className="mypost-title">{p.title}</span>
                    </div>
                    <div className="mypost-meta">
                      <span>{formatDate(p.created_at)}</span>
                      <span>조회 {p.view_count}</span>
                      <span>♥ {p.like_count}</span>
                      <span>댓글 {p.comment_count}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mypage-empty">공감한 글이 없어요.</div>
          )
        )}

        {/* 프로필 수정 - 비밀번호 확인 관문 */}
        {tab === 'settings' && !unlocked && (
          <form className="profile-gate" onSubmit={handleUnlock}>
            <div className="gate-title">🔒 본인 확인</div>
            <div className="gate-desc">프로필 수정을 위해 비밀번호를 다시 입력해주세요.</div>
            <input
              type="password"
              className="input-field"
              placeholder="비밀번호"
              value={gatePassword}
              onChange={(e) => setGatePassword(e.target.value)}
            />
            {gateError && <div className="auth-msg error">{gateError}</div>}
            <button type="submit" className="profile-edit-submit" disabled={gateChecking}>
              {gateChecking ? '확인 중…' : '확인'}
            </button>
          </form>
        )}

        {/* 프로필 수정 - 폼 (관문 통과 후) */}
        {tab === 'settings' && unlocked && (
          <form className="profile-edit-form" onSubmit={handleSave}>
            <div className="form-field">
              <label htmlFor="nickname">닉네임</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="form-field">
              <label htmlFor="field">분야</label>
              <input
                id="field"
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="예: 초등 국어, IT 프리랜서 강사"
                maxLength={30}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bio">자기소개</label>
              <textarea
                id="bio"
                className="bio-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="간단한 자기소개를 적어주세요."
                maxLength={500}
                rows={4}
              />
            </div>
            <div className="form-field">
              <label htmlFor="careerYears">경력 연차</label>
              <input
                id="careerYears"
                type="number"
                min={0}
                value={careerYears}
                onChange={(e) => setCareerYears(e.target.value)}
                placeholder="예: 5"
              />
            </div>
            <div className="form-field">
              <label htmlFor="region">활동 지역</label>
              <input
                id="region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 서울 강남구"
                maxLength={30}
              />
            </div>
            <div className="form-field">
              <label htmlFor="linkUrl">외부 링크</label>
              <input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://blog.example.com"
              />
            </div>
            {message && <div className="profile-edit-message">{message}</div>}
            <button type="submit" className="profile-edit-submit" disabled={saving}>
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
