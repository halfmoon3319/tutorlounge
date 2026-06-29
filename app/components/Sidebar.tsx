import Link from 'next/link'

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
  return (
    <aside className="sidebar">
      <div className="nav-active">
        <span>🔥</span>
        <span>전체 인기글</span>
      </div>

      {groups.map((group) => (
        <div className="nav-section" key={group.id}>
          <div className="nav-group">{group.name}</div>
          {group.boards.map((board) => (
            <Link
              href={`/boards/${board.slug}`}
              className="nav-item"
              key={board.id}
            >
              <span className="left">{board.name}</span>
            </Link>
          ))}
        </div>
      ))}
    </aside>
  )
}