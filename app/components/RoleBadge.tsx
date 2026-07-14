// role 값에 따라 방패 아이콘을 표시하는 컴포넌트 (D 스타일: 아이콘 + 색 닉네임)
// admin → 코랄 방패, official → 초록 방패 (추후 SMTP 계정용)

const ROLE_ICON: Record<string, string> = {
  admin: 'role-ico-admin',
  official: 'role-ico-official',
}

export default function RoleBadge({ role }: { role?: string | null }) {
  if (!role) return null
  const cls = ROLE_ICON[role]
  if (!cls) return null

  return (
    <svg
      className={`role-ico ${cls}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}
