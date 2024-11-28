<script setup lang="ts">
const links = [
  {
    label: 'Home',
    icon: 'i-heroicons-home',
    to: '/',
  },
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
      <UPopover mode="hover" :popper="{ placement: 'bottom-start' }">
        <UButton>Representatives</UButton>
        <template #panel>
          <div class="p-4">
            <ULink to="/reps/national" class="cursor-pointer hover:text-blue-400">National</ULink>
          </div>
        </template>
      </UPopover>
    </div>
    <div class="min-h-80">
      <NuxtPage />
    </div>
    <div class="w-full container flex justify-center mx-auto">
      <div class="text-sm">About | Data Sources | Contact</div>
    </div>
  </div>
</template>
