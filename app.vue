<script setup lang="ts">
  const links = [{
    label: 'Home',
    icon: 'i-heroicons-home',
    to: '/'
  }]
</script>

<template>
  <div class="app">
    <div class="w-full sticky top-0 border-blue-800 border-b-1 bg-blue-900">
      <UHorizontalNavigation :links="links" />
    </div>
    <div class="content">
      <NuxtPage />
    </div>
    <div class="footer">footer things</div>
  </div>
</template>
