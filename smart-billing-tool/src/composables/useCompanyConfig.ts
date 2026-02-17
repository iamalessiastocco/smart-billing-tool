import { ref, computed } from 'vue'
import { invoiceApiInstance } from '@/api/openApiInstance'
import { useBillingStore } from '@/stores/billingStore'
import type { CompanyConfig, CompanyData } from '@/types'

export function useCompanyConfig() {
  const store = useBillingStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const myCompany = computed(() => store.myCompany)

  // Funzione per mappare risposta API a CompanyData
  const mapApiResponseToCompanyData = (apiResponse: any): CompanyData => {
    return {
      vat_number: apiResponse.vat_number || apiResponse.vatNumber || '',
      fiscal_id: apiResponse.fiscal_id || apiResponse.taxCode || '',
      name: apiResponse.name || apiResponse.companyName || '',
      email: apiResponse.email || '',
      address: apiResponse.address ? {
        street: apiResponse.address.street || '',
        city: apiResponse.address.city || '',
        zip: apiResponse.address.zip || apiResponse.address.zipCode || '',
        province: apiResponse.address.province || '',
        country: apiResponse.address.country || 'IT'
      } : undefined,
      pec: apiResponse.pec,
      sdi_code: apiResponse.sdi_code || apiResponse.sdiCode,
      status: apiResponse.status || 'ACTIVE',
      financial_score: apiResponse.financial_score,
      receipts: apiResponse.receipts !== undefined ? apiResponse.receipts : true,
      customer_invoice: apiResponse.customer_invoice !== undefined ? apiResponse.customer_invoice : true
    }
  }

  // REGISTRAZIONE
  const createCompanyConfig = async (config: Partial<CompanyConfig>) => {
    loading.value = true
    error.value = null

    try {
      console.log('[SIGNUP] Invio configurazione:', config)
      
      const response = await invoiceApiInstance.post('/IT-configurations', config)
      
      console.log('[SIGNUP] Risposta API:', response.data)
      
      const apiData = response.data.data || response.data
      const company = mapApiResponseToCompanyData(apiData)
      
      store.setMyCompany(company)
      saveSession(company)
      
      console.log('[SIGNUP] Registrazione completata per:', company.name)
      
      return { success: true, data: company }
    } catch (err: any) {
      const status = err.response?.status
      const errorData = err.response?.data
      
      console.error('[SIGNUP ERROR]', { status, data: errorData })
      
      // Gestione errore 410 Gone (già esistente)
      if (status === 410 || (status === 400 && errorData?.message?.includes('already exists'))) {
        console.log('[SIGNUP] Azienda già registrata, tento login automatico...')
        
        const loginResult = await loginWithFiscalId(config.fiscal_id || config.vat_number || '')
        
        if (loginResult.success && loginResult.data) {
          return {
            success: true,
            data: loginResult.data,
            wasExisting: true,
            message: 'Azienda già registrata. Accesso effettuato.'
          }
        }
      }
      
      error.value = errorData?.message || 'Errore durante la registrazione'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // LOGIN
  const loginWithFiscalId = async (fiscalId: string) => {
    loading.value = true
    error.value = null

    try {
      console.log('[LOGIN] Tentativo con fiscal_id:', fiscalId)
      
      // Strategia 1: GET /IT-configurations (lista completa)
      const listResponse = await invoiceApiInstance.get('/IT-configurations')
      
      const rawData = listResponse.data
      const configs = Array.isArray(rawData.data) ? rawData.data : 
                     Array.isArray(rawData) ? rawData : [rawData]
      
      console.log('[LOGIN] Configurazioni trovate:', configs.length)
      console.log('[LOGIN] Fiscal IDs disponibili:', configs.map((c: any) => c.fiscal_id || c.vat_number))
      
      // Cerca la configurazione con fiscal_id o vat_number corrispondente
      const apiConfig = configs.find((c: any) => 
        c.fiscal_id === fiscalId || c.vat_number === fiscalId
      )
      
      if (apiConfig) {
        console.log('[LOGIN] Configurazione trovata:', apiConfig.name)
        const company = mapApiResponseToCompanyData(apiConfig)
        store.setMyCompany(company)
        saveSession(company)
        return { success: true, data: company }
      } else {
        console.log('[LOGIN] Fiscal ID non trovato nella lista')
        error.value = 'Configurazione non trovata. Verifica il Codice Fiscale o registrati.'
        return { success: false, error: error.value }
      }
      
    } catch (err: any) {
      console.error('[LOGIN ERROR]', err.response?.data)
      error.value = 'Errore durante il login. Riprova.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Session management
  const saveSession = (config: CompanyData) => {
    localStorage.setItem('my_company_session', JSON.stringify(config))
    console.log('[SESSION] Salvata per:', config.name)
  }

  const loadSession = () => {
    const saved = localStorage.getItem('my_company_session')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        store.setMyCompany(config)
        console.log('[SESSION] Caricata:', config.name)
      } catch (err) {
        console.error('[SESSION ERROR] Parsing fallito:', err)
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('my_company_session')
    store.logout()
    console.log('[LOGOUT] Effettuato')
  }

  return {
    myCompany,
    loading,
    error,
    createCompanyConfig,
    loginWithFiscalId,
    saveSession,
    loadSession,
    logout
  }
}