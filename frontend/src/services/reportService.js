import api from './api';

export const getStudentReport = async (studentId) => {
  const response = await api.get(`/reports/student/${studentId}`);
  return response.data;
};

export const getBatchReport = async (batchId) => {
  const response = await api.get(`/reports/batch/${batchId}`);
  return response.data;
};

export const getMonthlyReport = async (month, year, batchId) => {
  let url = `/reports/monthly?month=${month}&year=${year}`;
  if (batchId) url += `&batchId=${batchId}`;
  
  const response = await api.get(url);
  return response.data;
};

export const getDateRangeReport = async (from, to, batchId) => {
  let url = `/reports/range?from=${from}&to=${to}`;
  if (batchId) url += `&batchId=${batchId}`;
  
  const response = await api.get(url);
  return response.data;
};
