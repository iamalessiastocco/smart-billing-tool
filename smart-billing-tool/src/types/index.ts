// Struttura della risposta dell'API OpenAPI IT-advanced
export interface OpenApiCompanyResponse {
  taxCode: string;
  vatCode: string;
  companyName: string;
  address: {
    registeredOffice: {
      toponym?: string;
      street: string;
      streetNumber?: string;
      town: string;
      province: string;
      zipCode: string;
      region?: {
        code: string;
        description: string;
      };
    };
  };
  pec?: string;
  sdiCode?: string;
  activityStatus: string; // "ATTIVA", "CESSATA", etc.
  balanceSheets?: {
    last?: {
      year: number;
      turnover?: number;
      netWorth?: number;
    };
  };
}

// src/types/index.ts
export interface CompanyData {
  vat_number: string;
  fiscal_id: string;
  name: string;
  email: string;               // ← AGGIUNTO
  address?: {
    street: string;
    city: string;
    zip: string;
    province: string;
    country: string;
  };
  pec?: string;
  sdi_code?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CEASED';
  financial_score?: string;
  receipts_auth?: {           // ← AGGIUNTO (opzionale)
    taxCode: string;
    password: string;
    pin: string;
  };
}

// Struttura della risposta tipica di OpenAPI
export interface OpenApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  error: any;
}