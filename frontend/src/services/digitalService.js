import api from './api';

export const digitalService = {
  getResources: (params) => api.get('/digital-library', { params }),
  createResource: (data) => api.post('/digital-library', data),
  deleteResource: (id) => api.delete(`/digital-library/${id}`),
  downloadResource: (id) => api.get(`/digital-library/${id}/download`),
};
