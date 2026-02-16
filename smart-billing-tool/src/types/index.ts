// Rappresenta l'azienda che cerchiamo con il Pacchetto 3 (IT-advanced)
export interface CompanyData {
  vat_number: string;
  fiscal_id: string;
  name: string;
  address: {
    street: string;
    city: string;
    zip: string;
    province: string;
    country: string;
  };
  pec?: string;
  sdi_code?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CEASED'; // Per la validazione
  financial_score?: string; // Es. "A-", "B", ecc.
}

// Struttura della risposta tipica di OpenAPI
export interface OpenApiResponse<T> {
  data: T;
  status: number;
}