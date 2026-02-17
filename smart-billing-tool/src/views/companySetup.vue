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
            style="text-transform: uppercase"
          />
          <p class="field-hint">Per le società: Codice Fiscale = P.IVA (11 cifre)</p>
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
            />
            <p class="field-hint">Per società: uguale alla P.IVA</p>
          </div>
          
          <div class="form-field">
            <label>Partita IVA *</label>
            <input 
              v-model="formData.vat_number" 
              required 
              maxlength="11"
              placeholder="12345678901"
            />
          </div>

          <div class="form-field full-width">
            <label>Ragione Sociale *</label>
            <input 
              v-model="formData.name" 
              required 
              placeholder="La Mia Azienda S.r.l."
            />
          </div>

          <div class="form-field full-width">
            <label>Email *</label>
            <input 
              v-model="formData.email" 
              type="email" 
              required 
              placeholder="info@azienda.it" 
            />
            <p class="field-note">⚠️ L'email non può essere modificata dopo la creazione</p>
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
            />
            <p class="field-hint">Stesso CF usato per l'incarico terzo sul portale</p>
          </div>
          
          <div class="form-field">
            <label>Password Portale AdE *</label>
            <input 
              v-model="formData.receipts_authentication.password" 
              type="password"
              required
              placeholder="Password portale Agenzia delle Entrate"
            />
          </div>
          
          <div class="form-field">
            <label>PIN Dispositivo *</label>
            <input 
              v-model="formData.receipts_authentication.pin" 
              type="password"
              required
              maxlength="8"
              placeholder="PIN del dispositivo (8 caratteri)"
            />
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
            />
          </div>

          <div class="form-field">
            <label>Provincia</label>
            <input 
              v-model="formData.address.province" 
              maxlength="2" 
              placeholder="RM" 
              style="text-transform: uppercase"
            />
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
            />
          </div>

          <div class="form-field">
            <label>PEC</label>
            <input 
              v-model="formData.pec" 
              type="email"
              placeholder="azienda@pec.it"
            />
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
  logout: logoutConfig
} = useCompanyConfig()

const activeTab = ref<'login' | 'signup'>('login')
const loginFiscalId = ref('')
const error = ref<string | null>(null)
const success = ref<string | null>(null)

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

// Carica sessione all'avvio
onMounted(() => {
  if (myCompany.value) {
    console.log('[SESSION] Sessione caricata:', myCompany.value.name)
  }
})

// LOGIN con Codice Fiscale
const handleLogin = async () => {
  error.value = null
  success.value = null

  if (!loginFiscalId.value) {
    error.value = "Inserisci il Codice Fiscale"
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

  // Validazione campi obbligatori
  if (!formData.value.fiscal_id || !formData.value.vat_number || 
      !formData.value.name || !formData.value.email) {
    error.value = "Compila tutti i campi obbligatori (*) della sezione Dati Aziendali"
    return
  }

  // Validazione credenziali AdE
  if (!formData.value.receipts_authentication.taxCode || 
      !formData.value.receipts_authentication.password || 
      !formData.value.receipts_authentication.pin) {
    error.value = "Compila tutti i campi obbligatori (*) delle Credenziali Agenzia delle Entrate"
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