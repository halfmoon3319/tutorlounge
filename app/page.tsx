import { supabase } from '../lib/supabaseClient'

export default async function Home() {
  const { data: boards, error } = await supabase
    .from('boards')
    .select('id, name, description')
    .order('sort_order')

  if (error) {
    return (
      <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        <h1>TutorLounge</h1>
        <p style={{ color: 'red' }}>데이터를 불러오지 못했습니다: {error.message}</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>TutorLounge</h1>
      <h2>게시판 목록</h2>
      <ul>
        {boards?.map((board) => (
          <li key={board.id}>
            <strong>{board.name}</strong> — {board.description}
          </li>
        ))}
      </ul>
    </main>
  )
}