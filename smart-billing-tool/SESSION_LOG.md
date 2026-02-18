# Session Log - 18 Febbraio 2026

## Contesto
Tool di fatturazione elettronica e scontrini basato su Vue 3 + TypeScript + Vite + Pinia, integrato con le API OpenAPI (sandbox).

---

## Fix 1: Endpoint sbagliato per ricerca aziende (401 Unauthorized)

**File**: `src/composables/useCompany.ts:44`

**Problema**: La ricerca aziende per P.IVA chiamava `/IT-configuration/{vatNumber}` sulla Company API. Questo endpoint non esiste sulla Company API — esiste solo sulla Invoice API per la registrazione/login.

**Causa**: Confusione tra i due endpoint:
- `/IT-configurations` → Invoice API (registrazione/login utente)
- `/IT-advanced` → Company API (ricerca e validazione altre aziende)

**Soluzione**: Cambiato l'endpoint da `/IT-configuration/${vatNumber}` a `/IT-advanced/${vatNumber}`.

---

## Fix 2: Formato header Authorization (401/403)

**File**: `src/api/openApiInstance.ts:27`

**Problema**: L'interceptor Axios aggiungeva il token con formato `Bearer ${token}`, poi era stato erroneamente cambiato in `token ${token}`. L'API OpenAPI in sandbox richiede il formato standard OAuth 2.0.

**Causa**: Il formato corretto (confermato via Postman) è `Bearer <token>`.

**Soluzione**: Ripristinato `config.headers.Authorization = 'Bearer ${token}'`.

---

## Fix 3: vat_rate_code inviato come numero invece che stringa (422 Validation Error)

**File**: `src/composables/useReceipt.ts:35`

**Problema**: L'API IT-receipts restituiva errore 422: `'vat_rate_code' must be one of the allowed values: 4, 5, 10, 22, ...`.

**Causa**: Il codice convertiva `vat_rate_code` in numero (`Number(item.vat_rate_code)`), ma la documentazione OpenAPI richiede il campo come **stringa** (es. `"22"`, non `22`).

**Soluzione**: Cambiato da:
```typescript
vat_rate_code: isNaN(Number(item.vat_rate_code)) ? item.vat_rate_code : Number(item.vat_rate_code)
```
a:
```typescript
vat_rate_code: String(item.vat_rate_code)
```

---

## Fix 4: Sessione persa al refresh della pagina (errore "undefined")

**File**: `src/views/CompanySetup.vue:257, 296`

**Problema**: Dopo un refresh, lo scontrino falliva con `ERROR! Creazione scontrino fallita: undefined`. Il messaggio reale era "Azienda non configurata. Fiscal ID mancante." ma veniva nascosto dall'error handling.

**Causa**: La funzione `loadSession()` (che ripristina i dati azienda da `localStorage`) era definita nel composable `useCompanyConfig` ma **non veniva mai chiamata** nel componente `CompanySetup.vue`. Dopo ogni refresh, `store.myCompany` era `null`.

**Soluzione**:
1. Aggiunto `loadSession` al destructuring del composable
2. Chiamato `loadSession()` nel hook `onMounted()`

---

## Fix 5: Messaggio d'errore nascosto in useReceipt.ts

**File**: `src/composables/useReceipt.ts:59-65`

**Problema**: Il catch block cercava solo `err.response?.data?.message`, ma errori interni (come il `throw new Error(...)` per fiscal_id mancante) non hanno la proprietà `.response`. L'utente vedeva solo "undefined" o un messaggio generico.

**Soluzione**: Aggiunto fallback su `err.message` per catturare anche gli errori non-HTTP:
```typescript
} else {
  error.value = err.message || 'Errore durante la creazione dello scontrino'
}
```

---

## Feature 6: Validazione regex su tutti i campi dei form Login e Signup

**File**: `src/views/CompanySetup.vue`

**Obiettivo**: Prevenire errori di battitura e dati malformati prima dell'invio alle API, con feedback visivo immediato.

**Regex implementate** (con supporto omocodia e sandbox):

Le posizioni normalmente numeriche del CF (6,7,9,10,12,13,14) accettano anche lettere omocodiche (`LMNPQRSTUV`).
La posizione 11 (codice catastale) accetta lettere e cifre per compatibilità sandbox.

