import api from './axios'

export type TelegramScopeType = 'GLOBAL' | 'SITE' | 'BUILDING'
export type TelegramPurpose = 'GENERAL' | 'ANNOUNCEMENTS' | 'MAINTENANCE' | 'FINANCE' | 'LEASES'

export async function listTelegramTargets(params?: {
  scope_type?: TelegramScopeType
  scope_id?: string
  purpose?: TelegramPurpose
  is_active?: boolean
}) {
  const res = await api.get('/telegram/chat-targets', { params })
  return res.data
}

export async function createTelegramTarget(dto: {
  scope_type: TelegramScopeType
  scope_id?: string | null
  title: string
  chat_id: string
  purpose?: TelegramPurpose
  is_active?: boolean
}) {
  const res = await api.post('/telegram/chat-targets', dto)
  return res.data
}

export async function updateTelegramTarget(id: string, dto: any) {
  const res = await api.patch(`/telegram/chat-targets/${id}`, dto)
  return res.data
}

export async function deleteTelegramTarget(id: string) {
  const res = await api.delete(`/telegram/chat-targets/${id}`)
  return res.data
}

export async function testTelegramTarget(id: string) {
  const res = await api.post(`/telegram/chat-targets/${id}/test`)
  return res.data
}

export async function testTelegramBot() {
  const res = await api.post('/telegram/test-bot')
  return res.data
}

export async function getMyTelegramStatus() {
  const res = await api.get('/telegram/me')
  return res.data
}

export async function updateMyTelegramUsername(telegram_username: string) {
  const res = await api.post('/telegram/me/username', { telegram_username })
  return res.data
}

export async function createMyTelegramConnectLink(telegram_username?: string) {
  const res = await api.post('/telegram/me/connect-link', { telegram_username })
  return res.data
}

export async function resendMyTelegramConnectEmail(telegram_username?: string) {
  const res = await api.post('/telegram/me/resend-connect-email', { telegram_username })
  return res.data
}

export async function disconnectMyTelegram() {
  const res = await api.post('/telegram/me/disconnect')
  return res.data
}
