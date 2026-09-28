import api from './axios'

export async function listUsers({ page = 1, per_page = 25, search = '' } = {}) {
  const res = await api.get('/users', { params: { page, per_page, search } })
  return res.data
}

export async function createUser(dto: any) {
  const res = await api.post('/users', dto)
  return res.data
}

export async function getUser(id: string | number) {
  const res = await api.get(`/users/${id}`)
  return res.data
}

export async function updateUser(id: string | number, dto: any) {
  const res = await api.patch(`/users/${id}`, dto)
  return res.data
}

export async function deleteUser(id: string | number) {
  const res = await api.delete(`/users/${id}`)
  return res.data
}

export async function activateUser(id: string | number) {
  const res = await api.patch(`/users/${id}/activate`)
  return res.data
}

export async function assignRole(payload: { user_id: number | string; role_id: number | string }) {
  const res = await api.post('/users/assign-role', payload)
  return res.data
}

export async function getSignature() {
  const res = await api.get('/users/me/signature')
  return res.data
}

export async function saveSignature(data: {
  signature_svg?: string
  signature_png_base64?: string
  file?: File
}) {
  const formData = new FormData()
  if (data.signature_svg) formData.append('signature_svg', data.signature_svg)
  if (data.signature_png_base64) formData.append('signature_png_base64', data.signature_png_base64)
  if (data.file) formData.append('file', data.file)
  const res = await api.post('/users/me/signature', formData)
  return res.data
}
