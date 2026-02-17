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

// 🔧 INTERCEPTOR: Aggiungi token a tutte le richieste
const addTokenInterceptor = (instance: any) => {
  instance.interceptors.request.use(
    (config: any) => {
      const token = import.meta.env.VITE_OPENAPI_TOKEN
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('🔑 Token aggiunto alla richiesta:', config.url)
        console.log('📋 Authorization header:', config.headers.Authorization?.substring(0, 20) + '...')
      } else {
        console.error('❌ ATTENZIONE: Token non trovato in .env!')
      }
      
      return config
    },
    (error: any) => {
      return Promise.reject(error)
    }
  )
  
  // 🆕 INTERCEPTOR RESPONSE: Log degli errori
  instance.interceptors.response.use(
    (response: any) => {
      console.log('✅ Risposta ricevuta:', response.config.url, response.status)
      return response
    },
    (error: any) => {
      console.error('❌ Errore API:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.config?.headers
      })
      return Promise.reject(error)
    }
  )
}

// Applica interceptor a entrambe le istanze
addTokenInterceptor(companyApiInstance)
addTokenInterceptor(invoiceApiInstance)