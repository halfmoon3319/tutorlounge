'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'
import { navGuard } from './navigationGuard'

export default function Header({ nickname }: { nickname: string | null }) {
  const router = useRouter()
  const supabase = createClient()

  // 글쓰기 중이면 확인창 (링크 이동 가드)
  function handleNavigate(e: { preventDefault: () => void }) {
    if (navGuard.isDirty) {
      const ok = window.confirm('작성 중인 글이 저장되지 않았습니다. 정말 나가시겠어요?')
      if (!ok) {
        e.preventDefault()
      } else {
        navGuard.isDirty = false
      }
    }
  }

  async function handleLogout() {
    // 글쓰기 중이면 로그아웃도 확인
    if (navGuard.isDirty) {
      const ok = window.confirm('작성 중인 글이 저장되지 않았습니다. 정말 나가시겠어요?')
      if (!ok) return
      navGuard.isDirty = false
    }
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo" onNavigate={handleNavigate}>
          <span className="logo-mark">
            <svg width="30" height="30" viewBox="0 0 46 46">
              <g fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
                <line x1="13" y1="15.5" x2="23" y2="15.5" />
                <line x1="18" y1="15.5" x2="18" y2="30.5" />
                <line x1="28" y1="15.5" x2="28" y2="30.5" />
                <line x1="28" y1="30.5" x2="35" y2="30.5" />
              </g>
            </svg>
          </span>
          <span className="logo-text">TutorLounge</span>
        </Link>

        <div className="search">
          <span>🔍</span>
          <span>강의 꿀팁, 단가 정보 검색…</span>
        </div>

        <div className="header-actions">
          {nickname ? (
            <>
              <span className="login">{nickname}님</span>
              <Link href="/mypage" className="btn-write" style={{ textDecoration: 'none' }} onNavigate={handleNavigate}>마이페이지</Link>
              <button className="login" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" className="login" onNavigate={handleNavigate}>로그인</Link>
              <Link href="/signup" className="btn-write" style={{ textDecoration: 'none' }} onNavigate={handleNavigate}>회원가입</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}