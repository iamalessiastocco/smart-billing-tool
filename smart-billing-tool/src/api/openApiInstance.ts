import axios from 'axios';

// Creiamo un'istanza riutilizzabile di Axios
const openApiInstance = axios.create({
  // Prende l'URL dal file .env (es. https://test.invoice.openapi.com)
  baseURL: import.meta.env.VITE_OPENAPI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Aggiungiamo un "Interceptor" per inserire il Token automaticamente
openApiInstance.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_OPENAPI_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default openApiInstance;