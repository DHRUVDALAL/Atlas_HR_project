import axiosInstance from './axiosInstance';

export const getInterviews = async (params = {}) => {
  const response = await axiosInstance.get('/interviews', { params });
  return response.data;
};

export const getInterviewById = async (id) => {
  const response = await axiosInstance.get(`/interviews/${id}`);
  return response.data;
};

export const getCandidateInterviews = async (candidateId) => {
  const response = await axiosInstance.get(`/candidates/${candidateId}/interviews`);
  return response.data;
};

export const createInterviewRound = async (data) => {
  const response = await axiosInstance.post('/interviews', data);
  return response.data;
};

export const updateInterviewRound = async (id, data) => {
  const response = await axiosInstance.put(`/interviews/${id}`, data);
  return response.data;
};

export const deleteInterviewRound = async (id) => {
  const response = await axiosInstance.delete(`/interviews/${id}`);
  return response.data;
};
