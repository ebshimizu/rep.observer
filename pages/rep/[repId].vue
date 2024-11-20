<script setup lang="ts">
const route = useRoute()

const repId = ref(route.params.repId)
const session = ref(route.query?.session ?? undefined)
const itemsPerPage = ref(50)

// this might have to be computed at some point, if filtered values change we have to clamp
const currentPage = ref(0)

const repData = useAsyncData(
  'repInfo',
  () => {
    const query: Record<string, any> = {}

    if (session.value != null) {
      query['session'] = session.value
    }

    return $fetch(`/api/rep/${repId.value}`, { query })
  },
  {
    watch: [session],
  }
)

const votes = useAsyncData(
  'votes',
  () => {
    const query: Record<string, any> = {}

    if (session.value != null) {
      query['session'] = session.value
    }

    return $fetch(`/api/rep/${repId.value}/votes`, { query })
  },

  {
    watch: [session],
  }
)

// display data
const repTitle = computed(() =>
  getTitle(
    repData.data.value?.term.sessions?.level,
    repData.data.value?.term.sessions?.chamber
  )
)

const pageCount = computed(() =>
  Math.ceil((votes.data.value?.length ?? 0) / itemsPerPage.value)
)
const pageItems = computed(() => {
  const start = currentPage.value * itemsPerPage.value
  const end = start + itemsPerPage.value

  return votes.data.value?.slice(start, end) ?? []
})
</script>

<template>
  <div class="md:container mx-auto">
    <div class="flex flex-col gap-2">
      <div class="text-lg font-medium">{{ repData.data.value?.full_name }}</div>
      <div class="text-md">{{ repTitle }}</div>
    </div>
    <div class="relative">
      <div class="absolute top-0 left-0 w-80"></div>
      <div class="ml-80">
        <div class="border-2 rounded border-indigo-500 p-2">
          {{ currentPage }} of {{ pageCount }}
        </div>
        <div v-for="vote of pageItems" class="p-2">
          <div class="text-lg">{{ vote.vote }}</div>
          <div class="text-sm">{{ vote.votes.type }}</div>
          <div class="text-sm">{{ vote.votes.date }}</div>
          <div class="font-medium">
            {{ vote.votes.actions.bill_type?.toUpperCase() }}
            {{ vote.votes.actions.number }}
            {{
              vote.votes.actions.short_title ??
              vote.votes.actions.official_title
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
