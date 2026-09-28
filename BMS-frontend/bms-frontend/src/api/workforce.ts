import api from './axios'

export type WorkforcePersonType = 'agency' | 'internal'

export const workforceApi = {
  overview: () => api.get('/workforce/overview').then(res => res.data),

  listAgencies: () => api.get('/workforce/agencies').then(res => res.data),
  createAgency: (dto: any) => api.post('/workforce/agencies', dto).then(res => res.data),
  updateAgency: (id: string, dto: any) => api.patch(`/workforce/agencies/${id}`, dto).then(res => res.data),
  deleteAgency: (id: string) => api.delete(`/workforce/agencies/${id}`).then(res => res.data),

  listContracts: () => api.get('/workforce/contracts').then(res => res.data),
  createContract: (dto: any) => api.post('/workforce/contracts', dto).then(res => res.data),
  updateContract: (id: string, dto: any) => api.patch(`/workforce/contracts/${id}`, dto).then(res => res.data),
  deleteContract: (id: string) => api.delete(`/workforce/contracts/${id}`).then(res => res.data),

  listAgencyEmployees: () => api.get('/workforce/agency-employees').then(res => res.data),
  createAgencyEmployee: (dto: any) => api.post('/workforce/agency-employees', dto).then(res => res.data),
  updateAgencyEmployee: (id: string, dto: any) => api.patch(`/workforce/agency-employees/${id}`, dto).then(res => res.data),
  deleteAgencyEmployee: (id: string) => api.delete(`/workforce/agency-employees/${id}`).then(res => res.data),

  listInternalEmployees: () => api.get('/workforce/internal-employees').then(res => res.data),
  createInternalEmployee: (dto: any) => api.post('/workforce/internal-employees', dto).then(res => res.data),
  updateInternalEmployee: (id: string, dto: any) => api.patch(`/workforce/internal-employees/${id}`, dto).then(res => res.data),
  deleteInternalEmployee: (id: string) => api.delete(`/workforce/internal-employees/${id}`).then(res => res.data),

  listAssignments: () => api.get('/workforce/assignments').then(res => res.data),
  createAssignment: (dto: any) => api.post('/workforce/assignments', dto).then(res => res.data),
  updateAssignment: (id: string, dto: any) => api.patch(`/workforce/assignments/${id}`, dto).then(res => res.data),
  deleteAssignment: (id: string) => api.delete(`/workforce/assignments/${id}`).then(res => res.data),

  listAttendance: () => api.get('/workforce/attendance').then(res => res.data),
  checkIn: (dto: any) => api.post('/workforce/attendance/check-in', dto).then(res => res.data),
  checkOut: (id: string, dto: any = {}) => api.patch(`/workforce/attendance/${id}/check-out`, dto).then(res => res.data),
  markAbsent: (dto: any) => api.post('/workforce/attendance/absent', dto).then(res => res.data),

  listLeaves: () => api.get('/workforce/leaves').then(res => res.data),
  createLeave: (dto: any) => api.post('/workforce/leaves', dto).then(res => res.data),
  decideLeave: (id: string, dto: any) => api.patch(`/workforce/leaves/${id}/decision`, dto).then(res => res.data),
}
