import api from './api';

export const reservationService = {
  createReservation: (data) => api.post('/reservations', data),
  getReservations: (params) => api.get('/reservations', { params }),
  getMyReservations: () => api.get('/reservations/my'),
  updateStatus: (id, status) => api.put(`/reservations/${id}`, { status }),
  cancelReservation: (id) => api.delete(`/reservations/${id}`),
};
