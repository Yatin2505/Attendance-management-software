import axios from 'axios';

const API_URL = '/api/notifications';

// Helper for auth headers (assuming they are set globally or in interceptors, 
// but being explicit if needed based on common patterns in this app)
const getNotifications = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

const markAsRead = async (id) => {
  const response = await axios.patch(`${API_URL}/${id}/read`);
  return response.data;
};

const markAllAsRead = async () => {
  const response = await axios.post(`${API_URL}/read-all`);
  return response.data;
};

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead
};

export default notificationService;
