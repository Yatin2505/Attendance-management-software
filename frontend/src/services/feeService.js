import axios from 'axios';

const API_URL = '/api/fees';

// Admin: Get all fees (with filters)
export const getFees = async (params = {}) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

// Admin: Create individual student fee
export const createFee = async (feeData) => {
  const response = await axios.post(API_URL, feeData);
  return response.data;
};

// Admin: Assign fees to all students in a batch
export const assignBatchFees = async (batchFeeData) => {
  const response = await axios.post(`${API_URL}/batch`, batchFeeData);
  return response.data;
};

// Admin: Record a payment
export const recordPayment = async (id, paymentData) => {
  const response = await axios.put(`${API_URL}/${id}/payment`, paymentData);
  return response.data;
};

// Admin: Get dashboard stats
export const getFeeStats = async () => {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data;
};

// Student: Get own fees
export const getMyFees = async () => {
  const response = await axios.get(`${API_URL}/me`);
  return response.data;
};
