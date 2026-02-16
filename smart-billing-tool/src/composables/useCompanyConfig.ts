// src/composables/useCompanyConfig.ts
import { ref } from 'vue';
import { invoiceApiInstance } from '@/api/openApiInstance';
import type { CompanyData } from '@/types';

export function useCompanyConfig() {
  const myCompany = ref<CompanyData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const createCompanyConfig = async (configData: Partial<CompanyData>) => {
    loading.value = true;
    error.value = null;

    try {
      // Validazione
      if (!configData.name || !configData.vat_number || !configData.fiscal_id || !configData.email) {
        throw new Error('Campi obbligatori mancanti: name, fiscal_id, vat_number, email');
      }

      // Payload CORRETTO secondo la documentazione
      const payload = {
        // OBBLIGATORI
        fiscal_id: configData.fiscal_id,
        name: configData.name,
        email: configData.email,
        
        // OPZIONALI
        receipts: true,              // Per abilitare gli scontrini
        customer_invoice: true,      // Per abilitare le fatture
        supplier_invoice: false      // Non riceviamo fatture fornitori
      };

      // Aggiungi receipts_authentication solo se fornito
      if (configData.receipts_auth) {
        payload.receipts_authentication = {
          taxCode: configData.receipts_auth.taxCode,
          password: configData.receipts_auth.password,
          pin: configData.receipts_auth.pin
        };
      }

      console.log('📤 Payload POST /IT-configurations:', JSON.stringify(payload, null, 2));

      const response = await invoiceApiInstance.post(
        '/IT-configurations',
        payload
      );

      console.log('✅ SUCCESS! Risposta:', response.data);
      
      myCompany.value = {
        vat_number: configData.vat_number,
        fiscal_id: configData.fiscal_id,
        name: configData.name,
        email: configData.email,
        address: configData.address || {
          street: '',
          city: '',
          zip: '',
          province: '',
          country: 'IT'
        },
        sdi_code: configData.sdi_code,
        pec: configData.pec,
        status: 'ACTIVE'
      };
      
      return myCompany.value;
    } catch (err: any) {
      console.error('❌ ERRORE:', {
        status: err.response?.status,
        data: err.response?.data
      });
      
      error.value = err.response?.data?.message || err.message || "Errore durante la configurazione";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    myCompany,
    loading,
    error,
    createCompanyConfig
  };
}