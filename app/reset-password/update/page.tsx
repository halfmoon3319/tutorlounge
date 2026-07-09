'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase-browser'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [ready, setReady] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 이메일 링크로 들어오면 Supabase가 복구 세션을 만든다.
  // 세션이 준비됐는지 확인.
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setValidSession(true)
      }
      setReady(true)
    })

    // 이미 세션이 있는 경우도 확인
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setValidSession(true)
      }
      setReady(true)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleUpdate() {
    setError('')

    // 비밀번호 검증 (회원가입과 동일 규칙)
    const pwHasLetter = /[a-zA-Z]/.test(password)
    const pwHasNumber = /[0-9]/.test(password)
    const pwHasSymbol = /[^a-zA-Z0-9]/.test(password)
    if (!password) {
      setError('새 비밀번호를 입력해주세요.')
      return
    }
    if (password.length < 6 || !pwHasLetter || !pwHasNumber || !pwHasSymbol) {
      setError('비밀번호는 6자 이상, 영문·숫자·기호를 모두 포함해야 해요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않아요.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError('비밀번호 변경에 실패했어요. 링크가 만료되었을 수 있어요. 다시 시도해주세요.')
      return
    }

    setDone(true)
  }

  // 세션 확인 중
  if (!ready) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-head">
            <div className="auth-title">확인 중…</div>
          </div>
        </div>
      </div>
    )
  }

  // 유효한 복구 세션이 없음 (직접 접근하거나 링크 만료)
  if (!validSession && !done) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-head">
            <div className="auth-title">링크가 유효하지 않아요</div>
            <div className="auth-sub">
              재설정 링크가 만료되었거나 잘못된 접근이에요.
            </div>
          </div>
          <div className="find-result">
            <p className="find-result-hint">
              비밀번호 찾기를 다시 요청해 새 링크를 받아주세요.
            </p>
            <Link href="/reset-password" className="btn-link-primary">
              비밀번호 찾기로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-title">새 비밀번호 설정</div>
          <div className="auth-sub">사용할 새 비밀번호를 입력해주세요.</div>
        </div>

        {!done ? (
          <div className="email-form">
            <input
              className="input-field"
              type="password"
              placeholder="새 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="input-field"
              type="password"
              placeholder="새 비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate() }}
            />
            <span className="input-hint">6자 이상, 영문·숫자·기호 조합</span>
            <button className="btn-primary" onClick={handleUpdate} disabled={loading}>
              {loading ? '변경 중…' : '비밀번호 변경'}
            </button>
          </div>
        ) : (
          <div className="find-result">
            <p className="find-result-label">비밀번호가 변경됐어요 ✅</p>
            <p className="find-result-hint">
              새 비밀번호로 로그인해주세요.
            </p>
            <button
              className="btn-link-primary"
              onClick={() => { router.push('/login'); router.refresh() }}
              style={{ border: 'none', cursor: 'pointer' }}
            >
              로그인하러 가기
            </button>
          </div>
        )}

        {error && <div className="auth-msg error">{error}</div>}
      </div>
    </div>
  )
}
