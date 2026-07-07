'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase-browser'
import { navGuard } from './navigationGuard'

type Board = { id: number; slug: string; name: string }
type Group = { id: number; name: string; boards: Board[] }

export default function Header({ nickname }: { nickname: string | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    if (!nickname) return
    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .eq('receiver_deleted', false)
      setUnreadCount(count ?? 0)
    }
    fetchUnread()
  }, [nickname, supabase])

  // 햄버거 메뉴용 게시판 목록 조회
  useEffect(() => {
    async function fetchGroups() {
      const { data } = await supabase
        .from('board_groups')
        .select('id, name, sort_order, boards(id, slug, name, sort_order)')
        .order('sort_order')
        .order('sort_order', { referencedTable: 'boards' })
      setGroups((data as Group[]) ?? [])
    }
    fetchGroups()
  }, [supabase])

  function handleNavigate(e: { preventDefault: () => void }) {
    if (navGuard.isDirty) {
      const ok = window.confirm('작성 중인 글이 저장되지 않았습니다. 정말 나가시겠어요?')
      if (!ok) {
        e.preventDefault()
      } else {
        navGuard.isDirty = false
      }
    }
    setMenuOpen(false)
  }

  async function handleLogout() {
    if (navGuard.isDirty) {
      const ok = window.confirm('작성 중인 글이 저장되지 않았습니다. 정말 나가시겠어요?')
      if (!ok) return
      navGuard.isDirty = false
    }
    setMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function runSearch() {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMenuOpen(false)
    }
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
          <input
            className="search-input"
            type="text"
            placeholder="강의 꿀팁, 단가 정보 검색…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch() }}
          />
          <button className="search-btn" onClick={runSearch}>🔍</button>
        </div>

        {/* 데스크톱 메뉴 */}
        <div className="header-actions">
          {nickname ? (
            <>
              <span className="login">{nickname}님</span>
              <Link href="/messages" className="header-msg-link" onNavigate={handleNavigate}>
                ✉️ 쪽지
                {unreadCount > 0 && <span className="header-msg-badge">{unreadCount}</span>}
              </Link>
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

        {/* 모바일 햄버거 버튼 */}
        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="메뉴">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <div className="mobile-menu">
          {/* 계정 관련 */}
          {nickname ? (
            <>
              <div className="mobile-menu-user">{nickname}님</div>
              <Link href="/messages" className="mobile-menu-item" onNavigate={handleNavigate}>
                ✉️ 쪽지함
                {unreadCount > 0 && <span className="header-msg-badge">{unreadCount}</span>}
              </Link>
              <Link href="/mypage" className="mobile-menu-item" onNavigate={handleNavigate}>마이페이지</Link>
              <button className="mobile-menu-item logout" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" className="mobile-menu-item" onNavigate={handleNavigate}>로그인</Link>
              <Link href="/signup" className="mobile-menu-item" onNavigate={handleNavigate}>회원가입</Link>
            </>
          )}

          {/* 인기/최신 */}
          <div className="mobile-menu-section">바로가기</div>
          <Link href="/popular" className="mobile-menu-board" onNavigate={handleNavigate}>🔥 인기 게시글</Link>
          <Link href="/latest" className="mobile-menu-board" onNavigate={handleNavigate}>🕐 최신 게시글</Link>

          {/* 게시판 그룹 */}
          {groups.map((group) => (
            <div key={group.id}>
              <div className="mobile-menu-section">{group.name}</div>
              {group.boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.slug}`}
                  className="mobile-menu-board"
                  onNavigate={handleNavigate}
                >
                  {board.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
