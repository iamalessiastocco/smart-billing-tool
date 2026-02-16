import { ref } from 'vue';
import openApiInstance from '@/api/openApiInstance';
import type { CompanyData, OpenApiResponse, OpenApiCompanyResponse } from '@/types';

export function useCompany() {
  const company = ref<CompanyData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Funzione per mappare la risposta API al formato interno
  const mapApiResponseToCompanyData = (apiData: OpenApiCompanyResponse): CompanyData => {
    // Mappa lo stato dell'attività
    let status: 'ACTIVE' | 'INACTIVE' | 'CEASED' = 'INACTIVE';
    if (apiData.activityStatus === 'ATTIVA') {
      status = 'ACTIVE';
    } else if (apiData.activityStatus === 'CESSATA') {
      status = 'CEASED';
    }

    return {
      vat_number: apiData.vatCode,
      fiscal_id: apiData.taxCode,
      name: apiData.companyName,
      address: {
        street: `${apiData.address.registeredOffice.toponym || ''} ${apiData.address.registeredOffice.street} ${apiData.address.registeredOffice.streetNumber || ''}`.trim(),
        city: apiData.address.registeredOffice.town,
        zip: apiData.address.registeredOffice.zipCode,
        province: apiData.address.registeredOffice.province,
        country: 'IT'
      },
      pec: apiData.pec,
      sdi_code: apiData.sdiCode,
      status: status,
      financial_score: undefined // L'API non fornisce questo campo nel pacchetto base
    };
  };

  const searchCompany = async (vatNumber: string) => {
    loading.value = true;
    error.value = null;

    try {
      // Chiamata all'endpoint IT-advanced (Pacchetto 3)
      const response = await openApiInstance.get<OpenApiResponse<OpenApiCompanyResponse[]>>(
        `/IT-advanced/${vatNumber}`
      );

      // L'API restituisce un array, prendiamo il primo elemento
      const apiData = response.data.data[0];

      if (!apiData) {
        error.value = "Nessuna azienda trovata con questa Partita IVA.";
        company.value = null;
        return;
      }

      // Mappiamo i dati al formato interno
      const data = mapApiResponseToCompanyData(apiData);

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