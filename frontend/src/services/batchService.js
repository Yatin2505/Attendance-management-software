import api from './api';

export const getBatches = async () => {
  const response = await api.get('/batches');
  return response.data;
};

export const getBatchById = async (id) => {
  const response = await api.get(`/batches/${id}`);
  return response.data;
};

export const createBatch = async (batchData) => {
  const response = await api.post('/batches', batchData);
  return response.data;
};

export const updateBatch = async (id, batchData) => {
  const response = await api.put(`/batches/${id}`, batchData);
  return response.data;
};

export const deleteBatch = async (id) => {
  const response = await api.delete(`/batches/${id}`);
  return response.data;
};

export const assignStudentToBatch = async (batchId, studentId) => {
  const response = await api.post(`/batches/${batchId}/add-student`, { studentId });
  return response.data;
};

export const removeStudentFromBatch = async (batchId, studentId) => {
  const response = await api.post(`/batches/${batchId}/remove-student`, { studentId });
  return response.data;
};
