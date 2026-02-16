// src/stores/billingStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CompanyData } from '@/types';

export const useBillingStore = defineStore('billing', () => {
  // La mia azienda (mittente)
  const myCompany = ref<CompanyData | null>(null);
  
  // Azienda destinataria (cliente)
  const selectedCompany = ref<CompanyData | null>(null);

  // Imposta la propria azienda
  function setMyCompany(company: CompanyData) {
    myCompany.value = company;
  }

  // Imposta il cliente
  function setCompany(company: CompanyData) {
    selectedCompany.value = company;
  }

  // Reset parziale (solo cliente)
  function clearStore() {
    selectedCompany.value = null;
  }

  // NUOVO: Reset completo (logout)
  function logout() {
    myCompany.value = null;
    selectedCompany.value = null;
  }

  // Controllo se la propria azienda è configurata
  const isConfigured = computed(() => {
    return myCompany.value !== null;
  });

  // Controllo se si può fatturare
  const canInvoice = computed(() => {
    return (
      myCompany.value !== null &&
      selectedCompany.value !== null && 
      selectedCompany.value.status === 'ACTIVE'
    );
  });

  return { 
    myCompany,
    selectedCompany, 
    setMyCompany,
    setCompany, 
    clearStore,
    logout,  // ← AGGIUNGI QUESTO
    isConfigured,
    canInvoice 
  };
});