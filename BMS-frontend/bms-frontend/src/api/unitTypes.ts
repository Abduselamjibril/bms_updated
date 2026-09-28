import api from './axios';

export async function getUnitTypes(params?: { search?: string; active_only?: boolean }) {
  const res = await api.get('/unit-types', { params });
  return res.data;
}

export async function createUnitType(dto: {
  code: string;
  name: string;
  is_commercial?: boolean;
  description?: string;
}) {
  const res = await api.post('/unit-types', dto);
  return res.data;
}

export async function updateUnitType(id: string, dto: {
  name?: string;
  is_active?: boolean;
  is_commercial?: boolean;
  description?: string;
}) {
  const res = await api.patch(`/unit-types/${id}`, dto);
  return res.data;
}

export async function deleteUnitType(id: string) {
  const res = await api.delete(`/unit-types/${id}`);
  return res.data;
}
