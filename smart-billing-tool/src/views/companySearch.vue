<template>
  <div class="company-search">
    <h1>🔍 Ricerca Azienda Cliente</h1>
    
    <!-- Controllo configurazione -->
    <div v-if="!store.isConfigured" class="warning-box">
      ⚠️ Configura prima la tua azienda nella sezione sopra!
    </div>

    <div v-else>
      <div class="search-box">
        <input 
          v-model="vatInput" 
          placeholder="Inserisci Partita IVA cliente" 
          @keyup.enter="handleSearch"
        />
        <button :disabled="loading" @click="handleSearch">
          {{ loading ? 'Ricerca in corso...' : 'Cerca Azienda' }}
        </button>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div v-if="company" class="result-card">
        <h2>{{ company.name }}</h2>
        <p><strong>P.IVA:</strong> {{ company.vat_number }}</p>
        <p><strong>Indirizzo:</strong> {{ company.address.street }}, {{ company.address.city }}</p>
        <p><strong>PEC:</strong> {{ company.pec || 'Non presente' }}</p>
        <p><strong>Codice SDI:</strong> {{ company.sdi_code || 'N/A' }}</p>
        
        <div class="status-badge" :class="statusClass">
          {{ company.status === 'ACTIVE' ? '✅ Attiva' : '❌ Non Attiva' }}
        </div>

        <button 
          v-if="store.canInvoice" 
          @click="goToBilling" 
          class="proceed-btn"
        >
          Procedi con Emissione Scontrino
        </button>
        
        <p v-else class="warning-text">
          ⚠️ L'azienda non è attiva. Non è consigliabile fatturare.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCompany } from '@/composables/useCompany';
import { useBillingStore } from '@/stores/billingStore';

const vatInput = ref('');
const router = useRouter();
const store = useBillingStore();
const { company, loading, error, searchCompany } = useCompany();

const handleSearch = async () => {
  if (!vatInput.value) return;
  await searchCompany(vatInput.value);
  
  if (company.value) {
    store.setCompany(company.value);
  }
};

const statusClass = computed(() => {
  return company.value?.status === 'ACTIVE' ? 'status-active' : 'status-inactive';
});

const goToBilling = () => {
  router.push('/checkout');
};
</script>

<style scoped>
.company-search {
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.warning-box {
  background: #fff3cd;
  color: #856404;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  border: 2px solid #ffc107;
}

.search-box {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.search-box input {
  flex: 1;
  padding: 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1em;
}

.search-box button {
  padding: 12px 30px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.search-box button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-msg {
  color: #dc3545;
  font-weight: bold;
  padding: 10px;
  background: #f8d7da;
  border-radius: 6px;
}

.result-card {
  border: 2px solid #28a745;
  padding: 25px;
  margin-top: 20px;
  border-radius: 12px;
  background: #f8f9fa;
}

.status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  margin: 15px 0;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-inactive {
  background: #f8d7da;
  color: #721c24;
}

.proceed-btn {
  width: 100%;
  padding: 15px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.1em;
  cursor: pointer;
  margin-top: 15px;
}

.warning-text {
  color: #856404;
  background: #fff3cd;
  padding: 10px;
  border-radius: 6px;
  margin-top: 15px;
  text-align: center;
}
</style>