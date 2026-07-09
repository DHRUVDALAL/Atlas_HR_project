import axiosInstance from './axiosInstance';

// Public candidate registration — single atomic multipart submission.
// `payloadObject` is the complete application (personal_details, professional_details,
// employment_history[], education[], personality_assessment[], situational_responses[],
// written_responses[], declaration). `signatureFile` is the required signature PDF File.
// The whole form is assembled client-side; there is no server-side draft.
export const submitApplication = async (payloadObject, signatureFile) => {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(payloadObject));
  formData.append('signature', signatureFile);

  const response = await axiosInstance.post('/applicant', formData, {
    // Override the axios instance's default application/json so the browser can
    // set multipart/form-data with the correct boundary.
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateApplicant = async (candidateId, payloadObject) => {
  const response = await axiosInstance.put(`/applicant/${candidateId}`, payloadObject);
  return response.data;
};

// Querying applicants
export const getApplicants = async (params = {}) => {
  const response = await axiosInstance.get('/applicants', { params });
  return response.data;
};

export const getApplicantById = async (id) => {
  const response = await axiosInstance.get(`/applicant/${id}`);
  return response.data;
};

// An interviewer's own assigned rounds (no candidate.list permission needed).
export const getMyAssignments = async (onlyPending = true) => {
  const response = await axiosInstance.get('/workflow/my-assignments', {
    params: { only_pending: onlyPending },
  });
  return response.data;
};

// Workflow actions
export const forwardToHr = async (candidateId) => {
  const response = await axiosInstance.post(`/workflow/receptionist/forward/${candidateId}`);
  return response.data;
};

export const submitHrReview = async (candidateId, data) => {
  const response = await axiosInstance.post(`/workflow/hr/review/${candidateId}`, data);
  return response.data;
};

export const submitTechnicalEvaluation = async (candidateId, roundNumber, data) => {
  const response = await axiosInstance.post(`/workflow/technical/evaluate/${candidateId}/${roundNumber}`, data);
  return response.data;
};

export const submitFinalDecision = async (candidateId, data) => {
  const response = await axiosInstance.post(`/workflow/final-decision/${candidateId}`, data);
  return response.data;
};

export const submitCeoEvaluation = async (candidateId, data) => {
  const response = await axiosInstance.post(`/workflow/ceo/evaluate/${candidateId}`, data);
  return response.data;
};

export const getScorecardTopics = async (domain) => {
  const response = await axiosInstance.get(`/scorecard/${domain}`);
  return response.data;
};

export const getScorecardDomains = async () => {
  const response = await axiosInstance.get('/scorecard/domains');
  return response.data;
};
