<!-- src/components/CompanySetup.vue -->
<template>
  <div class="company-setup">
    <h2>⚙️ Configurazione Azienda</h2>
    
    <!-- UTENTE GIÀ LOGGATO -->
    <div v-if="store.isConfigured" class="logged-in">
      <div class="success-badge">✅ Benvenuto/a!</div>
      <div class="company-info">
        <h3>{{ store.myCompany?.name }}</h3>
        <p><strong>Codice Fiscale/P.IVA:</strong> {{ store.myCompany?.fiscal_id }}</p>
        <p><strong>Email:</strong> {{ store.myCompany?.email }}</p>
        <p v-if="store.myCompany?.receipts" class="feature-enabled">
          ✅ Scontrini elettronici abilitati
        </p>
      </div>
      <button @click="handleLogout" class="logout-btn">
        🚪 Esci (Logout)
      </button>
    </div>

    <!-- UTENTE NON LOGGATO -->
    <div v-else class="auth-container">
      <!-- TAB: LOGIN o SIGN UP -->
      <div class="tabs">
        <button 
          @click="activeTab = 'login'" 
          :class="{ active: activeTab === 'login' }"
          class="tab-btn"
        >
          🔓 Login
        </button>
        <button 
          @click="activeTab = 'signup'" 
          :class="{ active: activeTab === 'signup' }"
          class="tab-btn"
        >
          📝 Registrati
        </button>
      </div>

      <!-- LOGIN CON CODICE FISCALE -->
      <div v-if="activeTab === 'login'" class="auth-form">
        <h3>Accedi con il tuo Codice Fiscale</h3>
        <p class="form-description">Inserisci il Codice Fiscale che hai registrato</p>
        
        <div class="form-field">
          <label>Codice Fiscale / P.IVA *</label>
          <input
            v-model="loginFiscalId"
            placeholder="RSSMRA80A01H501U oppure 12345678901"
            maxlength="16"
            @keyup.enter="handleLogin"
            @blur="validateField('loginFiscalId', loginFiscalId, true)"
            :class="{ 'input-error': validationErrors['loginFiscalId'] }"
            style="text-transform: uppercase"
          />
          <p v-if="validationErrors['loginFiscalId']" class="field-error">{{ validationErrors['loginFiscalId'] }}</p>
          <p v-else class="field-hint">Per le società: Codice Fiscale = P.IVA (11 cifre)</p>
        </div>

        <button 
          @click="handleLogin" 
          :disabled="loading || !loginFiscalId"
          class="submit-btn"
        >
          {{ loading ? '⏳ Accesso...' : '🔓 Accedi' }}
        </button>
      </div>

      <!-- SIGN UP -->
      <div v-if="activeTab === 'signup'" class="auth-form">
        <h3>Registra la tua Azienda</h3>
        <p class="form-description">Compila i dati per creare la tua configurazione</p>
        
        <!-- ALERT IMPORTANTE -->
        <div class="alert-box">
          <strong>⚠️ IMPORTANTE:</strong> Prima di procedere, devi abilitare le credenziali sul 
          <a href="https://docs.openapi.it/Procedura-manuale-per-incarico.pdf" target="_blank" rel="noopener">
            portale Agenzia delle Entrate
          </a>
          seguendo la procedura di incarico terzi.
        </div>
        
        <form @submit.prevent="handleSignup" class="form-grid">
          <!-- DATI AZIENDALI -->
          <div class="form-section-title">📋 Dati Aziendali</div>
          
          <div class="form-field">
            <label>Codice Fiscale *</label>
            <input
              v-model="formData.fiscal_id"
              required
              maxlength="16"
              style="text-transform: uppercase"
              placeholder="RSSMRA80A01H501U"
              @blur="validateField('fiscal_id', formData.fiscal_id, true)"
              :class="{ 'input-error': validationErrors['fiscal_id'] }"
            />
            <p v-if="validationErrors['fiscal_id']" class="field-error">{{ validationErrors['fiscal_id'] }}</p>
            <p v-else class="field-hint">Per società: uguale alla P.IVA</p>
          </div>

          <div class="form-field">
            <label>Partita IVA *</label>
            <input
              v-model="formData.vat_number"
              required
              maxlength="11"
              placeholder="12345678901"
              @blur="validateField('vat_number', formData.vat_number, true)"
              :class="{ 'input-error': validationErrors['vat_number'] }"
            />
            <p v-if="validationErrors['vat_number']" class="field-error">{{ validationErrors['vat_number'] }}</p>
          </div>

          <div class="form-field full-width">
            <label>Ragione Sociale *</label>
            <input
              v-model="formData.name"
              required
              placeholder="La Mia Azienda S.r.l."
              @blur="formData.name.trim() ? delete validationErrors['name'] : (validationErrors['name'] = 'Campo obbligatorio')"
              :class="{ 'input-error': validationErrors['name'] }"
            />
            <p v-if="validationErrors['name']" class="field-error">{{ validationErrors['name'] }}</p>
          </div>

          <div class="form-field full-width">
            <label>Email *</label>
            <input
              v-model="formData.email"
              type="email"
              required
              placeholder="info@azienda.it"
              @blur="validateField('email', formData.email, true)"
              :class="{ 'input-error': validationErrors['email'] }"
            />
            <p v-if="validationErrors['email']" class="field-error">{{ validationErrors['email'] }}</p>
            <p v-else class="field-note">⚠️ L'email non può essere modificata dopo la creazione</p>
          </div>

          <!-- CREDENZIALI AGENZIA DELLE ENTRATE -->
          <div class="form-section-title full-width">
            🔐 Credenziali Agenzia delle Entrate (OBBLIGATORIO)
          </div>
          
          <div class="info-box full-width">
            <p>
              <strong>📖 Come ottenere le credenziali:</strong><br>
              1. Scarica la <a href="https://docs.openapi.it/Procedura-manuale-per-incarico.pdf" target="_blank">guida PDF</a><br>
              2. Accedi al portale Agenzia delle Entrate<br>
              3. Abilita l'incarico terzi per OpenAPI<br>
              4. Inserisci qui le credenziali abilitate
            </p>
          </div>

          <div class="form-field full-width">
            <label>Codice Fiscale (per scontrini) *</label>
            <input
              v-model="formData.receipts_authentication.taxCode"
              required
              placeholder="Codice Fiscale abilitato sul portale AdE"
              maxlength="16"
              style="text-transform: uppercase"
              @blur="validateField('taxCode', formData.receipts_authentication.taxCode, true)"
              :class="{ 'input-error': validationErrors['taxCode'] }"
            />
            <p v-if="validationErrors['taxCode']" class="field-error">{{ validationErrors['taxCode'] }}</p>
            <p v-else class="field-hint">Stesso CF usato per l'incarico terzo sul portale</p>
          </div>

          <div class="form-field">
            <label>Password Portale AdE *</label>
            <input
              v-model="formData.receipts_authentication.password"
              type="password"
              required
              placeholder="Password portale Agenzia delle Entrate"
              @blur="formData.receipts_authentication.password ? delete validationErrors['password'] : (validationErrors['password'] = 'Campo obbligatorio')"
              :class="{ 'input-error': validationErrors['password'] }"
            />
            <p v-if="validationErrors['password']" class="field-error">{{ validationErrors['password'] }}</p>
          </div>

          <div class="form-field">
            <label>PIN Dispositivo *</label>
            <input
              v-model="formData.receipts_authentication.pin"
              type="password"
              required
              maxlength="8"
              placeholder="PIN del dispositivo (8 cifre)"
              @blur="validateField('pin', formData.receipts_authentication.pin, true)"
              :class="{ 'input-error': validationErrors['pin'] }"
            />
            <p v-if="validationErrors['pin']" class="field-error">{{ validationErrors['pin'] }}</p>
          </div>

          <!-- INDIRIZZO (OPZIONALE) -->
          <div class="form-section-title full-width">🏢 Indirizzo (Opzionale)</div>

          <div class="form-field full-width">
            <label>Indirizzo</label>
            <input 
              v-model="formData.address.street" 
              placeholder="Via Roma 123" 
            />
          </div>

          <div class="form-field">
            <label>Città</label>
            <input 
              v-model="formData.address.city" 
              placeholder="Roma"
            />
          </div>

          <div class="form-field">
            <label>CAP</label>
            <input
              v-model="formData.address.zip"
              maxlength="5"
              placeholder="00100"
              @blur="formData.address.zip ? validateField('zip', formData.address.zip) : delete validationErrors['zip']"
              :class="{ 'input-error': validationErrors['zip'] }"
            />
            <p v-if="validationErrors['zip']" class="field-error">{{ validationErrors['zip'] }}</p>
          </div>

          <div class="form-field">
            <label>Provincia</label>
            <input
              v-model="formData.address.province"
              maxlength="2"
              placeholder="RM"
              style="text-transform: uppercase"
              @blur="formData.address.province ? validateField('province', formData.address.province) : delete validationErrors['province']"
              :class="{ 'input-error': validationErrors['province'] }"
            />
            <p v-if="validationErrors['province']" class="field-error">{{ validationErrors['province'] }}</p>
          </div>

          <!-- ALTRI DATI (OPZIONALI) -->
          <div class="form-section-title full-width">📧 Altri Dati (Opzionali)</div>

          <div class="form-field">
            <label>Codice SDI</label>
            <input
              v-model="formData.sdi_code"
              maxlength="7"
              placeholder="ABCD123"
              style="text-transform: uppercase"
              @blur="formData.sdi_code ? validateField('sdi_code', formData.sdi_code) : delete validationErrors['sdi_code']"
              :class="{ 'input-error': validationErrors['sdi_code'] }"
            />
            <p v-if="validationErrors['sdi_code']" class="field-error">{{ validationErrors['sdi_code'] }}</p>
          </div>

          <div class="form-field">
            <label>PEC</label>
            <input
              v-model="formData.pec"
              type="email"
              placeholder="azienda@pec.it"
              @blur="formData.pec ? validateField('pec', formData.pec) : delete validationErrors['pec']"
              :class="{ 'input-error': validationErrors['pec'] }"
            />
            <p v-if="validationErrors['pec']" class="field-error">{{ validationErrors['pec'] }}</p>
          </div>

          <!-- SUBMIT -->
          <button type="submit" :disabled="loading" class="submit-btn full-width">
            {{ loading ? '⏳ Registrazione...' : '✅ Registra Azienda' }}
          </button>
        </form>
      </div>
    </div>

    <!-- MESSAGGI -->
    <p v-if="error" class="error-msg">❌ {{ error }}</p>
    <p v-if="success" class="success-msg">✅ {{ success }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBillingStore } from '@/stores/billingStore'
