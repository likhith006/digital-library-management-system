import api from './api';

export const reportService = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getBorrowingReport: (params) => api.get('/reports/borrowing', { params }),
  getOverdueReport: () => api.get('/reports/overdue'),
};
