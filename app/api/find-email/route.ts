import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 이메일 가리기: ab***@gmail.com 형태
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, 2)
  const masked = '*'.repeat(Math.max(local.length - 2, 1))
  return `${visible}${masked}@${domain}`
}

// 전화번호에서 숫자만 남기기 (하이픈·공백 제거)
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function POST(request: Request) {
  try {
    const { realName, phone } = await request.json()

    // 입력 검증
    if (!realName?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: '이름과 전화번호를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    const inputPhone = normalizePhone(phone)

    // 관리자 권한 클라이언트 (service role key, 서버에서만 사용)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 이름으로 먼저 조회 (전화번호는 아래에서 정규화 비교)
    const { data: privateRows, error: privateError } = await supabaseAdmin
      .from('profiles_private')
      .select('id, real_name, phone')
      .eq('real_name', realName.trim())

    if (privateError) {
      console.error('profiles_private 조회 실패:', privateError)
      return NextResponse.json(
        { error: '조회 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // 전화번호를 정규화해서 비교 (하이픈 있든 없든 매칭)
    const matchedRows = (privateRows ?? []).filter(
      (r) => r.phone && normalizePhone(r.phone) === inputPhone
    )

    if (matchedRows.length === 0) {
      return NextResponse.json(
        { error: '일치하는 회원 정보를 찾을 수 없어요. 이름과 전화번호를 확인해주세요.' },
        { status: 404 }
      )
    }

    // 찾은 회원들의 id로 이메일 조회
    const ids = matchedRows.map((r) => r.id)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .in('id', ids)

    if (profileError || !profiles) {
      console.error('profiles 조회 실패:', profileError)
      return NextResponse.json(
        { error: '조회 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // 이메일 가려서 반환 (중복 제거)
    const maskedEmails = Array.from(
      new Set(
        profiles
          .filter((p) => p.email)
          .map((p) => maskEmail(p.email as string))
      )
    )

    if (maskedEmails.length === 0) {
      return NextResponse.json(
        { error: '가입된 이메일 정보를 찾을 수 없어요.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ emails: maskedEmails })
  } catch (err) {
    console.error('find-email 라우트 오류:', err)
    return NextResponse.json(
      { error: '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