import { useCompanyConfig } from '@/composables/useCompanyConfig'

const store = useBillingStore()
const {
  myCompany,
  loading,
  error: apiError,
  createCompanyConfig,
  loginWithFiscalId,
  loadSession,
  logout: logoutConfig
} = useCompanyConfig()

const activeTab = ref<'login' | 'signup'>('login')
const loginFiscalId = ref('')
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// === REGEX DI VALIDAZIONE ===
// Omocodia: l'AdE sostituisce cifre con lettere (0→L,1→M,2→N,3→P,4→Q,5→R,6→S,7→T,8→U,9→V)
// nelle posizioni 6,7,9,10,12,13,14 del CF. Usiamo [0-9LMNPQRSTUV] per queste posizioni.
const oD = '[0-9LMNPQRSTUV]' // cifra o lettera omocodica
// Posizione 11 (codice catastale): normalmente lettera, ma in sandbox può essere cifra
const cfBody = `[A-Z]{6}${oD}{2}[A-Z]${oD}{2}[A-Z0-9]${oD}{3}[A-Z]`
const patterns = {
  // Codice Fiscale italiano (con supporto omocodia)
  codiceFiscale: new RegExp(`^${cfBody}$`),
  // Partita IVA: esattamente 11 cifre
  partitaIva: /^\d{11}$/,
  // CF (con omocodia) o P.IVA (login accetta entrambi)
  fiscalId: new RegExp(`^(${cfBody}|\\d{11})$`),
  // Email standard
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // CAP italiano: 5 cifre
  cap: /^\d{5}$/,
  // Provincia: 2 lettere maiuscole
  provincia: /^[A-Z]{2}$/,
  // Codice SDI: 7 caratteri alfanumerici
  sdiCode: /^[A-Z0-9]{7}$/,
  // PIN dispositivo AdE: 8 cifre
  pinAdE: /^\d{8}$/
}

