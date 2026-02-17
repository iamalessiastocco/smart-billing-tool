<template>
  <div class="invoice-generator">
    <h2>📄 Genera Scontrino</h2>

    <!-- 🆕 TEST CONFIGURAZIONE -->
    <div class="test-section">
      <button @click="runTest" class="btn-test">
        🔬 Test Configurazione
      </button>
      <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
        {{ testResult.message }}
      </div>
    </div>

    <!-- Info azienda -->
    <div v-if="store.myCompany" class="company-info">
      <strong>🏢 Azienda:</strong> {{ store.myCompany.name }}<br>
      <strong>📋 Fiscal ID:</strong> {{ store.myCompany.fiscal_id }}
    </div>

    <!-- Form items -->
    <div class="items-section">
      <h3>Articoli</h3>
      <div v-for="(item, index) in items" :key="index" class="item-row">
        <input 
          v-model="item.description" 
          placeholder="Descrizione (es: Caffè, Brioche)" 
          class="input-description"
        />
        <input 
          v-model.number="item.quantity" 
          type="number" 
          min="1"
          placeholder="Qtà" 
          class="input-quantity"
        />
        <input 
          v-model.number="item.unit_price" 
          type="number" 
          step="0.01"
          min="0.01"
          placeholder="Prezzo €" 
          class="input-price"
        />
        <select v-model.number="item.vat_rate_code" class="input-vat">
          <option :value="22">IVA 22% (Ordinaria)</option>
          <option :value="10">IVA 10% (Ridotta)</option>
          <option :value="5">IVA 5% (Super Ridotta)</option>
          <option :value="4">IVA 4% (Minima)</option>
  <!-- Per non imponibile, usa codici N1-N6 come stringa -->
          <option value="N1">Non Imponibile (N1)</option>
        </select>
        <button @click="removeItem(index)" class="btn-remove" v-if="items.length > 1">
          ❌
        </button>
      </div>
      <button @click="addItem" class="btn-add">➕ Aggiungi Articolo</button>
    </div>

    <!-- Pagamento -->
    <div class="payment-section">
      <h3>💳 Metodo di Pagamento</h3>
      <div class="payment-options">
        <label class="radio-label">
          <input type="radio" v-model="paymentMethod" value="cash" />
          💵 Contanti
        </label>
        <label class="radio-label">
          <input type="radio" v-model="paymentMethod" value="card" />
          💳 Carta
        </label>
      </div>

      <div class="total-section">
        <div class="total-breakdown">
          <div class="total-line">
            <span>Imponibile:</span>
            <span>€{{ taxableAmount.toFixed(2) }}</span>
          </div>
          <div class="total-line">
            <span>IVA:</span>
            <span>€{{ vatAmount.toFixed(2) }}</span>
          </div>
          <div class="total-line total-final">
            <span><strong>TOTALE:</strong></span>
            <span><strong>€{{ totalAmount.toFixed(2) }}</strong></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Azioni -->
    <div class="actions">
      <button 
        @click="handleSend" 
        :disabled="loading || !canSend" 
        class="btn-send"
      >
        <span v-if="!loading">📤 Invia Scontrino</span>
        <span v-else>⏳ Invio in corso...</span>
      </button>
    </div>

    <div v-if="error" class="message error-message">
      ❌ {{ error }}
    </div>
    <div v-if="success" class="message success-message">
      ✅ Scontrino inviato con successo!
      <div class="receipt-info" v-if="lastReceipt">
        <strong>Numero:</strong> {{ lastReceipt.receipt_number || 'N/A' }}<br>
        <strong>Data:</strong> {{ lastReceipt.date || new Date().toLocaleString('it-IT') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useReceipt } from '@/composables/useReceipt'
import { useBillingStore } from '@/stores/billingStore'

const store = useBillingStore()
const { createReceipt, testReceiptConfiguration, loading, error } = useReceipt()

const items = ref([
  { description: '', quantity: 1, unit_price: 0, vat_rate_code: 22 }
])

const paymentMethod = ref('cash')
const success = ref(false)
const testResult = ref<any>(null)
const lastReceipt = ref<any>(null)

// Calcoli
const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price)
  }, 0)
})

