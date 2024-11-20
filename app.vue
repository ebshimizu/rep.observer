<script setup lang="ts">
  const links = [{
    label: 'Home',
    icon: 'i-heroicons-home',
    to: '/'
  }]
</script>

<template>
  <div class="app">
    <div class="w-full sticky top-0 border-blue-800 border-b-1 bg-blue-900 z-10">
      <UHorizontalNavigation :links="links" />
    </div>
    <div class="min-h-80">
      <NuxtPage />
    </div>
    <div class="w-full container flex justify-center mx-auto">
      <div class="text-sm">
        About | Data Sources | Contact
      </div>
    </div>
  </div>
</template>
