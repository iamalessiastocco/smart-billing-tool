<template>
  <div class="invoice-generator">
    <h1>Smart Billing - Generazione Documento</h1>

    <div v-if="store.selectedCompany" class="client-summary">
      <p><strong>Fatturazione a:</strong> {{ store.selectedCompany.name }}</p>
      <p><strong>P.IVA:</strong> {{ store.selectedCompany.vat_number }}</p>
      <span class="badge-active">Dati Validati ✓</span>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Descrizione</th>
          <th>Quantità</th>
          <th>Prezzo Unitario</th>
          <th>IVA %</th>
          <th>Totale</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td><input v-model="item.description" placeholder="Es. Consulenza"></td>
          <td><input v-model.number="item.quantity" type="number" min="1"></td>
          <td><input v-model.number="item.unit_price" type="number" step="0.01"></td>
          <td><input v-model.number="item.vat" type="number"></td>
          <td>{{ (item.quantity * item.unit_price * (1 + item.vat / 100)).toFixed(2) }}€</td>
          <td><button @click="removeItem(index)">X</button></td>
        </tr>
      </tbody>
    </table>

    <button class="add-btn" @click="addItem">+ Aggiungi Riga</button>

    <div class="actions">
      <h3 v-if="totalAmount > 0">Totale Documento: {{ totalAmount.toFixed(2) }}€</h3>
      
      <button 
        :disabled="loading || items.length === 0" 
        @click="handleSend"
        class="send-btn"
      >
        {{ loading ? 'Invio in corso...' : 'Invia allo SDI' }}
      </button>
      
      <p v-if="error" class="error-msg">{{ error }}</p>
      <p v-if="invoiceId" class="success-msg">Inviato con successo! ID: {{ invoiceId }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBillingStore } from '@/stores/billingStore';
import { useInvoice } from '@/composables/useInvoice';

const store = useBillingStore();
const { sendInvoice, loading, error, invoiceId } = useInvoice();

// Stato locale per le righe della fattura
const items = ref([
  { description: '', quantity: 1, unit_price: 0, vat: 22 }
]);

const addItem = () => {
  items.value.push({ description: '', quantity: 1, unit_price: 0, vat: 22 });
};

const removeItem = (index: number) => {
  items.value.splice(index, 1);
};

const totalAmount = computed(() => {
  return items.value.reduce((acc, item) => {
    return acc + (item.quantity * item.unit_price * (1 + item.vat / 100));
  }, 0);
});

const handleSend = async () => {
  // Prepariamo i pagamenti (es. pagamento unico dell'intero totale)
  const payments = [{
    amount: totalAmount.value,
    payment_type: 'Cash' // Tipologia semplificata come nello script iniziale
  }];

  await sendInvoice(items.value, payments);
};
</script>

<style scoped>
.client-summary { background: #f0f4f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
.badge-active { color: green; font-size: 0.8em; font-weight: bold; }
.items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
.items-table th, .items-table td { border-bottom: 1px solid #eee; padding: 10px; text-align: left; }
.add-btn { background: #28a745; color: white; border: none; padding: 8px 15px; cursor: pointer; }
.send-btn { background: #007bff; color: white; padding: 15px 30px; border: none; cursor: pointer; font-size: 1.1em; }
.send-btn:disabled { background: #ccc; }
.error-msg { color: red; margin-top: 10px; }
.success-msg { color: green; font-weight: bold; margin-top: 10px; }
</style>