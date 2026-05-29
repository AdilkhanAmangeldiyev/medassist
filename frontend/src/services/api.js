import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/auth/refresh`, { refresh_token: refresh });
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// --- auth ---
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// --- doctors ---
export const doctorsApi = {
  list: (specialty) => api.get('/doctors', { params: specialty ? { specialty } : {} }),
  get: (id) => api.get(`/doctors/${id}`),
  slots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
};

// --- appointments ---
export const appointmentsApi = {
  book: (data) => api.post('/appointments', data),
  my: () => api.get('/appointments/my'),
  update: (id, status) => api.patch(`/appointments/${id}`, { status }),
};

// --- ai ---
export const aiApi = {
  chat: (messages) => api.post('/ai/chat', { messages }),
};

// --- patient profiles ---
export const patientsApi = {
  getProfile: ()       => api.get('/patients/profile'),
  updateProfile: (data) => api.put('/patients/profile', data),
  getDoctorView: (id)  => api.get(`/patients/${id}/profile`),
};

// --- stats ---
export const statsApi = {
  get: () => api.get('/stats'),
};
