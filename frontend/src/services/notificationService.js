import api from './api';

const API_URL = '/notifications';

// Helper for auth headers (assuming they are set globally or in interceptors, 
// but being explicit if needed based on common patterns in this app)
const getNotifications = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

const markAsRead = async (id) => {
  const response = await api.patch(`${API_URL}/${id}/read`);
  return response.data;
};

const markAllAsRead = async () => {
  const response = await api.post(`${API_URL}/read-all`);
  return response.data;
};

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead
};

export default notificationService;
