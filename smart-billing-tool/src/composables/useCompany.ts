// src/composables/useCompany.ts
import { ref } from 'vue';
import { companyApiInstance } from '@/api/openApiInstance'; // CAMBIATO QUI
import type { CompanyData, OpenApiResponse, OpenApiCompanyResponse } from '@/types';

export function useCompany() {
  const company = ref<CompanyData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const mapApiResponseToCompanyData = (apiData: OpenApiCompanyResponse): CompanyData => {
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
      financial_score: undefined
    };
  };

  const searchCompany = async (vatNumber: string) => {
    loading.value = true;
    error.value = null;

    try {
      // Usa IT-advanced per ricerca aziende (Company API - Pacchetto 3)
      const response = await companyApiInstance.get<OpenApiResponse<OpenApiCompanyResponse[]>>(
        `/IT-advanced/${vatNumber}`
      );

      const apiData = response.data.data[0];

      if (!apiData) {
        error.value = "Nessuna azienda trovata con questa Partita IVA.";
        company.value = null;
        return;
      }

      const data = mapApiResponseToCompanyData(apiData);

      if (data.status !== 'ACTIVE') {
        error.value = "Attenzione: L'azienda non risulta attiva. Fatturazione non consigliata.";
      }

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