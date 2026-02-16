import { ref } from 'vue';
import openApiInstance from '@/api/openApiInstance';
import type { CompanyData, OpenApiResponse } from '@/types';

export function useCompany() {
  const company = ref<CompanyData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const searchCompany = async (vatNumber: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Chiamata all'endpoint IT-advanced (Pacchetto 3)
      const response = await openApiInstance.get<OpenApiResponse<CompanyData>>(
        `/it/company/advanced/${vatNumber}`
      );

      const data = response.data.data;

      // Logica di Validazione: Check se l'azienda è attiva
      if (data.status !== 'ACTIVE') {
        error.value = "Attenzione: L'azienda non risulta attiva. Fatturazione non consigliata.";
      }

      // Risk Check: Se lo score è troppo basso (logica custom)
      if (data.financial_score === 'D') {
        error.value = "Rischio finanziario elevato (Score D). Verificare prima di procedere.";
      }

      company.value = data;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Errore durante la ricerca della P.IVA.";
      company.value = null;
    } finally {
      loading.value = false;
    }
  };

  return {
    company,
    loading,
    error,
    searchCompany
  };
}