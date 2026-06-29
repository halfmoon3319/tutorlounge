import { supabase } from '../lib/supabaseClient'
import Sidebar from './components/Sidebar'

export default async function Home() {
  const { data: groups, error } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  if (error) {
    return (
      <div className="layout">
        <main className="main">
          <p style={{ color: 'red' }}>데이터를 불러오지 못했습니다: {error.message}</p>
        </main>
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
          <button className="hero-btn">공지 보기</button>
        </div>

        <section className="section">
          <div className="section-head">
            <div className="section-title"><span>🕐</span>최신 게시글</div>
            <span className="section-more">더보기 ›</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            아직 게시글이 없습니다. 곧 첫 글이 올라올 거예요.
          </p>
        </section>
      </main>
    </div>
  )
}