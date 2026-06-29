'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase-browser'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setError('')

    if (!nickname || !email || !password) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
      },
    })

    setLoading(false)

    if (signupError) {
      setError(signupError.message)
      return
    }

    router.push('/')
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-title">함께해요, TutorLounge 👋</div>
          <div className="auth-sub">강사·교육 종사자라면 누구나 가입할 수 있어요.</div>
        </div>

        <div className="email-form">
          <div className="input-wrap">
            <input
              className="input-field"
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <span className="input-hint">커뮤니티에서 보일 이름이에요. 실명이 아니어도 괜찮아요.</span>
          </div>

          <input
            className="input-field"
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="input-wrap">
            <input
              className="input-field"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="input-hint">6자 이상</span>
          </div>

          <input
            className="input-field"
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />

          <button className="btn-primary" onClick={handleSignup} disabled={loading}>
            {loading ? '가입 중…' : '가입하기'}
          </button>
        </div>

        {error && <div className="auth-msg error">{error}</div>}

        <div className="auth-links">
          <span>이미 계정이 있으신가요?</span>
          <Link href="/login">로그인</Link>
        </div>
      </div>
    </div>
  )
}