<script setup lang="ts">
const nameSearch = ref('')

useHead({
  title: 'Home',
})

useSeoMeta({
  description:
    'See what your elected representatives are voting on at a glance.',
  robots: {
    index: true,
    follow: true,
  },
  ogType: 'website',
})

const { favorites } = useFavoriteReps()

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

const favoriteReps = await useAsyncData(
  async () => {
    if (favorites.value.length > 0) {
      return $fetch('/api/reps/byId', { query: { ids: favorites.value } })
    } else {
      return []
    }
  },
  { watch: [favorites], server: false, lazy: true, default: () => [] }
)

const filteredReps = computed(() => {
  const reps = repData.error.value == null ? repData.data.value : []

  return useUniqBy(reps, 'rep_id')
})
</script>

<template>
  <div class="md:container mx-auto flex flex-col gap-2">
    <div class="text-4xl text-center">Representative Observer</div>
    <div class="text-xl text-center">
      See what your representatives voted on.
    </div>
    <div class="text-md text-center">
      Find your representative by typing in their name. Don't know who
      represents you?
      <ULink
        to="https://www.usa.gov/elected-officials/"
        target="_blank"
        class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
        >Look them up</ULink
      >
      then come back here to see what they're doing.
    </div>
    <UInput
      size="xl"
      placeholder="What's your Representative's name?"
      class="w-full lg:w-3/5 mx-auto"
      v-model="nameSearch"
    />
    <ClientOnly>
      <h3
        v-if="
          favoriteReps.data.value &&
          favoriteReps.data.value.length > 0 &&
          nameSearch.length <= 2
        "
        class="text-bold text-lg text-center"
      >
        My Favorite Representatives
      </h3>
    </ClientOnly>
    <div class="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 my-4">
      <template
        v-if="
          favoriteReps.data.value &&
          favoriteReps.data.value.length > 0 &&
          nameSearch.length <= 2
        "
      >
        <HomeRepCard
          v-for="rep in favoriteReps.data.value"
          :name="rep.full_name!"
          :level="rep.currentTerm?.sessions?.level"
          :repId="rep.id"
          :chamber="rep.currentTerm?.sessions?.chamber"
          :state="rep.currentTerm?.state"
          :party="rep.currentTerm?.party"
          :district="rep.currentTerm?.district"
          :congress="rep.currentTerm?.sessions?.congress"
          :title="rep.currentTerm?.sessions?.title"
        />
      </template>
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