// Messaggi di errore per campo
const validationErrors = ref<Record<string, string>>({})

const validateField = (field: string, value: string, required: boolean = false): boolean => {
  const v = value.trim().toUpperCase()

  // Campo vuoto: errore solo se obbligatorio
  if (!v) {
    if (required) {
      validationErrors.value[field] = 'Campo obbligatorio'
      return false
    }
    delete validationErrors.value[field]
    return true
  }

  switch (field) {
    case 'loginFiscalId':
    case 'fiscal_id':
      if (!patterns.fiscalId.test(v)) {
        validationErrors.value[field] = 'Formato non valido. Codice Fiscale (16 caratteri, es. RSSMRA80A01H501U) o P.IVA (11 cifre)'
        return false
      }
      break
    case 'vat_number':
      if (!patterns.partitaIva.test(v)) {
        validationErrors.value[field] = 'La P.IVA deve contenere esattamente 11 cifre'
        return false
      }
      break
    case 'email':
    case 'pec':
      if (!patterns.email.test(value.trim())) {
        validationErrors.value[field] = field === 'pec' ? 'Formato PEC non valido (es. azienda@pec.it)' : 'Formato email non valido'
        return false
      }
      break
    case 'taxCode':
      if (!patterns.codiceFiscale.test(v)) {
        validationErrors.value[field] = 'Codice Fiscale non valido (16 caratteri, es. RSSMRA80A01H501U)'
        return false
      }
      break
    case 'pin':
      if (!patterns.pinAdE.test(v)) {
        validationErrors.value[field] = 'Il PIN deve contenere esattamente 8 cifre'
        return false
      }
      break
    case 'zip':
      if (!patterns.cap.test(v)) {
        validationErrors.value[field] = 'Il CAP deve contenere esattamente 5 cifre'
        return false
      }
      break
    case 'province':
      if (!patterns.provincia.test(v)) {
        validationErrors.value[field] = 'La provincia deve essere di 2 lettere (es. RM, MI)'
        return false
      }
      break
    case 'sdi_code':
      if (!patterns.sdiCode.test(v)) {
        validationErrors.value[field] = 'Il codice SDI deve contenere 7 caratteri alfanumerici'
        return false
      }
      break
  }

  delete validationErrors.value[field]
  return true
}

