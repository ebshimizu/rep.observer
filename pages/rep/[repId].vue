<script setup lang="ts">
const route = useRoute()

const repId = ref(route.params.repId as string)
const session = ref<number | undefined>(
  route.query?.session ? parseInt(route.query.session as string) : undefined
)
const itemsPerPage = ref(50)

// prevent reloading the rep name when the session changes
const lastSeenRepName = ref('')

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

// lil bit of caching
watch(
  () => {
    return repData.data?.value?.full_name
  },
  (newName, oldName) => {
    if (newName) {
      lastSeenRepName.value = newName
    }
  },
  { immediate: true }
)

// get the votes for the session. If session is not specified in query params, the API will return the
// most recent session
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

// compute the active term, either the current returned from the API or one of the terms specified by
// the session query param
const activeTerm = computed(() => {
  if (session.value != null) {
    const term = repData.data.value?.terms.find(
      (t) => t.sessions?.id === session.value
    )

    return term
  } else {
    if (repData.data.value?.currentTerm) {
      session.value = repData.data.value?.currentTerm.sessions?.id ?? 0
    }
    return repData.data.value?.currentTerm
  }
})

const availableTerms = computed(() => {
  if (repData.data.value) {
    return repData.data.value.terms.map((t) => ({
      id: t.sessions?.id,
      label: `${getTitle(
        t.sessions?.level,
        t.sessions?.chamber,
        t.party
      )} - ${getSessionTitle(
        t.sessions?.level,
        t.sessions?.congress,
        {
          start: t.sessions?.start_date,
          end: t.sessions?.end_date,
        },
        t.sessions?.title
      )}`,
    }))
  }

  return []
})

// display data
const repTitle = computed(() =>
  getTitle(
    activeTerm.value?.sessions?.level,
    activeTerm.value?.sessions?.chamber,
    activeTerm.value?.party
  )
)

const badgeLabel = computed(() =>
  getDistrictBadge(
    activeTerm.value?.sessions?.level,
    activeTerm.value?.district,
    activeTerm.value?.party,
    activeTerm.value?.state
  )
)

const badgeColor = computed(() => {
  return getPartyColor(activeTerm.value?.party ?? '') as any
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
    <div class="flex flex-col gap-2 my-2">
      <h1 class="text-3xl font-medium flex align-middle gap-2">
        {{
          lastSeenRepName === ''
            ? repData.data?.value?.full_name
            : lastSeenRepName
        }}
      </h1>
      <div>
        <UBadge v-if="repData.status.value !== 'pending'" :color="badgeColor"
          >{{ activeTerm?.sessions?.level === 'national' ? repTitle : '' }}
          {{ badgeLabel }}</UBadge
        >
        <USkeleton class="w-64 h-6 rounded-lg" v-else></USkeleton>
      </div>
      <div class="text-md">
        <UFormGroup label="Legislative Term">
          <USelectMenu
            v-model="session"
            placeholder="Select a Legislative Session"
            :options="availableTerms"
            value-attribute="id"
          >
          </USelectMenu>
        </UFormGroup>
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
      <template v-if="votes.status.value === 'pending'">
        <USkeleton class="h-32"></USkeleton>
      </template>
      <template v-else>
        <RepVoteRow
          v-for="vote of pageItems"
          :vote="vote"
          :rep-id="repId"
          :key="vote.votes.id"
        />
      </template>
    </div>
  </div>
</template>
