import api from './api';

export const getInstitutes = async () => {
  const { data } = await api.get('/users/admins');
  return data;
};

export const createInstitute = async (adminData) => {
  // adminData: { name, email, password }
  const { data } = await api.post('/auth/register', { 
    ...adminData, 
    role: 'admin' 
  });
  return data;
};
