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
  receipts?: boolean;            // se l'azienda può emettere scontrini
  customer_invoice?: boolean;    // autorizzazione alla fatturazione verso cliente
  receipts_auth?: {           // ← AGGIUNTO (opzionale)
    taxCode: string;
    password: string;
    pin: string;
  };
}

// Configurazione richiesta durante la registrazione o il login
export interface CompanyConfig {
  vat_number: string;
  fiscal_id: string;
  name: string;
  email: string;
  receipts?: boolean          
  customer_invoice?: boolean
  address?: {
    street?: string;
    city?: string;
    zip?: string;
    province?: string;
    country?: string;
  };
  sdi_code?: string;
  pec?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'CEASED';
}

// Struttura della risposta tipica di OpenAPI
export interface OpenApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  error: any;
}

export interface CompanySearchResult {
  vat_number: string
  fiscal_id?: string
  name: string
  address?: string
  city?: string
  province?: string
  zip_code?: string
  country?: string
  pec?: string
  sdi_code?: string
  status?: string
  activity_status?: boolean
}

export interface ReceiptItem {
  quantity: number
  description: string
  unit_price: number
  vat_rate_code: number | string // Può essere 22 o "N1"
}

export interface Receipt {
  fiscal_id: string
  items: ReceiptItem[]
  cash_payment_amount?: number
  card_payment_amount?: number
  lottery_code?: string
}

export interface Invoice {
  fiscal_id: string
  customer_fiscal_id: string
  customer_name: string
  customer_address?: string
  items: ReceiptItem[]
  payment_method?: string
  payment_amount?: number
}