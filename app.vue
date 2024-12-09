<script setup lang="ts">
const repItems = [
  [{
    label: 'National',
    to: '/reps/national'
  }],
  [{
    label: 'California',
    to: '/reps/CA'
  }]
]
</script>

<template>
  <div class="app">
    <div
      class="w-full sticky top-0 border-blue-800 border-b-1 bg-blue-900 z-10 flex gap-4 p-4"
    >
      <div>
        <ULink to="/" class="hover:text-blue-400">What the rep doin</ULink>
      </div>
      <div>
      <UDropdown mode="hover" :items="repItems" :popper="{ placement: 'bottom-start' }">
        <UButton trailing-icon="i-heroicons-chevron-down-20-solid">Representatives</UButton>
      </UDropdown>
      </div>
    </div>
    <div class="min-h-80">
      <NuxtLoadingIndicator />
      <NuxtPage />
    </div>
    <div class="w-full container flex justify-center mx-auto">
      <div class="text-sm">About | Data Sources | Contact</div>
    </div>
  </div>
</template>
