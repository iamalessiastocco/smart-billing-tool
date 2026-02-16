import { createRouter, createWebHistory } from 'vue-router'


import companySearch from '../views/companySearch.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'CompanySearch',
      component: companySearch
    }
  ],
})

export default router
