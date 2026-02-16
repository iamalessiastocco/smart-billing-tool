// src/composables/useCompanyConfig.ts
import { ref } from 'vue';
import { invoiceApiInstance } from '@/api/openApiInstance';
import type { CompanyData } from '@/types';

const STORAGE_KEY = 'my_company_session';

export function useCompanyConfig() {
  const myCompany = ref<CompanyData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Carica la sessione salvata
  const loadSession = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        myCompany.value = JSON.parse(saved);
        console.log('🔄 Sessione caricata:', myCompany.value?.name);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Errore caricamento sessione:', err);
      return false;
    }
  };

  // Salva la sessione
  const saveSession = (company: CompanyData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
      console.log('💾 Sessione salvata:', company.name);
    } catch (err) {
      console.error('Errore salvataggio sessione:', err);
    }
  };

  // Logout - cancella la sessione
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    myCompany.value = null;
    console.log('🚪 Logout effettuato');
  };

  // Crea nuova configurazione (SIGN UP)
  const createCompanyConfig = async (configData: Partial<CompanyData>) => {
    loading.value = true;
    error.value = null;

    try {
      if (!configData.name || !configData.vat_number || !configData.fiscal_id || !configData.email) {
        throw new Error('Campi obbligatori mancanti');
      }

      const payload = {
        fiscal_id: configData.fiscal_id,
        name: configData.name,
        email: configData.email,
        receipts: true,
        customer_invoice: true
      };

      console.log('📤 Sign up con:', payload);

      const response = await invoiceApiInstance.post(
        '/IT-configurations',
        payload
      );

      console.log('✅ Configurazione creata!', response.data);
      
      const companyData: CompanyData = {
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

      myCompany.value = companyData;
      saveSession(companyData); // ← SALVA LA SESSIONE
      
      return companyData;
    } catch (err: any) {
      console.error('❌ Errore sign up:', err.response?.data);
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Verifica se esiste già (LOGIN)
  const loginWithVat = async (vatNumber: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await invoiceApiInstance.get(
        `/IT-configurations/${vatNumber}`
      );

      console.log('✅ Login riuscito!', response.data);

      const apiData = response.data.data;
      const companyData: CompanyData = {
        vat_number: vatNumber,
        fiscal_id: apiData.fiscal_id,
        name: apiData.name,
        email: apiData.email,
        address: {
          street: '',
          city: '',
          zip: '',
          province: '',
          country: 'IT'
        },
        status: 'ACTIVE'
      };

      myCompany.value = companyData;
      saveSession(companyData); // ← SALVA LA SESSIONE
      
      return companyData;
    } catch (err: any) {
      if (err.response?.status === 404) {
        error.value = "P.IVA non trovata. Devi registrarti prima.";
      } else {
        error.value = err.response?.data?.message || "Errore durante il login";
      }
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Carica automaticamente la sessione all'avvio
  loadSession();

  return {
    myCompany,
    loading,
    error,
    createCompanyConfig,
    loginWithVat,
    logout,
    loadSession
  };
}