const validateLoginForm = (): boolean => {
  return validateField('loginFiscalId', loginFiscalId.value, true)
}

const validateSignupForm = (): boolean => {
  const results = [
    validateField('fiscal_id', formData.value.fiscal_id, true),
    validateField('vat_number', formData.value.vat_number, true),
    validateField('email', formData.value.email, true),
    validateField('taxCode', formData.value.receipts_authentication.taxCode, true),
    validateField('pin', formData.value.receipts_authentication.pin, true),
  ]

  // Campi opzionali: valida solo se compilati
  if (formData.value.address.zip) results.push(validateField('zip', formData.value.address.zip))
  if (formData.value.address.province) results.push(validateField('province', formData.value.address.province))
  if (formData.value.sdi_code) results.push(validateField('sdi_code', formData.value.sdi_code))
  if (formData.value.pec) results.push(validateField('pec', formData.value.pec))

  // Ragione sociale: solo check non vuoto
  if (!formData.value.name.trim()) {
    validationErrors.value['name'] = 'Campo obbligatorio'
    results.push(false)
  } else {
    delete validationErrors.value['name']
  }

  // Password AdE: solo check non vuoto
  if (!formData.value.receipts_authentication.password) {
    validationErrors.value['password'] = 'Campo obbligatorio'
    results.push(false)
  } else {
    delete validationErrors.value['password']
  }

  return results.every(r => r)
}

const formData = ref({
  fiscal_id: '',
  vat_number: '',
  name: '',
  email: '',
  receipts: true, // Abilita scontrini
  customer_invoice: false, // Disabilita fatture clienti di default
  supplier_invoice: false, // Disabilita fatture fornitori di default
  receipts_authentication: {
    taxCode: '',
    password: '',
    pin: ''
  },
  address: {
    street: '',
    city: '',
    zip: '',
    province: '',
    country: 'IT'
  },
  sdi_code: '',
  pec: ''
})

// Carica sessione salvata all'avvio
onMounted(() => {
  loadSession()
  if (myCompany.value) {
    console.log('[SESSION] Sessione caricata:', myCompany.value.name)
  }
})

// LOGIN con Codice Fiscale
const handleLogin = async () => {
  error.value = null
  success.value = null

  if (!validateLoginForm()) {
    error.value = "Controlla il formato del Codice Fiscale o P.IVA inserito"
    return
  }

  try {
    const result = await loginWithFiscalId(loginFiscalId.value.toUpperCase())
    if (result.success && result.data) {
      store.setMyCompany(result.data)
      success.value = `Benvenuto/a ${result.data.name}!`
      loginFiscalId.value = ''
    } else {
      error.value = result.error || apiError.value || "Errore durante l'accesso"
    }
  } catch (err) {
    error.value = apiError.value || "Errore durante l'accesso"
  }
}

