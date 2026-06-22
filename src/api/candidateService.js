import axiosInstance from './axiosInstance';

export const getCandidates = async (params = {}) => {
  const response = await axiosInstance.get('/candidates', { params });
  return response.data;
};

export const getCandidateById = async (id) => {
  const response = await axiosInstance.get(`/candidates/${id}`);
  return response.data;
};

export const createCandidate = async (data) => {
  const response = await axiosInstance.post('/candidates', data);
  return response.data;
};

export const updateCandidate = async (id, data) => {
  const response = await axiosInstance.put(`/candidates/${id}`, data);
  return response.data;
};

export const uploadResume = async (id, file) => {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await axiosInstance.post(`/candidates/${id}/resume`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadResume = async (id) => {
  const response = await axiosInstance.get(`/candidates/${id}/resume`, {
    responseType: 'blob',
  });
  return response.data;
};

export const searchCandidates = async (query) => {
  const response = await axiosInstance.get('/candidates/search', {
    params: { q: query },
  });
  return response.data;
};
