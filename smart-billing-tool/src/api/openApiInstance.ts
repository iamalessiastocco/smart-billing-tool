// src/api/openApiInstance.ts
import axios from 'axios';

// Istanza per Company API
export const companyApiInstance = axios.create({
  baseURL: '/api/company',  // ← USA IL PROXY
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000
});

// Istanza per Invoice API
export const invoiceApiInstance = axios.create({
  baseURL: '/api/invoice',  // ← USA IL PROXY
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000
});

// Token
const getAuthToken = () => {
  const token = import.meta.env.VITE_OPENAPI_TOKEN;
  if (!token) {
    console.error('⚠️ VITE_OPENAPI_TOKEN non configurato!');
  }
  return token;
};

// Interceptor Company API
companyApiInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📡 Company API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

companyApiInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Company API Response:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ Company API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Interceptor Invoice API
invoiceApiInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📡 Invoice API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

invoiceApiInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Invoice API Response:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ Invoice API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default invoiceApiInstance;