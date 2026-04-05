import axios from 'axios';

const API_URL = '/api/auth'; // We'll use auth routes for admin creation

export const getInstitutes = async () => {
  const { data } = await axios.get('/api/users/admins'); // We'll add this endpoint to userController
  return data;
};

export const createInstitute = async (adminData) => {
  // adminData: { name, email, password }
  const { data } = await axios.post('/api/auth/register', { 
    ...adminData, 
    role: 'admin' 
  });
  return data;
};
