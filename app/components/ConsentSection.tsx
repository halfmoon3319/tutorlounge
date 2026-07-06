'use client'

import { useState } from 'react'

// 표준 템플릿 약관 문구
const TERMS_OF_SERVICE = `제1조 (목적)
본 약관은 TutorLounge(이하 "서비스")가 제공하는 온라인 커뮤니티 서비스의 이용과 관련하여 서비스와 회원 간의 권리, 의무 및 책임사항, 이용 조건 및 절차 등 기본적인 사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "회원"이란 본 약관에 동의하고 서비스와 이용계약을 체결한 자를 말합니다.
2. "닉네임"이란 회원의 식별과 서비스 이용을 위하여 회원이 설정하고 서비스가 승인한 문자의 조합을 말합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.

제4조 (서비스의 이용)
1. 회원은 본 약관 및 관련 법령을 준수하여야 하며, 타인의 권리를 침해하거나 미풍양속에 반하는 행위를 하여서는 안 됩니다.
2. 서비스는 회원이 게시한 내용이 관련 법령 또는 운영정책에 위배되는 경우 사전 통지 없이 삭제하거나 이용을 제한할 수 있습니다.

제5조 (회원의 의무)
1. 회원은 자신의 계정 정보를 안전하게 관리할 책임이 있으며, 이를 타인에게 양도하거나 대여할 수 없습니다.
2. 회원은 서비스 이용 과정에서 알게 된 다른 회원의 정보를 무단으로 수집·이용·제공하여서는 안 됩니다.

제6조 (게시물의 관리)
회원이 작성한 게시물의 저작권은 해당 회원에게 귀속되며, 회원은 자신이 작성한 게시물이 타인의 저작권 등 권리를 침해하지 않음을 보증합니다.

제7조 (책임의 제한)
서비스는 천재지변, 회원의 귀책사유 등 부득이한 사유로 인한 서비스 중단에 대하여 책임을 지지 않습니다.`

const PRIVACY_POLICY = `TutorLounge는 「개인정보 보호법」에 따라 회원의 개인정보를 다음과 같이 수집·이용합니다.

1. 수집 목적
- 회원 식별 및 본인 여부 확인
- 커뮤니티 서비스 제공 및 운영
- 부정 이용 방지 및 민원 처리

2. 수집 항목
- 필수: 이메일, 비밀번호, 이름, 닉네임
- 선택: 전화번호, 주소, 경력, 주요 활동 지역

3. 보유 및 이용 기간
- 회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.
- 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.

4. 동의 거부 권리
- 회원은 개인정보 수집·이용 동의를 거부할 권리가 있습니다.
- 다만, 필수 항목에 대한 동의를 거부하실 경우 회원 가입이 제한됩니다.

5. 개인정보의 제3자 제공
- 서비스는 회원의 동의 없이 개인정보를 외부에 제공하지 않습니다.
- 다만, 법령에 근거하거나 수사기관의 적법한 요청이 있는 경우는 예외로 합니다.`

const MARKETING_INFO = `TutorLounge는 회원에게 유용한 소식과 혜택을 안내하기 위해 마케팅 정보를 발송할 수 있습니다.

1. 수집·이용 목적
- 신규 서비스 및 이벤트 안내
- 맞춤형 콘텐츠 및 혜택 정보 제공

2. 발송 방법
- 이메일, 앱 푸시 알림 등

3. 동의 거부
- 본 항목은 선택 사항이며, 동의하지 않아도 회원 가입 및 서비스 이용에 제한이 없습니다.
- 동의 후에도 언제든지 수신을 거부할 수 있습니다.`

type ConsentState = {
  age: boolean
  terms: boolean
  privacy: boolean
  marketing: boolean
}

export default function ConsentSection({
  onChange,
}: {
  onChange: (allRequiredAgreed: boolean, state: ConsentState) => void
}) {
  const [consent, setConsent] = useState<ConsentState>({
    age: false,
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [openKey, setOpenKey] = useState<string | null>(null)

  // 필수 3개(age, terms, privacy)가 모두 체크됐는지
  function checkAllRequired(state: ConsentState) {
    return state.age && state.terms && state.privacy
  }

  function update(next: ConsentState) {
    setConsent(next)
    onChange(checkAllRequired(next), next)
  }

  // 전체 동의 토글
  function toggleAll() {
    const allChecked = consent.age && consent.terms && consent.privacy && consent.marketing
    const next = {
      age: !allChecked,
      terms: !allChecked,
      privacy: !allChecked,
      marketing: !allChecked,
    }
    update(next)
  }

  function toggleOne(key: keyof ConsentState) {
    update({ ...consent, [key]: !consent[key] })
  }

  function toggleOpen(key: string) {
    setOpenKey(openKey === key ? null : key)
  }

  const allChecked = consent.age && consent.terms && consent.privacy && consent.marketing

  return (
    <div className="consent-box">
      {/* 전체 동의 */}
      <label className="consent-all">
        <input type="checkbox" checked={allChecked} onChange={toggleAll} />
        <span>전체 동의합니다.</span>
      </label>

      <div className="consent-divider" />

      {/* 만 14세 이상 */}
      <div className="consent-item">
        <label className="consent-row">
          <input type="checkbox" checked={consent.age} onChange={() => toggleOne('age')} />
          <span><b className="consent-req">(필수)</b> 만 14세 이상입니다.</span>
        </label>
      </div>

      {/* 이용약관 */}
      <div className="consent-item">
        <label className="consent-row">
          <input type="checkbox" checked={consent.terms} onChange={() => toggleOne('terms')} />
          <span><b className="consent-req">(필수)</b> 이용약관 동의</span>
        </label>
        <button type="button" className="consent-toggle" onClick={() => toggleOpen('terms')}>
          {openKey === 'terms' ? '접기 ∧' : '보기 ∨'}
        </button>
      </div>
      {openKey === 'terms' && <div className="consent-text">{TERMS_OF_SERVICE}</div>}

      {/* 개인정보 수집·이용 */}
      <div className="consent-item">
        <label className="consent-row">
          <input type="checkbox" checked={consent.privacy} onChange={() => toggleOne('privacy')} />
          <span><b className="consent-req">(필수)</b> 개인정보 수집·이용 동의</span>
        </label>
        <button type="button" className="consent-toggle" onClick={() => toggleOpen('privacy')}>
          {openKey === 'privacy' ? '접기 ∧' : '보기 ∨'}
        </button>
      </div>
      {openKey === 'privacy' && <div className="consent-text">{PRIVACY_POLICY}</div>}

      {/* 마케팅 (선택) */}
      <div className="consent-item">
        <label className="consent-row">
          <input type="checkbox" checked={consent.marketing} onChange={() => toggleOne('marketing')} />
          <span><b className="consent-opt">(선택)</b> 마케팅 정보 수신 동의</span>
        </label>
        <button type="button" className="consent-toggle" onClick={() => toggleOpen('marketing')}>
          {openKey === 'marketing' ? '접기 ∧' : '보기 ∨'}
        </button>
      </div>
      {openKey === 'marketing' && <div className="consent-text">{MARKETING_INFO}</div>}
    </div>
  )
}
