'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { createClient } from '../../lib/supabase-browser'
import ConsentSection from '../components/ConsentSection'

// Daum 우편번호 서비스 타입 (window.daum)
declare global {
  interface Window {
    daum?: {
      Postcode: new (config: {
        oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void
      }) => { open: () => void }
    }
  }
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  // 동의 (필수 항목 전체 동의 여부)
  const [allRequiredAgreed, setAllRequiredAgreed] = useState(false)

  // 계정
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  // 개인정보
  const [realName, setRealName] = useState('')
  const [nickname, setNickname] = useState('')
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [nicknameMsg, setNicknameMsg] = useState('')
  const [phone, setPhone] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [careerYears, setCareerYears] = useState('')
  const [region, setRegion] = useState('')

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 주소 검색 팝업 열기
  function openAddressSearch() {
    if (!window.daum?.Postcode) {
      alert('주소 검색 서비스를 불러오는 중이에요. 잠시 후 다시 시도해주세요.')
      return
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setZipCode(data.zonecode)
        setAddress(data.roadAddress)
        document.getElementById('address-detail')?.focus()
      },
    }).open()
  }

  // 닉네임 중복 + 형식 + 금지어 확인
  async function checkNickname() {
    const trimmed = nickname.trim()

    if (!trimmed) {
      setNicknameMsg('닉네임을 입력해주세요.')
      setNicknameChecked(false)
      return
    }
    // 형식: 2~12자, 한글·영문·숫자만
    const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,12}$/
    if (!nicknameRegex.test(trimmed)) {
      setNicknameMsg('닉네임은 한글·영문·숫자 2~12자로 입력해주세요.')
      setNicknameChecked(false)
      return
    }

    // 금지어 검사 (banned_nicknames 테이블)
    const { data: bannedList } = await supabase
      .from('banned_nicknames')
      .select('word')

    const lower = trimmed.toLowerCase()
    const isBanned = (bannedList ?? []).some((b) =>
      lower.includes(b.word.toLowerCase())
    )
    if (isBanned) {
      setNicknameMsg('사용할 수 없는 닉네임이에요.')
      setNicknameChecked(false)
      return
    }

    // 중복 검사
    const { data, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', trimmed)
      .maybeSingle()

    if (checkError) {
      setNicknameMsg('확인 중 오류가 발생했어요. 다시 시도해주세요.')
      setNicknameChecked(false)
      return
    }

    if (data) {
      setNicknameMsg('이미 사용 중인 닉네임이에요.')
      setNicknameChecked(false)
    } else {
      setNicknameMsg('사용 가능한 닉네임이에요.')
      setNicknameChecked(true)
    }
  }

  async function handleSignup() {
    setError('')

    // 필드별 형식 검증
    const errors: { [key: string]: string } = {}

    // 이메일 형식
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      errors.email = '이메일을 입력해주세요.'
    } else if (!emailRegex.test(email)) {
      errors.email = '올바른 이메일 형식이 아니에요. (예: abc@gmail.com)'
    }

    // 비밀번호: 6자 이상 + 영문·숫자·기호 조합
    const pwHasLetter = /[a-zA-Z]/.test(password)
    const pwHasNumber = /[0-9]/.test(password)
    const pwHasSymbol = /[^a-zA-Z0-9]/.test(password)
    if (!password) {
      errors.password = '비밀번호를 입력해주세요.'
    } else if (password.length < 6 || !pwHasLetter || !pwHasNumber || !pwHasSymbol) {
      errors.password = '비밀번호는 6자 이상, 영문·숫자·기호를 모두 포함해야 해요.'
    }

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      errors.passwordConfirm = '비밀번호가 일치하지 않아요.'
    }

    // 이름
    if (!realName.trim()) {
      errors.realName = '이름을 입력해주세요.'
    }

    // 전화번호 (입력한 경우에만 형식 검사)
    if (phone) {
      const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        errors.phone = '올바른 전화번호 형식이 아니에요. (예: 010-1234-5678)'
      }
    }

    setFieldErrors(errors)

    // 동의 검증
    if (!allRequiredAgreed) {
      setError('필수 약관에 모두 동의해주세요.')
      return
    }
    // 닉네임 확인 검증
    if (!nicknameChecked) {
      setError('닉네임 중복 확인을 해주세요.')
      return
    }
    // 형식 오류가 하나라도 있으면 중단
    if (Object.keys(errors).length > 0) {
      setError('입력 정보를 다시 확인해주세요.')
      return
    }

    setLoading(true)

    // 1) 계정 생성
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname: nickname.trim() },
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

   const userId = signupData.user?.id

    // 2) profiles에 공개 정보 저장
    if (userId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nickname: nickname.trim(),
          career_years: careerYears ? Number(careerYears) : null,
          region: region || null,
        })
        .eq('id', userId)

      if (profileError) {
        console.error('프로필 저장 실패:', profileError)
      }

      // 3) profiles_private에 민감 정보 저장
      const { error: privateError } = await supabase
        .from('profiles_private')
        .upsert({
          id: userId,
          real_name: realName.trim(),
          phone: phone || null,
          zip_code: zipCode || null,
          address: address || null,
          address_detail: addressDetail || null,
        })

      if (privateError) {
        console.error('민감정보 저장 실패:', privateError)
      }
    }

    setLoading(false)
    router.push('/')
  }

  return (
    <>
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
      <div className="auth-wrap">
        <div className="auth-card signup-card">
          <div className="auth-head">
            <div className="auth-title">함께해요, TutorLounge 👋</div>
            <div className="auth-sub">강사·교육 종사자라면 누구나 가입할 수 있어요.</div>
          </div>

          {/* 약관 동의 */}
          <ConsentSection onChange={(ok) => setAllRequiredAgreed(ok)} />

          <div className="email-form">
            {/* 계정 정보 */}
            <div className="form-section-label">계정 정보</div>

            <div className="input-wrap">
              <input
                className="input-field"
                type="email"
                placeholder="이메일 주소 *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && <span className="input-hint warn">{fieldErrors.email}</span>}
            </div>

            <div className="input-wrap">
              <input
                className="input-field"
                type="password"
                placeholder="비밀번호 *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password ? (
                <span className="input-hint warn">{fieldErrors.password}</span>
              ) : (
                <span className="input-hint">6자 이상, 영문·숫자·기호 조합</span>
              )}
            </div>

            <div className="input-wrap">
              <input
                className="input-field"
                type="password"
                placeholder="비밀번호 확인 *"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              {fieldErrors.passwordConfirm && <span className="input-hint warn">{fieldErrors.passwordConfirm}</span>}
            </div>

            {/* 개인 정보 */}
            <div className="form-section-label">개인 정보</div>

            <div className="input-wrap">
              <input
                className="input-field"
                type="text"
                placeholder="이름 *"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
              />
              {fieldErrors.realName && <span className="input-hint warn">{fieldErrors.realName}</span>}
            </div>

            <div className="input-wrap">
              <div className="address-row">
                <input
                  className="input-field"
                  type="text"
                  placeholder="닉네임 *"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value)
                    setNicknameChecked(false)
                    setNicknameMsg('')
                  }}
                />
                <button type="button" className="address-search-btn" onClick={checkNickname}>
                  중복 확인
                </button>
              </div>
              {nicknameMsg ? (
                <span className={nicknameChecked ? 'input-hint ok' : 'input-hint warn'}>{nicknameMsg}</span>
              ) : (
                <span className="input-hint">커뮤니티에서 보일 이름이에요. 한글·영문·숫자 2~12자.</span>
              )}
            </div>

            <div className="input-wrap">
              <input
                className="input-field"
                type="tel"
                placeholder="전화번호 (예: 010-1234-5678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {fieldErrors.phone && <span className="input-hint warn">{fieldErrors.phone}</span>}
            </div>

            {/* 주소 */}
            <div className="address-row">
              <input
                className="input-field"
                type="text"
                placeholder="우편번호"
                value={zipCode}
                readOnly
              />
              <button type="button" className="address-search-btn" onClick={openAddressSearch}>
                주소 찾기
              </button>
            </div>
            <input
              className="input-field"
              type="text"
              placeholder="기본 주소"
              value={address}
              readOnly
            />
            <input
              id="address-detail"
              className="input-field"
              type="text"
              placeholder="상세 주소 (동·호수 등)"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
            />

            {/* 활동 정보 */}
            <div className="form-section-label">활동 정보</div>

            <div className="input-wrap">
              <input
                className="input-field"
                type="number"
                min="0"
                placeholder="경력 (년)"
                value={careerYears}
                onChange={(e) => setCareerYears(e.target.value)}
              />
              <span className="input-hint">강사·교육 경력을 햇수로 입력해주세요.</span>
            </div>
            <input
              className="input-field"
              type="text"
              placeholder="주요 활동 지역 (예: 서울 강남구)"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
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
    </>
  )
}
