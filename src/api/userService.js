import axiosInstance from './axiosInstance';

export const getUserProfile = async () => {
  const response = await axiosInstance.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (data) => {
  const response = await axiosInstance.put('/users/profile', data);
  return response.data;
};

export const getNotifications = async () => {
  const response = await axiosInstance.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
};

export const getUsers = async () => {
  const response = await axiosInstance.get('/users');
  return response.data;
};
