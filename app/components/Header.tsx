'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'

export default function Header({ nickname }: { nickname: string | null }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
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
              <button className="btn-write" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" className="login">로그인</Link>
              <button className="btn-write">글쓰기</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}