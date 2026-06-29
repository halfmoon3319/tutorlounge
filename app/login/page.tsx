'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (loginError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-title">다시 오셨네요 👋</div>
          <div className="auth-sub">강사·교육 종사자의 라운지에 로그인하세요.</div>
        </div>

        <div className="email-form">
          <input
            className="input-field"
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input-field"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </div>

        {error && <div className="auth-msg error">{error}</div>}

        <div className="auth-links">
          <span>아직 계정이 없으신가요?</span>
          <Link href="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  )
}