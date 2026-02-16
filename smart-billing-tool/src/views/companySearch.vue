<template>
  <div class="company-search">
    <h1>Smart Checkout - Ricerca Azienda</h1>
    
    <div class="search-box">
      <input 
        v-model="vatInput" 
        placeholder="Inserisci Partita IVA" 
        @keyup.enter="handleSearch"
      />
      <button :disabled="loading" @click="handleSearch">
        {{ loading ? 'Ricerca in corso...' : 'Verifica P.IVA' }}
      </button>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <div v-if="company" class="result-card">
      <h2>{{ company.name }}</h2>
      <p><strong>Indirizzo:</strong> {{ company.address.street }}, {{ company.address.city }}</p>
      <p><strong>PEC:</strong> {{ company.pec || 'Non presente' }}</p>
      <p><strong>Codice SDI:</strong> {{ company.sdi_code || 'N/A' }}</p>
      
      <div class="risk-check" :class="scoreColor">
        Score Finanziario: {{ company.financial_score || 'N/D' }}
      </div>

      <button 
        v-if="store.canInvoice" 
        @click="goToBilling" 
        class="proceed-btn"
      >
        Procedi alla Fatturazione
      </button>
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
  
  // Se la ricerca ha successo, salviamo nello store globale
  if (company.value) {
    store.setCompany(company.value);
  }
};

// Logica per colorare lo Score (Risk Check)
const scoreColor = computed(() => {
  if (!company.value?.financial_score) return '';
  const score = company.value.financial_score;
  if (['A', 'A+', 'A-'].includes(score)) return 'score-safe';
  if (['B', 'C'].includes(score)) return 'score-warning';
  return 'score-danger';
});

const goToBilling = () => {
  router.push('/checkout'); // Ti porterà alla pagina InvoiceGenerator.vue
};
</script>

<style scoped>
.error-msg { color: red; font-weight: bold; }
.result-card { border: 1px solid #ccc; padding: 20px; margin-top: 20px; border-radius: 8px; }
.risk-check { padding: 10px; margin: 10px 0; border-radius: 4px; display: inline-block; }
.score-safe { background-color: #d4edda; color: #155724; }
.score-warning { background-color: #fff3cd; color: #856404; }
.score-danger { background-color: #f8d7da; color: #721c24; }
.proceed-btn { background-color: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer; }
</style>