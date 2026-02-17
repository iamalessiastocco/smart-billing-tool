import axios from 'axios'

// Istanza per Company API
export const companyApiInstance = axios.create({
  baseURL: '/api/company',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Istanza per Invoice API
export const invoiceApiInstance = axios.create({
  baseURL: '/api/invoice',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor: Aggiungi token a tutte le richieste
const addTokenInterceptor = (instance: any) => {
  instance.interceptors.request.use(
    (config: any) => {
      const token = import.meta.env.VITE_OPENAPI_TOKEN

      if (token) {
        // OpenAPI usa Bearer token standard OAuth 2.0
        config.headers.Authorization = `Bearer ${token}`
        console.log('[TOKEN] Aggiunto alla richiesta:', config.url)
        console.log('[TOKEN] Header Authorization:', config.headers.Authorization)
      } else {
        console.error('[ERROR] Token non trovato in .env!')
      }

      return config
    },
    (error: any) => {
      return Promise.reject(error)
    }
  )
  
  // Interceptor response: Log degli errori
  instance.interceptors.response.use(
    (response: any) => {
      console.log('[SUCCESS] Risposta ricevuta:', response.config.url, response.status)
      return response
    },
    (error: any) => {
      console.error('[API ERROR]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      })
      return Promise.reject(error)
    }
  )
}

// Applica interceptor a entrambe le istanze
addTokenInterceptor(companyApiInstance)
addTokenInterceptor(invoiceApiInstance)