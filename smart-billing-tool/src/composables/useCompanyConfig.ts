// src/composables/useCompanyConfig.ts
import { ref, computed } from 'vue'
import { invoiceApiInstance } from '@/api/openApiInstance'
import { useBillingStore } from '@/stores/billingStore'
import type { CompanyConfig, CompanyData } from '@/types'

export function useCompanyConfig() {
  const store = useBillingStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // exposes the current company from the store so consumers can watch it
  const myCompany = computed(() => store.myCompany)

  // 🆕 FUNZIONE DEBUG: Verifica cosa è salvato
  const debugExistingConfig = async (identifier: string) => {
    console.log('🔍 DEBUG: Tentativo ricerca configurazione con:', identifier)
    
    try {
      // Prova con fiscal_id
      const responseFiscal = await invoiceApiInstance.get(`/IT-configurations/${identifier}`)
      console.log('✅ Trovato con fiscal_id:', responseFiscal.data)
      return { found: true, data: responseFiscal.data, usedKey: 'fiscal_id' }
    } catch (fiscalError: any) {
      console.log('❌ Non trovato con fiscal_id:', fiscalError.response?.status)
      
      // Se fiscal_id fallisce, prova a cercare con vat_number
      // (alcuni sistemi usano P.IVA come chiave primaria)
      try {
        const responseVat = await invoiceApiInstance.get(`/IT-configurations/${identifier}`)
        console.log('✅ Trovato con vat_number:', responseVat.data)
        return { found: true, data: responseVat.data, usedKey: 'vat_number' }
      } catch (vatError: any) {
        console.log('❌ Non trovato con vat_number:', vatError.response?.status)
        return { found: false, error: 'Configurazione non trovata' }
      }
    }
  }

  // 🔧 REGISTRAZIONE MIGLIORATA
  const createCompanyConfig = async (
    config: Partial<CompanyConfig>
  ): Promise<{
    success: boolean
    data?: CompanyData
    wasExisting?: boolean
    message?: string
    error?: string
  }> => {
    loading.value = true
    error.value = null

    try {
      console.log('📤 Invio configurazione:', config)
      
      const response = await invoiceApiInstance.post('/IT-configurations', config)
      
      console.log('✅ Risposta API registrazione:', response.data)
      console.log('📋 Status:', response.status)
      console.log('📋 Headers:', response.headers)
      
      // ⚠️ IMPORTANTE: Verifica quale ID restituisce l'API
      const savedConfig = response.data
      
      // Salva la configurazione completa (assumiamo che l'API ritorni un oggetto conforme a CompanyData)
      const company: CompanyData = savedConfig
      store.setMyCompany(company)
      saveSession(company)
      
      // 🆕 Mostra quale chiave usare per il login
      console.log('🔑 Usa questa chiave per il login:', company.fiscal_id || company.vat_number)
      
      return { success: true, data: company }
    } catch (err: any) {
      console.error('❌ Errore registrazione completo:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      })
      
      const status = err.response?.status
      const errorData = err.response?.data
      
      // 🆕 GESTIONE ERRORE 410 GONE (fiscal_id già esistente)
      if (status === 410 || (status === 400 && errorData?.message?.includes('already exists'))) {
        console.log('⚠️ 410 Gone: Configurazione già esistente')
        console.log('🔄 Tento il login automatico con il fiscal_id fornito...')
        
        // Prova a fare login automaticamente
        const loginResult = await loginWithFiscalId(
          config.fiscal_id || config.vat_number || ''
        )
        
        if (loginResult.success && loginResult.data) {
          console.log('✅ Login automatico riuscito!')
          return {
            success: true,
            data: loginResult.data,
            wasExisting: true,
            message: 'Azienda già registrata. Accesso effettuato.'
          }
        } else {
          // Se il login fallisce, mostra un messaggio più chiaro
          error.value =
            'Questa azienda è già stata registrata ma non riesco a recuperare i dati. Contatta il supporto.'
          return { success: false, error: error.value ?? undefined }
        }
      }
      
      // Gestione altri errori
      if (status === 409 || status === 400) {
        console.log('⚠️ Configurazione già esistente (409/400), tentativo recupero...')
        const debugResult = await debugExistingConfig(config.fiscal_id || config.vat_number || '')
        
        if (debugResult.found) {
          console.log('✅ Configurazione recuperata:', debugResult.data)
          store.setMyCompany(debugResult.data)
          saveSession(debugResult.data)
          return { success: true, data: debugResult.data, wasExisting: true }
        }
      }
      
      error.value = errorData?.message || 'Errore durante la registrazione'
      return { success: false, error: error.value ?? undefined }
    } finally {
      loading.value = false
    }
  }

  // 🔧 LOGIN MIGLIORATO - STRATEGIA ALTERNATIVA
  const loginWithFiscalId = async (
    fiscalId: string
  ): Promise<{
    success: boolean
    data?: CompanyData
    error?: string
  }> => {
    loading.value = true
    error.value = null

    try {
      console.log('🔐 Tentativo login con fiscal_id:', fiscalId)
      
      // STRATEGIA 1: Prova GET senza fiscal_id nell'URL
      console.log('📋 Strategia 1: GET /IT-configurations (lista completa)')
      try {
        const listResponse = await invoiceApiInstance.get('/IT-configurations')
        console.log('✅ Lista configurazioni ricevuta:', listResponse.data)
        
        // 🆕 MOSTRA TUTTI I FISCAL_ID DISPONIBILI
        const configs = Array.isArray(listResponse.data.data) ? listResponse.data.data : 
                       Array.isArray(listResponse.data) ? listResponse.data : [listResponse.data]
        
        console.log('📋 Numero configurazioni trovate:', configs.length)
        console.log('🔑 Fiscal IDs disponibili:', configs.map((c: any) => ({
          fiscal_id: c.fiscal_id,
          vat_number: c.vat_number,
          name: c.name
        })))
        
        // Se l'API restituisce un array, cerca la configurazione con il fiscal_id corretto
        const myConfig = configs.find((c: any) => 
          c.fiscal_id === fiscalId || c.vat_number === fiscalId
        )
        
        if (myConfig) {
          console.log('✅ Configurazione trovata nella lista:', myConfig)
          store.setMyCompany(myConfig)
          saveSession(myConfig)
          return { success: true, data: myConfig }
        } else {
          console.log('⚠️ Fiscal ID "' + fiscalId + '" non trovato nella lista')
          console.log('💡 Verifica che il fiscal_id corrisponda a uno di quelli sopra')
        }
      } catch (listError: any) {
        console.log('❌ Strategia 1 fallita:', listError.response?.status)
      }
      
      // STRATEGIA 2: Prova GET con query parameter
      console.log('📋 Strategia 2: GET /IT-configurations?fiscal_id=' + fiscalId)
      try {
        const queryResponse = await invoiceApiInstance.get('/IT-configurations', {
          params: { fiscal_id: fiscalId }
        })
        console.log('✅ Configurazione trovata con query param:', queryResponse.data)
        
        // 🆕 Gestisci il caso in cui restituisca un array
        let configData = queryResponse.data
        if (configData.data && Array.isArray(configData.data)) {
          console.log('📋 API restituisce array, prendo il primo elemento')
          configData = configData.data[0]
        } else if (Array.isArray(configData)) {
          configData = configData[0]
        }
        
        if (configData && configData.fiscal_id) {
          const company: CompanyData = configData
          store.setMyCompany(company)
          saveSession(company)
          return { success: true, data: company }
        } else {
          console.log('⚠️ Nessuna configurazione valida trovata con query param')
        }
      } catch (queryError: any) {
        console.log('❌ Strategia 2 fallita:', queryError.response?.status)
      }
      
      // STRATEGIA 3: Prova endpoint alternativo suggerito nell'errore
      console.log('📋 Strategia 3: Verifica se c\'è un endpoint di login separato')
      try {
        const loginResponse = await invoiceApiInstance.post('/IT-configurations/login', {
          fiscal_id: fiscalId
        })
        console.log('✅ Login riuscito con endpoint separato:', loginResponse.data)
        const company: CompanyData = loginResponse.data
        store.setMyCompany(company)
        saveSession(company)
        return { success: true, data: company }
      } catch (loginError: any) {
        console.log('❌ Strategia 3 fallita:', loginError.response?.status)
      }
      
      // Se tutto fallisce
      throw new Error('Tutte le strategie di login sono fallite')
      
    } catch (err: any) {
      console.error('❌ Errore login generale:', err)
      
      error.value = 'Non riesco a recuperare la configurazione. L\'azienda potrebbe non essere ancora registrata correttamente.'
      
      return { success: false, error: error.value ?? undefined }
    } finally {
      loading.value = false
    }
  }

  // 🆕 FUNZIONE PER TESTARE TOKEN
  const testTokenPermissions = async () => {
    console.log('🔐 Test permessi token...')
    
    const tests = [
      { name: 'Company API - IT-advanced', call: () => invoiceApiInstance.get('/IT-advanced/12345678901') },
      { name: 'Invoice API - IT-configurations', call: () => invoiceApiInstance.get('/IT-configurations') },
      { name: 'Invoice API - IT-receipts (test payload)', call: () => 
        invoiceApiInstance.post('/IT-receipts', {
          fiscal_id: 'TEST123',
          items: [{ quantity: 1, description: 'Test', unit_price: 1, vat_rate_code: 22 }],
          cash_payment_amount: 1
        })
      }
    ]
    
    const results = []
    for (const test of tests) {
      try {
        await test.call()
        results.push({ test: test.name, status: '✅ Permesso OK' })
        console.log(`✅ ${test.name}: OK`)
      } catch (err: any) {
        const status = err.response?.status || 'Network Error'
        results.push({ test: test.name, status: `❌ ${status}` })
        console.log(`❌ ${test.name}: ${status}`, err.response?.data)
      }
    }
    
    return results
  }

  // Session management
  const saveSession = (config: CompanyData) => {
    localStorage.setItem('my_company_session', JSON.stringify(config))
  }

  const loadSession = () => {
    const saved = localStorage.getItem('my_company_session')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        store.setMyCompany(config)
        console.log('✅ Sessione caricata:', config.fiscal_id || config.vat_number)
      } catch (err) {
        console.error('❌ Errore parsing sessione:', err)
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('my_company_session')
    store.logout()
    console.log('👋 Logout effettuato')
  }

  return {
    myCompany,
    loading,
    error,
    createCompanyConfig,
    loginWithFiscalId,
    debugExistingConfig,
    testTokenPermissions,
    saveSession,
    loadSession,
    logout
  }
}