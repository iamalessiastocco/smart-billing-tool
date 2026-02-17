import { ref } from 'vue'
import { invoiceApiInstance } from '@/api/openApiInstance'
import { useBillingStore } from '@/stores/billingStore'

export function useReceipt() {
  const store = useBillingStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const createReceipt = async (receiptData: any) => {
    loading.value = true
    error.value = null

    try {
      if (!store.myCompany?.fiscal_id) {
        throw new Error('Azienda non configurata. Fiscal ID mancante.')
      }

      console.log('=== INIZIO PREPARAZIONE SCONTRINO ===')
      console.log('My Company:', store.myCompany)
      console.log('Receipt Data ricevuto:', receiptData)

      // Trasforma gli items con log dettagliato
      const items = receiptData.items.map((item: any, index: number) => {
        console.log(`--- Item ${index} RAW ---`)
        console.log('description:', item.description)
        console.log('quantity:', item.quantity, 'type:', typeof item.quantity)
        console.log('unit_price:', item.unit_price, 'type:', typeof item.unit_price)
        console.log('vat_rate_code:', item.vat_rate_code, 'type:', typeof item.vat_rate_code)
        
        const transformed = {
          quantity: Number(item.quantity),
          description: String(item.description).trim(),
          unit_price: Number(item.unit_price),
          vat_rate_code: String(item.vat_rate_code)
        }
        
        console.log(`--- Item ${index} TRANSFORMED ---`, transformed)
        return transformed
      })

      console.log('=== Items finali ===', items)

      const payload = {
        fiscal_id: store.myCompany.fiscal_id,
        items: items,
        cash_payment_amount: receiptData.cash_payment_amount || 0,
        ...(receiptData.card_payment_amount && { card_payment_amount: receiptData.card_payment_amount })
      }

      console.log('=== PAYLOAD FINALE COMPLETO ===')
      console.log(JSON.stringify(payload, null, 2))

      const response = await invoiceApiInstance.post('/IT-receipts', payload)
      console.log('SUCCESS! Scontrino creato:', response.data)
      
      return { success: true, data: response.data }
    } catch (err: any) {
      console.error('ERROR! Creazione scontrino fallita:', err.response?.data || err.message)

      if (err.response?.status === 422) {
        error.value = `Validazione fallita: ${err.response?.data?.message || 'Dati non validi'}`
      } else if (err.response?.data?.message) {
        error.value = err.response.data.message
      } else {
        error.value = err.message || 'Errore durante la creazione dello scontrino'
      }

      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const testReceiptConfiguration = async () => {
    if (!store.myCompany) {
      console.error('ERROR: myCompany non configurata')
      return false
    }

    console.log('Dati azienda:', store.myCompany)
    return true
  }

  return {
    loading,
    error,
    createReceipt,
    testReceiptConfiguration
  }
}
