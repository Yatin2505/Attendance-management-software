import api from './api';

export const getStudents = async () => {
  const response = await api.get('/students');
  return response.data;
};

export const getStudentProfile = async (id) => {
  const response = await api.get(`/students/${id}/profile`);
  return response.data;
};


export const getStudentById = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

export const createStudent = async (studentData) => {
  const response = await api.post('/students', studentData);
  return response.data;
};

export const updateStudent = async (id, studentData) => {
  const response = await api.put(`/students/${id}`, studentData);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

export const importStudents = async (students) => {
  const response = await api.post('/students/import', { students });
  return response.data;
};

export const getStudentSelfProfile = async () => {
  const response = await api.get('/students/me/profile');
  return response.data;
};

export const enableStudentPortal = async (id, portalData) => {
  const response = await api.post(`/students/${id}/enable-portal`, portalData);
  return response.data;
};

export const getStudentPortalStatus = async (id) => {
  const response = await api.get(`/students/${id}/portal-status`);
  return response.data;
};
