// client/src/services/api.js

import axios from 'axios';

// IMPORTANT: Change this base URL to your final Render/hosting URL
// For now, use the local Flask port
const API_URL = 'http://localhost:5000'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Har request se pehle token attach karega
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Authentication Functions ---

export const registerUser = (userData) => 
  api.post('/auth/register', userData);

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  
  if (response.data.token) {
    // Token aur role ko local storage mein store karna
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('role', response.data.role);
    localStorage.setItem('user_identity', response.data.user_identity);
  }
  return response.data;
};

// --- Record Handling Functions ---

// Doctor function: New record upload karna
export const uploadRecord = (recordData) => 
  api.post('/records/upload', recordData);

// Patient function: Apni history dekhna
export const getMyHistory = () => 
  api.get('/records/my-history');

// Doctor function: Kisi aur patient ki history dekhna
export const getPatientHistory = (patientId) => 
  api.get(`/records/patient-history/${patientId}`);