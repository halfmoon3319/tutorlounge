'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function FindEmailPage() {
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<string[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleFind() {
    setError('')
    setResult(null)

    if (!realName.trim() || !phone.trim()) {
      setError('이름과 전화번호를 모두 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realName, phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '조회에 실패했어요.')
        setLoading(false)
        return
      }

      setResult(data.emails)
    } catch {
      setError('요청 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.')
    }

    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-title">아이디(이메일) 찾기</div>
          <div className="auth-sub">가입 시 입력한 이름과 전화번호로 찾아드려요.</div>
        </div>

        {!result ? (
          <div className="email-form">
            <input
              className="input-field"
              type="text"
              placeholder="이름"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFind() }}
            />
            <input
              className="input-field"
              type="tel"
              placeholder="전화번호 (예: 010-1234-5678)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFind() }}
            />
            <button className="btn-primary" onClick={handleFind} disabled={loading}>
              {loading ? '찾는 중…' : '이메일 찾기'}
            </button>
          </div>
        ) : (
          <div className="find-result">
            <p className="find-result-label">가입된 이메일을 찾았어요.</p>
            {result.map((email, i) => (
              <div className="find-result-email" key={i}>{email}</div>
            ))}
            <p className="find-result-hint">
              보안을 위해 이메일 일부만 표시돼요. 전체 이메일이 기억나지 않으면
              비밀번호 찾기로 재설정할 수 있어요.
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
          <Link href="/reset-password">비밀번호 찾기</Link>
        </div>
      </div>
    </div>
  )
}
