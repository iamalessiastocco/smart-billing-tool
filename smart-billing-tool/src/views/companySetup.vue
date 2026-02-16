<!-- src/components/CompanySetup.vue -->
<template>
  <div class="company-setup">
    <h2>⚙️ Configurazione Azienda</h2>
    
    <div v-if="!store.isConfigured" class="setup-container">
      <!-- SOLO REGISTRAZIONE -->
      <div class="signup-section">
        <h3>📝 Registra la tua azienda</h3>
        <p class="info-text">
          Compila i dati della tua azienda per iniziare a emettere fatture elettroniche.
        </p>
        
        <form @submit.prevent="handleCreate" class="form-grid">
          <div class="form-field">
            <label>Codice Fiscale *</label>
            <input v-model="formData.fiscal_id" required maxlength="16" />
          </div>
          
          <div class="form-field">
            <label>Partita IVA *</label>
            <input v-model="formData.vat_number" required maxlength="11" />
          </div>

          <div class="form-field full-width">
            <label>Ragione Sociale *</label>
            <input v-model="formData.name" required />
          </div>

          <div class="form-field full-width">
            <label>Indirizzo (Via e numero civico) *</label>
            <input v-model="formData.address.street" required placeholder="Via Roma 123" />
          </div>

          <div class="form-field">
            <label>Città *</label>
            <input v-model="formData.address.city" required />
          </div>

          <div class="form-field">
            <label>CAP *</label>
            <input v-model="formData.address.zip" required maxlength="5" pattern="[0-9]{5}" />
          </div>

          <div class="form-field">
            <label>Provincia *</label>
            <input v-model="formData.address.province" required maxlength="2" placeholder="RM" />
          </div>

          <div class="form-field">
            <label>Codice SDI</label>
            <input v-model="formData.sdi_code" maxlength="7" placeholder="Es: ABCD123" />
          </div>

          <div class="form-field full-width">
            <label>PEC</label>
            <input v-model="formData.pec" type="email" placeholder="azienda@pec.it" />
          </div>

          <div class="form-field full-width">
            <label>Email *</label>
            <input v-model="formData.email" type="email" required placeholder="info@azienda.it" />
            <p class="field-note">⚠️ L'email non può essere modificata dopo la creazione</p>
          </div>

          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? '⏳ Registrazione in corso...' : '✅ Registra Azienda' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Configurazione attiva -->
    <div v-else class="config-active">
      <div class="success-badge">✅ Configurazione Attiva</div>
      <div class="company-info">
        <p><strong>Ragione Sociale:</strong> {{ store.myCompany?.name }}</p>
        <p><strong>P.IVA:</strong> {{ store.myCompany?.vat_number }}</p>
        <p><strong>Codice Fiscale:</strong> {{ store.myCompany?.fiscal_id }}</p>
        <p><strong>Città:</strong> {{ store.myCompany?.address.city }}</p>
      </div>
      <button @click="handleLogout" class="logout-btn">
        🔄 Cambia Azienda
      </button>
    </div>

    <p v-if="error" class="error-msg">❌ {{ error }}</p>
    <p v-if="success" class="success-msg">✅ {{ success }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useBillingStore } from '@/stores/billingStore';
import { useCompanyConfig } from '@/composables/useCompanyConfig';

const store = useBillingStore();
const { 
  myCompany, 
  loading, 
  error: apiError, 
  createCompanyConfig
} = useCompanyConfig();

const error = ref<string | null>(null);
const success = ref<string | null>(null);

const formData = ref({
  fiscal_id: '',
  vat_number: '',
  name: '',
  email: '',
  address: {
    street: '',
    city: '',
    zip: '',
    province: '',
    country: 'IT'
  },
  sdi_code: '',
  pec: '',
  status: 'ACTIVE' as const
});

const handleCreate = async () => {
  error.value = null;
  success.value = null;

  // Validazione base
  if (!formData.value.fiscal_id || !formData.value.vat_number || !formData.value.name) {
    error.value = "Compila tutti i campi obbligatori (*)";
    return;
  }

  try {
    console.log('📤 Tentativo registrazione con:', formData.value);
    
    const result = await createCompanyConfig(formData.value);
    
    store.setMyCompany(result);
    success.value = "Azienda registrata con successo! Ora puoi cercare clienti e emettere fatture.";
    
    // Reset form
    formData.value = {
      fiscal_id: '',
      vat_number: '',
      name: '',
      address: {
        street: '',
        city: '',
        zip: '',
        province: '',
        country: 'IT'
      },
      sdi_code: '',
      pec: '',
      status: 'ACTIVE'
    };
  } catch (err: any) {
    console.error('❌ Errore registrazione:', err);
    error.value = apiError.value || "Errore durante la registrazione. Riprova.";
    
    // Se l'azienda esiste già
    if (err.response?.status === 409 || err.response?.data?.message?.includes('già')) {
      error.value = "Questa P.IVA è già registrata. Contatta il supporto per recuperare l'accesso.";
    }
  }
};

const handleLogout = () => {
  store.clearStore();
  success.value = null;
  error.value = null;
};
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
  margin-bottom: 10px;
}

.info-text {
  color: #6c757d;
  font-size: 0.95em;
  margin-bottom: 20px;
}

.setup-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.signup-section {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h3 {
  color: #495057;
  margin-bottom: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 20px;
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
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.3s;
}

.form-field input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
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

.config-active {
  background: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
}

.success-badge {
  font-size: 1.8em;
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

.company-info p {
  margin: 10px 0;
  color: #495057;
  font-size: 0.95em;
}

.logout-btn {
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.logout-btn:hover {
  background: #5a6268;
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
</style>