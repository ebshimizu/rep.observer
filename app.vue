<script setup lang="ts">
const repItems = [
  [
    {
      label: 'National',
      to: '/reps/national',
    },
  ],
  [
    {
      label: 'California',
      to: '/reps/CA',
    },
  ],
]

useHead({
  titleTemplate: (titleChunk) => `rep.observer | ${titleChunk}`
})
</script>

<template>
  <div class="app">
    <div
      class="w-full sticky top-0 border-blue-800 border-b-1 bg-blue-900 z-10 flex gap-4 p-4"
    >
      <div>
        <ULink to="/" class="hover:text-blue-400 font-bold text-gray-100"
          >Rep.observer</ULink
        >
      </div>
      <div>
        <UDropdown
          mode="click"
          :items="repItems"
          :popper="{ placement: 'bottom-start' }"
        >
          <UButton trailing-icon="i-heroicons-chevron-down-20-solid"
            >Representatives</UButton
          >
        </UDropdown>
      </div>
      <div class="flex-1"></div>
      <DarkModeSwitch />
    </div>
    <div class="min-h-80">
      <NuxtLoadingIndicator />
      <NuxtPage />
    </div>
    <div class="w-full container flex justify-center mx-auto mt-4">
      <div class="text-sm">
        <ULink
          to="/about"
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          >About</ULink
        >
        |
        <ULink
          to="mailto:falindrith_dev@proton.me"
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          >Contact</ULink
        >
        |
        <ULink
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          to="https://github.com/ebshimizu/rep.observer"
          target="_blank"
          >GitHub</ULink
        >
      </div>
    </div>
  </div>
</template>
