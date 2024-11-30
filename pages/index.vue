<script setup lang="ts">
const nameSearch = ref('')

const repData = await useAsyncData(
  'currentReps',
  async () => {
    if (nameSearch.value.length > 2) {
      return await $fetch('/api/reps/current', {
        query: { search: nameSearch.value },
      })
    } else {
      return []
    }
  },
  {
    watch: [nameSearch],
    dedupe: 'cancel',
  }
)

const filteredReps = computed(() => {
  const reps = repData.error.value == null ? repData.data.value : []

  return useUniqBy(reps, 'rep_id')
})
</script>

<template>
  <div class="md:container mx-auto flex flex-col gap-2">
    <div class="text-4xl text-center">what the rep doin?</div>
    <div class="text-xl text-center">
      See what your representatives have been voting on
    </div>
    <UInput
      size="xl"
      placeholder="What's your Representative's name?"
      class="w-full lg:w-3/5 mx-auto"
      v-model="nameSearch"
    />
    <div class="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 my-4">
      <template v-if="repData.status.value === 'pending'">
        <USkeleton class="h-32"></USkeleton>
        <USkeleton class="h-32"></USkeleton>
        <USkeleton class="h-32"></USkeleton>
      </template>
      <template v-else-if="nameSearch.length > 2 && filteredReps?.length === 0">
        <div>No representatives found with that name</div>
      </template>
      <template v-else>
        <HomeRepCard
          v-for="rep in filteredReps"
          :name="rep.full_name!"
          :level="rep.level"
          :repId="rep.rep_id!"
          :chamber="rep.chamber"
          :state="rep.state"
          :party="rep.party"
          :district="rep.district"
          :congress="rep.congress"
          :title="rep.title"
        />
      </template>
    </div>
  </div>
</template>
