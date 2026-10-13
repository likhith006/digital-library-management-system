import api from './api';

export const settingService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settingsData) => api.put('/settings', settingsData),
};
