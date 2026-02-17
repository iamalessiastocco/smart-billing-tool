# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Billing Tool - an Italian billing and invoicing automation system that integrates with OpenAPI to:
1. Validate company data via P.IVA lookup (IT-advanced package)
2. Generate and send electronic invoices to Sistema di Interscambio (SDI)
3. Issue fiscal receipts (scontrini) through IT-receipts API

**Tech Stack**: Vue 3 (beta), TypeScript, Vite, Pinia, Axios, Vitest

**Node Version**: ^20.19.0 || >=22.12.0

## Development Commands

```bash
# IMPORTANT: Always run commands from smart-billing-tool/smart-billing-tool directory
cd smart-billing-tool/smart-billing-tool

# Development server
npm run dev

# Build for production
npm run build

# Type checking only
npm run type-check

# Build without type checking
npm run build-only

# Preview production build
npm run preview

# Run unit tests (Vitest)
npm run test:unit

# Run tests in watch mode
vitest --watch

# Run specific test file
vitest path/to/test.spec.ts
```

## Environment Configuration

Required environment variables in `.env`:
```
VITE_OPENAPI_TOKEN=<your-token>
VITE_OPENAPI_COMPANY_URL=https://test.company.openapi.com
VITE_OPENAPI_INVOICE_URL=https://test.invoice.openapi.com
```

## Architecture

### API Integration Pattern

Two separate axios instances configured with Vite proxy:

- **companyApiInstance**: `/api/company` → proxied to `test.company.openapi.com`
  - Used for: IT-configuration endpoint (company validation/search)

- **invoiceApiInstance**: `/api/invoice` → proxied to `test.invoice.openapi.com`
  - Used for: IT-receipts and IT-configurations endpoints

Both instances automatically inject Bearer token via request interceptors defined in [src/api/openApiInstance.ts](src/api/openApiInstance.ts).

**Proxy configuration**: [vite.config.ts:18-30](vite.config.ts#L18-L30)

### Composables Pattern

Business logic is encapsulated in composables (Composition API):

- **useCompany**: Company search and validation
  - Fetches company data by P.IVA
  - Maps OpenAPI response to internal CompanyData format
  - Validates company status (ACTIVE/CEASED)

- **useCompanyConfig**: Company configuration during signup/login
  - GET `/IT-configurations/{fiscal_id}` - retrieve stored config
  - POST `/IT-configurations` - save company configuration

- **useReceipt**: Fiscal receipt generation
  - POST `/IT-receipts` - issue electronic receipts
  - Validates and transforms receipt items (quantity, description, unit_price, vat_rate_code)

All composables return reactive refs for `loading`, `error`, and data states.

### State Management (Pinia)

**billingStore** ([src/stores/billingStore.ts](src/stores/billingStore.ts)):
- `myCompany`: Current user's company (sender)
- `selectedCompany`: Customer company (recipient)
- `isConfigured`: Computed - whether myCompany is set
- `canInvoice`: Computed - checks both companies exist and customer is ACTIVE
- `setMyCompany()`, `setCompany()`, `clearStore()`, `logout()`

### Type System

Core types in [src/types/index.ts](src/types/index.ts):

- **CompanyData**: Internal company representation with Italian fiscal fields
  - `vat_number`, `fiscal_id`, `name`, `email`
  - `address`, `pec`, `sdi_code`
  - `status: 'ACTIVE' | 'INACTIVE' | 'CEASED'`
  - `receipts`, `customer_invoice` - capability flags
  - `receipts_auth` - credentials for receipt issuance

- **OpenApiCompanyResponse**: Raw API response structure (different field names)
  - Maps `vatCode` → `vat_number`, `taxCode` → `fiscal_id`, etc.

- **Receipt**: Fiscal receipt payload structure
- **Invoice**: Electronic invoice payload structure
- **ReceiptItem**: Line item with quantity, description, unit_price, vat_rate_code

### Routing

Simple router with 2 main routes:
- `/` → companySearch.vue (company lookup)
- `/checkout` → invoiceGenerator.vue (invoice creation)

Additional view: CompanySetup.vue (registration/login flow)

### Path Alias

`@` is aliased to `./src` in [vite.config.ts:14](vite.config.ts#L14)

## Key Patterns

1. **API Response Mapping**: Always map OpenAPI responses to internal types in composables (e.g., `mapApiResponseToCompanyData`)

2. **Error Handling**: Composables set `error.value` with user-friendly Italian messages, never throw

3. **Loading States**: All async operations use `loading.value = true/false` pattern

4. **Store Access**: Views use `useBillingStore()` directly; composables may use it for context (like fiscal_id)

5. **Italian Business Logic**:
   - P.IVA (Partita IVA) = VAT number
   - Codice Fiscale = fiscal_id/taxCode
   - PEC = certified email
   - SDI Code = electronic invoice routing code
   - Activity status mapping: "ATTIVA" → ACTIVE, "CESSATA" → CEASED

## Testing

- Framework: Vitest with jsdom environment
- Test files: `*.spec.ts` in `__tests__` directories (if present)
- Configuration: [vitest.config.ts](vitest.config.ts)

## Notes on Vue Beta

Project uses Vue beta channel (Vue 3.x pre-release). All Vue packages are overridden to beta in [package.json:37-51](package.json#L37-L51).
