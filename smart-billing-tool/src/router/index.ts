import { createRouter, createWebHistory } from 'vue-router'

import companySearch from '../views/companySearch.vue'
import invoiceGenerator from '../views/invoiceGenerator.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'CompanySearch',
      component: companySearch
    },
    {
      path: '/checkout',
      name: 'InvoiceGenerator',
      component: invoiceGenerator
    }
  ],
})

export default router