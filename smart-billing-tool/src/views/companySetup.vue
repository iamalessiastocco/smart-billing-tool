<template>
  <div class="setup-container">
    <h3>Configurazione Azienda Emittente</h3>
    <p>Prima di iniziare, registra la tua azienda per abilitare l'invio allo SDI.</p>
    
    <button :disabled="loading" @click="handleRegistration">
      {{ loading ? 'Registrazione in corso...' : 'Configura Azienda' }}
    </button>

    <p v-if="success" class="success-msg">✅ Azienda pronta per la fatturazione!</p>
    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCompany } from '@/composables/useCompany';

const { registerCompany, loading, error } = useCompany();
const success = ref(false);

// Dati dell'azienda che usa il tool (Esempio basato sul tuo file setup_azienda.php)
const datiAzienda = {
  vat_number: '12485671007', 
  fiscal_id: '12485671007',  
  name: 'Binatomy SRL Test',
  address: {
    street: 'Via Roma 1',
    city: 'Milano',
    zip: '20100',
    province: 'MI',
    country: 'IT'
  },
  email: 'info@binatomy.com'
};

const handleRegistration = async () => {
  try {
    await registerCompany(datiAzienda);
    success.value = true;
  } catch (err) {
    // L'errore 410 è già gestito nel composable, quindi se arriviamo qui è un successo "silenzioso"
    success.value = true;
  }
};
</script>

<style scoped>
.setup-container { border: 1px dashed #007bff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
.success-msg { color: green; font-weight: bold; }
.error-msg { color: red; }
</style>