// SIGN UP
const handleSignup = async () => {
  error.value = null
  success.value = null

  if (!validateSignupForm()) {
    error.value = "Correggi gli errori nei campi evidenziati prima di procedere"
    return
  }

  try {
    const result = await createCompanyConfig(formData.value)
    if (result.success && result.data) {
      store.setMyCompany(result.data)
      success.value = result.wasExisting 
        ? "Azienda già registrata! Login effettuato."
        : "Registrazione completata! Benvenuto/a!"
      
      // Reset form
      formData.value = {
        fiscal_id: '',
        vat_number: '',
        name: '',
        email: '',
        receipts: true,
        customer_invoice: false,
        supplier_invoice: false,
        receipts_authentication: {
          taxCode: '',
          password: '',
          pin: ''
        },
        address: { street: '', city: '', zip: '', province: '', country: 'IT' },
        sdi_code: '',
        pec: ''
      }
    } else {
      error.value = result.error || apiError.value || "Errore durante la registrazione"
    }
  } catch (err) {
    error.value = apiError.value || "Errore durante la registrazione"
  }
}

// LOGOUT
const handleLogout = () => {
  logoutConfig()
  store.logout()
  error.value = null
  success.value = "Logout effettuato. A presto!"
  activeTab.value = 'login'
  loginFiscalId.value = ''
  
  setTimeout(() => {
    success.value = null
  }, 3000)
}
</script>

<style scoped>
.company-setup {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

/* LOGGED IN */
.logged-in {
  background: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
}

.success-badge {
  font-size: 2em;
  color: #28a745;
  font-weight: bold;
  margin-bottom: 20px;
}

.company-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  text-align: left;
  max-width: 500px;
  margin: 0 auto 20px;
}

.company-info h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.company-info p {
  margin: 8px 0;
  color: #495057;
}

.feature-enabled {
  color: #28a745;
  font-weight: 600;
  background: #d4edda;
  padding: 8px;
  border-radius: 4px;
  margin-top: 10px;
}

.logout-btn {
  padding: 12px 30px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #5a6268;
}

/* TABS */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 15px;
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-weight: bold;
  color: #6c757d;
  transition: all 0.3s;
}

.tab-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.tab-btn:hover:not(.active) {
  background: #f8f9fa;
}

/* ALERTS */
.alert-box {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404;
}

.alert-box strong {
  display: block;
  margin-bottom: 8px;
}

.alert-box a {
  color: #004085;
  text-decoration: underline;
  font-weight: 600;
}

.info-box {
  background: #d1ecf1;
  border: 2px solid #bee5eb;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  color: #0c5460;
  font-size: 0.9em;
}

.info-box a {
  color: #004085;
  font-weight: 600;
  text-decoration: underline;
}

/* FORMS */
.auth-form {
  background: white;
  padding: 25px;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-description {
  color: #6c757d;
  font-size: 0.9em;
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-section-title {
  grid-column: 1 / -1;
  font-weight: 700;
  color: #495057;
  font-size: 1.1em;
  margin-top: 20px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 2px solid #dee2e6;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #495057;
  font-size: 0.9em;
}

.form-field input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-field input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.field-note {
  font-size: 0.75em;
  color: #856404;
  margin-top: 4px;
  font-style: italic;
  background: #fff3cd;
  padding: 4px 8px;
  border-radius: 4px;
}

.field-hint {
  font-size: 0.75em;
  color: #6c757d;
  margin-top: 4px;
  font-style: italic;
}

.field-error {
  font-size: 0.75em;
  color: #dc3545;
  margin-top: 4px;
  font-weight: 600;
}

.input-error {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15) !important;
}

.submit-btn {
  grid-column: 1 / -1;
  padding: 15px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1.1em;
  margin-top: 10px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.error-msg {
  color: #dc3545;
  font-weight: bold;
  margin-top: 15px;
  padding: 12px;
  background: #f8d7da;
  border-radius: 6px;
  border-left: 4px solid #dc3545;
}

.success-msg {
  color: #28a745;
  font-weight: bold;
  margin-top: 15px;
  padding: 12px;
  background: #d4edda;
  border-radius: 6px;
  border-left: 4px solid #28a745;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-field {
    grid-column: 1;
  }
}
</style>