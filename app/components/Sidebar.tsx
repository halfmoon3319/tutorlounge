'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navGuard } from './navigationGuard'

type Board = {
  id: number
  slug: string
  name: string
}

type Group = {
  id: number
  name: string
  boards: Board[]
}

export default function Sidebar({ groups }: { groups: Group[] }) {
  const pathname = usePathname()

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

  return (
    <aside className="sidebar">
      <Link href="/" className="nav-active" onNavigate={handleNavigate}>
        <span>🔥</span>
        <span>전체 인기글</span>
      </Link>

      {groups.map((group) => (
        <div className="nav-section" key={group.id}>
          <div className="nav-group">{group.name}</div>
          {group.boards.map((board) => {
            const isActive = pathname === `/boards/${board.slug}` ||
              pathname?.startsWith(`/boards/${board.slug}/`)
            return (
              <Link
                href={`/boards/${board.slug}`}
                className={isActive ? 'nav-item active' : 'nav-item'}
                key={board.id}
                onNavigate={handleNavigate}
              >
                <span className="left">{board.name}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </aside>
  )
}