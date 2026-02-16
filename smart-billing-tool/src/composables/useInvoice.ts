import { ref } from 'vue';
import openApiInstance from '@/api/openApiInstance';
import { useBillingStore } from '@/stores/billingStore';
import type { OpenApiResponse } from '@/types';

export function useInvoice() {
  const store = useBillingStore();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const invoiceId = ref<string | null>(null);

  const sendInvoice = async (items: any[], payments: any[]) => {
    // Controllo di sicurezza: abbiamo un'azienda valida?
    if (!store.selectedCompany || !store.canInvoice) {
      error.value = "Impossibile procedere: mancano i dati dell'azienda o l'azienda non è attiva.";
      return;
    }

    loading.value = true;
    error.value = null;

    // Costruiamo il payload usando i dati dello Store (Fase 1) e i dati del form (Fase 2)
    const payload = {
      fiscal_id: store.selectedCompany.fiscal_id, // Preso automaticamente dal Pacchetto 3
      date: new Date().toISOString(),
      items: items,
      payments: payments
    };

    try {
      // Invio all'endpoint Invoice di OpenAPI
      const response = await openApiInstance.post<OpenApiResponse<any>>(
        '/IT-receipts', 
        payload
      );

      // Salviamo l'ID ricevuto per il tracking
      invoiceId.value = response.data.data.id;
      return response.data.data;
      
    } catch (err: any) {
      error.value = err.response?.data?.message || "Errore durante l'invio allo SDI.";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    sendInvoice,
    loading,
    error,
    invoiceId
  };
}