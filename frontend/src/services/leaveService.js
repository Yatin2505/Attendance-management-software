import api from './api';

export const getLeaveRequests = async (params) => {
  const response = await api.get('/leave', { params });
  return response.data;
};

export const createLeaveRequest = async (data) => {
  const response = await api.post('/leave', data);
  return response.data;
};

export const updateLeaveStatus = async (id, status, notes) => {
  const response = await api.put(`/leave/${id}`, { status, notes });
  return response.data;
};

export const deleteLeaveRequest = async (id) => {
  const response = await api.delete(`/leave/${id}`);
  return response.data;
};
