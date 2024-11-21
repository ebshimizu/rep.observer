<script setup lang="ts">
const route = useRoute()

const repId = ref(route.params.repId)
const session = ref(route.query?.session ?? undefined)
const itemsPerPage = ref(50)

// this might have to be computed at some point, if filtered values change we have to clamp
const currentPage = ref(1)

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

const sessionTitle = computed(() =>
  getSessionTitle(
    repData.data.value?.term.sessions?.level,
    repData.data.value?.term.sessions?.congress,
    {
      start: repData.data.value?.term.sessions?.start_date,
      end: repData.data.value?.term.sessions?.end_date,
    }
  )
)

const badgeLabel = computed(() =>
  getDistrictBadge(
    repData.data.value?.term.sessions?.level,
    repData.data.value?.term?.district,
    repData.data.value?.term?.party,
    repData.data.value?.term?.state
  )
)

const badgeColor = computed(() => {
  return getPartyColor(repData.data.value?.term?.party ?? '') as any
})

const pageItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value

  return votes.data.value?.slice(start, end) ?? []
})
</script>

<template>
  <div class="container mx-auto">
    <div class="flex flex-col gap-1 my-2">
      <h1 class="text-3xl font-medium flex align-middle gap-2">
        {{ repData.data.value?.full_name }}
      </h1>
      <div class="text-md">{{ sessionTitle }}</div>
      <div>
        <UBadge :color="badgeColor">{{ repTitle }} {{ badgeLabel }}</UBadge>
      </div>
    </div>
    <div class="border rounded border-blue-500">
      <div class="border-b rounded border-blue-500 p-2">
        <div class="flex gap-2 justify-between">
          <UPagination
            :page-count="itemsPerPage"
            :total="votes.data.value?.length ?? 0"
            v-model="currentPage"
          />
          <div class="flex gap-1">search | filters</div>
        </div>
        <UDivider class="my-2"></UDivider>
        <div class="w-full mt-2">Filters</div>
      </div>
      <RepVoteRow v-for="vote of pageItems" :vote="vote" />
    </div>
  </div>
</template>
