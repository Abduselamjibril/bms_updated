import api from './axios'

export async function getSettings() {
  const res = await api.get('/settings')
  return res.data
}

export async function getPublicSettings() {
  const res = await api.get('/settings/public')
  return res.data
}

export async function updateSettings(data: {
  company_name?: string
  tin_number?: string
  vat_number?: string
  vat_rate?: number
  withholding_rate?: number
  late_fee_percentage?: number
  late_fee_type?: 'PERCENTAGE' | 'FLAT'
  late_fee_flat_amount?: number
  late_fee_grace_period_days?: number
  early_termination_penalty_pct?: number
  rent_escalation_pct?: number
  default_lease_duration_months?: number
  primary_color?: string
  secondary_color?: string
  font_family?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  authorized_signatory_name?: string
  authorized_signatory_title?: string
  telegram_enabled?: boolean
  telegram_bot_token?: string
  telegram_bot_username?: string
  telegram_send_announcements?: boolean
  telegram_send_private_notifications?: boolean
  telegram_webhook_secret?: string
  logo?: File
  company_seal?: File
  header_image?: File
  footer_image?: File
}) {
  const formData = new FormData()
  if (data.company_name !== undefined) formData.append('company_name', data.company_name)
  if (data.tin_number !== undefined) formData.append('tin_number', data.tin_number)
  if (data.vat_number !== undefined) formData.append('vat_number', data.vat_number)
  if (data.vat_rate !== undefined) formData.append('vat_rate', String(data.vat_rate))
  if (data.withholding_rate !== undefined) formData.append('withholding_rate', String(data.withholding_rate))
  if (data.late_fee_percentage !== undefined) formData.append('late_fee_percentage', String(data.late_fee_percentage))
  if (data.late_fee_type !== undefined) formData.append('late_fee_type', data.late_fee_type)
  if (data.late_fee_flat_amount !== undefined) formData.append('late_fee_flat_amount', String(data.late_fee_flat_amount))
  if (data.late_fee_grace_period_days !== undefined) formData.append('late_fee_grace_period_days', String(data.late_fee_grace_period_days))
  if (data.early_termination_penalty_pct !== undefined) formData.append('early_termination_penalty_pct', String(data.early_termination_penalty_pct))
  if (data.rent_escalation_pct !== undefined) formData.append('rent_escalation_pct', String(data.rent_escalation_pct))
  if (data.default_lease_duration_months !== undefined) formData.append('default_lease_duration_months', String(data.default_lease_duration_months))
  if (data.primary_color !== undefined) formData.append('primary_color', data.primary_color)
  if (data.secondary_color !== undefined) formData.append('secondary_color', data.secondary_color)
  if (data.font_family !== undefined) formData.append('font_family', data.font_family)
  if (data.company_address !== undefined) formData.append('company_address', data.company_address)
  if (data.company_phone !== undefined) formData.append('company_phone', data.company_phone)
  if (data.company_email !== undefined) formData.append('company_email', data.company_email)
  if (data.authorized_signatory_name !== undefined) formData.append('authorized_signatory_name', data.authorized_signatory_name)
  if (data.authorized_signatory_title !== undefined) formData.append('authorized_signatory_title', data.authorized_signatory_title)
  if (data.telegram_enabled !== undefined) formData.append('telegram_enabled', String(data.telegram_enabled))
  if (data.telegram_bot_token !== undefined && data.telegram_bot_token.trim()) formData.append('telegram_bot_token', data.telegram_bot_token)
  if (data.telegram_bot_username !== undefined) formData.append('telegram_bot_username', data.telegram_bot_username)
  if (data.telegram_send_announcements !== undefined) formData.append('telegram_send_announcements', String(data.telegram_send_announcements))
  if (data.telegram_send_private_notifications !== undefined) formData.append('telegram_send_private_notifications', String(data.telegram_send_private_notifications))
  if (data.telegram_webhook_secret !== undefined) formData.append('telegram_webhook_secret', data.telegram_webhook_secret)
  if (data.logo) formData.append('logo', data.logo)
  if (data.company_seal) formData.append('company_seal', data.company_seal)
  if (data.header_image) formData.append('header_image', data.header_image)
  if (data.footer_image) formData.append('footer_image', data.footer_image)
  const res = await api.patch('/settings', formData)
  return res.data
}
