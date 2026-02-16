// src/stores/billingStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CompanyData } from '@/types';

export const useBillingStore = defineStore('billing', () => {
  // NUOVO: La mia azienda (mittente)
  const myCompany = ref<CompanyData | null>(null);
  
  // Azienda destinataria (cliente)
  const selectedCompany = ref<CompanyData | null>(null);

  // NUOVO: Azione per impostare la propria azienda
  function setMyCompany(company: CompanyData) {
    myCompany.value = company;
  }

  function setCompany(company: CompanyData) {
    selectedCompany.value = company;
  }

  function clearStore() {
    selectedCompany.value = null;
  }

  // NUOVO: Controllo se ho configurato la mia azienda
  const isConfigured = computed(() => {
    return myCompany.value !== null;
  });

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
    isConfigured,
    canInvoice 
  };
});