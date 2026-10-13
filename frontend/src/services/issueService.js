import api from './api';

export const issueService = {
  issueBook: (issueData) => api.post('/issues', issueData),
  getIssues: (params) => api.get('/issues', { params }),
  getMyIssues: () => api.get('/issues/my'),
  returnBook: (id) => api.put(`/issues/${id}/return`),
};
