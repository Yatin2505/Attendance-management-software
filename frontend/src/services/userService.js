import api from './api';

const getTeachers = async () => {
  const response = await api.get('/users/teachers');
  return response.data;
};

const createTeacher = async (teacherData) => {
  const response = await api.post('/users/teachers', teacherData);
  return response.data;
};

const deleteTeacher = async (id) => {
  const response = await api.delete(`/users/teachers/${id}`);
  return response.data;
};

export const userService = {
  getTeachers,
  createTeacher,
  deleteTeacher
};
