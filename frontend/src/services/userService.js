import api from './api';

const getTeachers = async () => {
  const response = await api.get('/users/teachers');
  return response.data;
};

export const userService = {
  getTeachers,
};
