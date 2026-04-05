import api from './api';

export const getInstitutes = async () => {
  const { data } = await api.get('/users/admins');
  return data;
};

export const createInstitute = async (adminData) => {
  // adminData: { name, email, password, logo, brandingColor }
  const { data } = await api.post('/auth/register', { 
    ...adminData, 
    role: 'admin' 
  });
  return data;
};

export const deleteInstitute = async (id) => {
  const { data } = await api.delete(`/users/admins/${id}`);
  return data;
};

export const toggleInstituteStatus = async (id) => {
  const { data } = await api.patch(`/users/admins/${id}/status`);
  return data;
};

export const updateInstituteBranding = async (brandingData) => {
  const { data } = await api.patch('/users/institute/branding', brandingData);
  return data;
};
