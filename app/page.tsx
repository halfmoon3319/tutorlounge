import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const isConnected = supabase ? '연결 성공' : '연결 실패'

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>TutorLounge</h1>
      <p>Supabase 상태: {isConnected}</p>
    </main>
  )
}
