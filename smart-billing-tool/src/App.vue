<template>
  <div id="app-container">
    <header>
      <h1>Smart Checkout & Billing</h1>
    </header>

    <main>
      <section class="setup-section">
        <CompanySetup />
      </section>

      <hr />

      <section class="workflow-section">
        <router-view></router-view>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// Importiamo il nuovo componente di onboarding
import CompanySetup from '@/components/companySetup.vue';
</script>

<style>
#app-container {
  font-family: Arial, sans-serif;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 40px;
  color: #2c3e50;
}

.setup-section {
  margin-bottom: 30px;
}

hr {
  border: 0;
  border-top: 1px solid #eee;
  margin: 40px 0;
}
</style>