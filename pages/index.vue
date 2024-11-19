<script setup lang="ts">
const reps = await useFetch('/api/reps/current')
</script>

<template>
  <div class="md:container mx-auto flex flex-col gap-2">
    <div class="text-4xl text-center">what the rep doin?</div>
    <div class="text-xl text-center">
      See what your representatives have been voting on at a glance.
    </div>
    <UInput size="xl" placeholder="What's your Representative's name?" class="w-full lg:w-3/5 mx-auto"/>
  </div>
</template>