| Campo | Pattern | Regola |
|---|---|---|
| CF / P.IVA (login) | `^([A-Z]{6}[oD]{2}[A-Z][oD]{2}[A-Z0-9][oD]{3}[A-Z]\|\d{11})$` | CF 16 chars (con omocodia) o P.IVA 11 cifre |
| Codice Fiscale (signup) | stessa di login | CF o P.IVA |
| Partita IVA | `^\d{11}$` | Esattamente 11 cifre |
| Email / PEC | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` | Formato email standard |
| CF per scontrini (taxCode) | `^[A-Z]{6}[oD]{2}[A-Z][oD]{2}[A-Z0-9][oD]{3}[A-Z]$` | Solo CF 16 chars (con omocodia) |
| PIN AdE | `^\d{8}$` | Esattamente 8 cifre |
| CAP (opzionale) | `^\d{5}$` | 5 cifre |
| Provincia (opzionale) | `^[A-Z]{2}$` | 2 lettere maiuscole |
| Codice SDI (opzionale) | `^[A-Z0-9]{7}$` | 7 caratteri alfanumerici |

> `[oD]` = `[0-9LMNPQRSTUV]` (cifra o lettera omocodica)

**Comportamento**:
- Validazione **on blur** (quando l'utente esce dal campo): bordo rosso + messaggio d'errore sotto il campo
- Validazione **on submit**: blocca l'invio se ci sono errori, mostra messaggio globale
- Campi opzionali (CAP, Provincia, SDI, PEC): validati solo se compilati
- Campi obbligatori senza regex specifica (Ragione Sociale, Password AdE): controllati solo per non-vuoto

**Implementazione**:
- Oggetto `patterns` con tutte le regex (costruite dinamicamente con `new RegExp()` per riuso del pattern omocodico)
- Funzione `validateField(field, value, required)` con switch per campo
- `validateLoginForm()` e `validateSignupForm()` chiamate nei rispettivi handler
- CSS: classe `.input-error` (bordo rosso) e `.field-error` (testo errore rosso)

---

## Fix 7: Supporto omocodia nelle regex del Codice Fiscale

**File**: `src/views/CompanySetup.vue:274-276`, `src/__tests__/validation.test.ts:6-8`

**Problema**: Il CF sandbox `RSSMRA67B8N5458J` veniva rifiutato dalla validazione. La regex originale accettava solo cifre nelle posizioni numeriche (6,7,9,10,12,13,14), ma:
1. L'**omocodia** italiana prevede la sostituzione di cifre con lettere (`0→L, 1→M, 2→N, 3→P, 4→Q, 5→R, 6→S, 7→T, 8→U, 9→V`) quando due persone genererebbero lo stesso CF.
2. La posizione 11 (iniziale del codice catastale) è normalmente una lettera, ma in sandbox può essere una cifra.

**Causa**: `RSSMRA67B8N5458J` — la `N` in posizione 10 è omocodia per `2`, e il `5` in posizione 11 è un codice catastale numerico (sandbox).

**Soluzione**:
```typescript
// Prima (solo cifre):
/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/

// Dopo (omocodia + sandbox):
const oD = '[0-9LMNPQRSTUV]'
const cfBody = `[A-Z]{6}${oD}{2}[A-Z]${oD}{2}[A-Z0-9]${oD}{3}[A-Z]`
```

---

## Test 8: Suite di test per validazione form (81 test)

**File**: `src/__tests__/validation.test.ts`

**Comando**: `npm run test:unit`

**Copertura** (81 test totali):
- Login CF/P.IVA: 16 test (standard, omocodia, sandbox, invalidi)
- Signup Codice Fiscale: 8 test (standard, omocodia, non-CF)
- Partita IVA: 8 test (11 cifre, lettere, trattini, spazi)
- Email: 11 test (standard, sottodomini, +, senza @)
- PEC: 3 test (standard, sottodominio, senza @)
- PIN AdE: 7 test (8 cifre, lettere, speciali)
- CAP: 7 test (5 cifre, lettere, lunghezza)
- Provincia: 9 test (2 lettere, minuscole, numeri)
- Codice SDI: 9 test (7 alfanumerici, minuscole, speciali)

Tutti i test verificano le stesse regex usate in `CompanySetup.vue`.

---

## Note importanti

- **Aziende con receipts_authentication**: Solo 2 su 9 configurazioni registrate hanno `receipts_authentication` (necessario per emettere scontrini): `99988877766` e `RSSMRA67B8N5458J`.
- **Sandbox**: In ambiente sandbox le credenziali AdE non sono necessarie per la simulazione, ma il campo `receipts_authentication` deve comunque essere presente nella configurazione.
- **Omocodia**: Le regex del CF supportano la sostituzione omocodica (cifre → lettere LMNPQRSTUV) + la posizione 11 flessibile per compatibilità sandbox.
- **CLAUDE.md**: Creato file di documentazione per future sessioni con architettura, comandi e pattern del progetto.
