import axios from 'axios';

// Central Axios instance — point VITE_API_BASE_URL at your backend once one exists.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

// Example future endpoints once a backend/lead-storage destination is wired up:
// export const submitLead = (payload) => api.post('/leads', payload);
// export const submitContactMessage = (payload) => api.post('/contact', payload);

export default api;
