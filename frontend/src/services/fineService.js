import api from './api';

export const fineService = {
  getFines: (params) => api.get('/fines', { params }),
  getMyFines: () => api.get('/fines/my'),
  payFine: (id, action) => api.put(`/fines/${id}/pay`, { action }),
};
