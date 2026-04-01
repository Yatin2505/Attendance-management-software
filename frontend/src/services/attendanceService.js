import api from './api';

export const getAttendance = async (date, batchId, studentId) => {
  let url = '/attendance?';
  if (date) url += `date=${date}&`;
  if (batchId) url += `batchId=${batchId}&`;
  if (studentId) url += `studentId=${studentId}`;
  
  const response = await api.get(url);
  return response.data;
};

export const getAttendanceTrends = async (days = 30) => {
  const response = await api.get(`/attendance/trends?days=${days}`);
  return response.data;
};

export const markAttendance = async (attendanceData) => {
  const response = await api.post('/attendance', attendanceData);
  return response.data;
};

// Bulk upsert — sends all records in a single request (N records → 1 HTTP call)
export const markAttendanceBulk = async (batchId, date, records) => {
  const response = await api.post('/attendance/bulk', { batchId, date, records });
  return response.data;
};

export const markAllPresent = async (batchId, date) => {
  const response = await api.post('/attendance/mark-all', { batchId, date });
  return response.data;
};

export const getStudentAttendance = async (studentId) => {
  const response = await api.get(`/attendance/student/${studentId}`);
  return response.data;
};

export const updateAttendance = async (id, status) => {
  const response = await api.put(`/attendance/${id}`, { status });
  return response.data;
};

export const deleteAttendance = async (id) => {
  const response = await api.delete(`/attendance/${id}`);
  return response.data;
};