const taxableAmount = computed(() => {
  return items.value.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price
    const taxable = itemTotal / (1 + item.vat_rate_code / 100)
    return sum + taxable
  }, 0)
})

const vatAmount = computed(() => {
  return totalAmount.value - taxableAmount.value
})

const canSend = computed(() => {
  return items.value.some(item => 
    item.description.trim() && item.quantity > 0 && item.unit_price > 0
  ) && totalAmount.value > 0
})

// Actions
const addItem = () => {
  items.value.push({ description: '', quantity: 1, unit_price: 0, vat_rate_code: 22 })
}

const removeItem = (index: number) => {
  if (items.value.length > 1) {
    items.value.splice(index, 1)
  }
}

const runTest = async () => {
  const isValid = await testReceiptConfiguration()
  
  if (isValid) {
    testResult.value = { 
      success: true, 
      message: '✅ Configurazione corretta. Puoi inviare scontrini.' 
    }
  } else {
    testResult.value = { 
      success: false, 
      message: '❌ Configurazione non valida. Controlla la console.' 
    }
  }
}

const handleSend = async () => {
  success.value = false
  lastReceipt.value = null
  
  // Filtra solo items validi
  const validItems = items.value.filter(item => 
    item.description.trim() && item.quantity > 0 && item.unit_price > 0
  )

  if (validItems.length === 0) {
    alert('⚠️ Inserisci almeno un articolo valido')
    return
  }

  const receiptData = {
    items: validItems,
    cash_payment_amount: paymentMethod.value === 'cash' ? totalAmount.value : 0,
    card_payment_amount: paymentMethod.value === 'card' ? totalAmount.value : 0
  }

  console.log('📤 Invio scontrino con dati:', receiptData)

  const result = await createReceipt(receiptData)
  
  if (result.success) {
    success.value = true
    lastReceipt.value = result.data
    
    // Reset form dopo 2 secondi
    setTimeout(() => {
      items.value = [{ description: '', quantity: 1, unit_price: 0, vat_rate_code: 22 }]
      success.value = false
    }, 3000)
  }
}
</script>

<style scoped>
.invoice-generator {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.test-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-test {
  padding: 0.5rem 1rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-test:hover {
  background: #1976D2;
}

.test-result {
  flex: 1 1 100%;
  margin-top: 0.5rem;
  padding: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.test-result.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.test-result.error {
  background: #ffebee;
  color: #c62828;
}

.company-info {
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 4px;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.items-section {
  margin-bottom: 2rem;
}

h3 {
  margin-bottom: 1rem;
  color: #555;
}

.item-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1.5fr 2fr auto;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  align-items: center;
}

.item-row input, .item-row select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.item-row input:focus, .item-row select:focus {
  outline: none;
  border-color: #4CAF50;
}

.btn-add, .btn-remove {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-add {
  background: #4CAF50;
  color: white;
  width: 100%;
  margin-top: 0.5rem;
}

.btn-add:hover {
  background: #45a049;
}

.btn-remove {
  background: #f44336;
  color: white;
}

.btn-remove:hover {
  background: #da190b;
}

.payment-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.payment-options {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 1.1rem;
}

.radio-label input[type="radio"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.total-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #ddd;
}

.total-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.total-line {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
}

.total-final {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 2px solid #333;
  font-size: 1.5rem;
  color: #4CAF50;
}

.actions {
  text-align: center;
}

.btn-send {
  padding: 1rem 3rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-send:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.btn-send:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.message {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef5350;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #66bb6a;
}

.receipt-info {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  text-align: left;
  font-size: 0.95rem;
}
</style>