// src/composables/useInvoice.ts
import { ref } from 'vue';
import { invoiceApiInstance } from '@/api/openApiInstance'; // CAMBIATO QUI
import { useBillingStore } from '@/stores/billingStore';
import type { OpenApiResponse } from '@/types';

export function useInvoice() {
  const store = useBillingStore();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const invoiceId = ref<string | null>(null);

  const sendInvoice = async (items: any[], payments: any[]) => {
    if (!store.myCompany || !store.selectedCompany || !store.canInvoice) {
      error.value = "Impossibile procedere: configura prima la tua azienda e seleziona un cliente attivo.";
      return;
    }

    loading.value = true;
    error.value = null;

    const payload = {
      sender: {
        fiscal_id: store.myCompany.fiscal_id,
        vat_number: store.myCompany.vat_number,
        company_name: store.myCompany.name,
        address: store.myCompany.address,
        sdi_code: store.myCompany.sdi_code || '',
        pec: store.myCompany.pec || ''
      },
      receiver: {
        fiscal_id: store.selectedCompany.fiscal_id,
        vat_number: store.selectedCompany.vat_number,
        company_name: store.selectedCompany.name,
        address: store.selectedCompany.address,
        sdi_code: store.selectedCompany.sdi_code || '',
        pec: store.selectedCompany.pec || ''
      },
      document: {
        type: 'receipt',
        date: new Date().toISOString().split('T')[0],
        number: `SCT-${Date.now()}`,
        currency: 'EUR'
      },
      items: items,
      payments: payments
    };

    try {
      // CAMBIATO: usa invoiceApiInstance
      const response = await invoiceApiInstance.post<OpenApiResponse<any>>(
        '/IT-invoice', 
        payload
      );

      invoiceId.value = response.data.data?.invoice_id || response.data.data?.id;
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
