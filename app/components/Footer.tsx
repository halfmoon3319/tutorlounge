import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* 상단: 로고 + 사업자 정보 */}
        <div className="footer-top">
          <div className="footer-brand">TutorLounge</div>
        </div>

        {/* 사업자 정보 (임시 텍스트 — 추후 실제 정보로 교체) */}
        <div className="footer-info">
          <p>
            (주)튜터라운지 | 대표자: 홍길동 | 사업자번호: 000-00-00000 |{' '}
            <Link href="#">사업자 정보 확인</Link>
          </p>
          <p>
            통신판매업: 0000-지역-0000 | 개인정보보호책임자: 홍길동 | 이메일: support@tutorlounge.kr
          </p>
          <p>
            전화번호: 00-0000-0000 | 주소: 서울특별시 ○○구 ○○로 000, 000호
          </p>
        </div>

        {/* 하단: 링크 + 저작권 */}
        <div className="footer-bottom">
          <div className="footer-links">
            <Link href="#">이용안내</Link>
            <Link href="#">개인정보처리방침</Link>
            <Link href="#">사업자 정보 확인</Link>
          </div>
          <div className="footer-copy">© TutorLounge. ALL RIGHTS RESERVED</div>
        </div>
      </div>
    </footer>
  )
}
