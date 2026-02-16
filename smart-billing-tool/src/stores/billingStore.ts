import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CompanyData } from '@/types';

export const useBillingStore = defineStore('billing', () => {
  // Stato: l'azienda selezionata per la fatturazione
  const selectedCompany = ref<CompanyData | null>(null);

  // Azione: salva l'azienda nello store
  function setCompany(company: CompanyData) {
    selectedCompany.value = company;
  }

  // Azione: resetta tutto (es. dopo l'invio o per un nuovo cliente)
  function clearStore() {
    selectedCompany.value = null;
  }

  // Getter: controlla se possiamo procedere alla fatturazione
  const canInvoice = computed(() => {
    return selectedCompany.value !== null && selectedCompany.value.status === 'ACTIVE';
  });

  return { 
    selectedCompany, 
    setCompany, 
    clearStore, 
    canInvoice 
  };
});