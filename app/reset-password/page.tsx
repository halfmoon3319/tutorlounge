'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase-browser'

export default function ResetPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    setError('')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아니에요.')
      return
    }

    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/update`,
    })

    setLoading(false)

    if (resetError) {
      setError('메일 발송 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.')
      return
    }

    // 보안상 이메일 존재 여부와 관계없이 성공 화면 표시
    setSent(true)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-title">비밀번호 찾기</div>
          <div className="auth-sub">가입한 이메일로 재설정 링크를 보내드려요.</div>
        </div>

        {!sent ? (
          <div className="email-form">
            <input
              className="input-field"
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            />
            <button className="btn-primary" onClick={handleSend} disabled={loading}>
              {loading ? '보내는 중…' : '재설정 링크 보내기'}
            </button>
          </div>
        ) : (
          <div className="find-result">
            <p className="find-result-label">메일을 보냈어요 📮</p>
            <p className="find-result-hint">
              입력하신 이메일로 비밀번호 재설정 링크를 보냈어요.
              메일함(스팸함 포함)을 확인하시고 링크를 눌러 새 비밀번호를 설정해주세요.
              메일이 오지 않으면 가입한 이메일이 맞는지 다시 확인해주세요.
            </p>
            <Link href="/login" className="btn-link-primary">
              로그인하러 가기
            </Link>
          </div>
        )}

        {error && <div className="auth-msg error">{error}</div>}

        <div className="auth-links">
          <Link href="/login">로그인</Link>
          <span>·</span>
          <Link href="/find-email">아이디 찾기</Link>
        </div>
      </div>
    </div>
  )
}
