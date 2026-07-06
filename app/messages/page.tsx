import { createClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import MessagesView from '../components/MessagesView'

export default async function MessagesPage() {
  const supabase = await createClient()

  // 로그인 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 받은 쪽지 (내가 받는 사람, 내가 안 지운 것)
  const { data: receivedRaw } = await supabase
    .from('notes')
    .select('id, body, is_read, created_at, sender_id')
    .eq('receiver_id', user.id)
    .eq('receiver_deleted', false)
    .order('created_at', { ascending: false })

  // 보낸 쪽지 (내가 보낸 사람, 내가 안 지운 것)
  const { data: sentRaw } = await supabase
    .from('notes')
    .select('id, body, is_read, created_at, receiver_id')
    .eq('sender_id', user.id)
    .eq('sender_deleted', false)
    .order('created_at', { ascending: false })

  // 상대방 닉네임을 붙이기 위해 관련 사용자 ID 모으기
  const partnerIds = new Set<string>()
  ;(receivedRaw ?? []).forEach((n) => partnerIds.add(n.sender_id))
  ;(sentRaw ?? []).forEach((n) => partnerIds.add(n.receiver_id))

  // 닉네임 조회
  const { data: profiles } = partnerIds.size > 0
    ? await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', Array.from(partnerIds))
    : { data: [] }

  const nmeMap: { [id: string]: string } = {}
  ;(profiles ?? []).forEach((p) => { nmeMap[p.id] = p.nickname })

  // 받은/보낸 쪽지에 상대 닉네임 붙이기
  const received = (receivedRaw ?? []).map((n) => ({
    id: n.id,
    body: n.body,
    is_read: n.is_read,
    created_at: n.created_at,
    partnerId: n.sender_id,
    partnerName: nmeMap[n.sender_id] ?? '(알 수 없음)',
  }))

  const sent = (sentRaw ?? []).map((n) => ({
    id: n.id,
    body: n.body,
    is_read: n.is_read,
    created_at: n.created_at,
    partnerId: n.receiver_id,
    partnerName: nmeMap[n.receiver_id] ?? '(알 수 없음)',
  }))

  return <MessagesView received={received} sent={sent} />
}
