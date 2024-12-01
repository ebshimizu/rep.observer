<script setup lang="ts">
const route = useRoute()

const repId = ref(route.params.repId as string)
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
    repData.data.value?.term.sessions?.chamber,
    repData.data.value?.term.party
  )
)

const sessionTitle = computed(() =>
  getSessionTitle(
    repData.data.value?.term.sessions?.level,
    repData.data.value?.term.sessions?.congress,
    {
      start: repData.data.value?.term.sessions?.start_date,
      end: repData.data.value?.term.sessions?.end_date,
    },
    repData.data.value?.term.sessions?.title
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

// search filters
const searchText = ref('')

const filteredItems = computed(() => {
  // filter on return
  const items =
    votes.data.value?.filter((i) => {
      let pass = true

      if (searchText.value !== '') {
        pass =
          i.votes.question
            ?.toLowerCase()
            .includes(searchText.value.toLowerCase()) ?? false
      }

      return pass
    }) ?? []

  // page check
  if (items.length > 0) {
    if (currentPage.value > Math.ceil(items.length / itemsPerPage.value)) {
      currentPage.value = Math.floor(items.length / itemsPerPage.value)
    }

    if (currentPage.value <= 0) {
      currentPage.value = 1
    }
  } else {
    currentPage.value = 1
  }

  return items
})

const pageItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value

  return filteredItems.value.slice(start, end)
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
        <UBadge :color="badgeColor"
          >{{
            repData.data.value?.term.sessions?.level === 'national'
              ? repTitle
              : ''
          }}
          {{ badgeLabel }}</UBadge
        >
      </div>
    </div>
    <div class="border rounded border-blue-500">
      <div class="border-b rounded border-blue-500 p-2">
        <div class="flex gap-2 justify-between">
          <UPagination
            :page-count="itemsPerPage"
            :total="filteredItems.length"
            v-model="currentPage"
          />
          <div class="flex gap-1">
            <UInput
              v-model="searchText"
              icon="i-heroicons-magnifying-glass-20-solid"
              size="md"
              color="white"
              placeholder="Search Titles"
            ></UInput>
            <UButton
              color="primary"
              variant="outline"
              icon="mdi:filter"
            ></UButton>
          </div>
        </div>
        <UDivider class="my-2"></UDivider>
        <div class="w-full mt-2">Filters</div>
      </div>
      <RepVoteRow
        v-for="vote of pageItems"
        :vote="vote"
        :rep-id="repId"
        :key="vote.votes.id"
      />
    </div>
  </div>
</template>
