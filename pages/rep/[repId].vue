<script setup lang="ts">
import { useRewriteQueryParams } from '~/composables/useRewriteQueryParams'

// maybe we do move this to a composable eventually
interface RepFilters {
  searchText: string
  dateRange: { start?: Date; end?: Date }
  tags: string[]
  type: string
}

const route = useRoute()

const repId = ref(route.params.repId as string)
const session = ref<number | undefined>(
  route.query?.session ? parseInt(route.query.session as string) : undefined
)
const itemsPerPage = ref(50)

// search filters
// these are inferred from the route
const filters = ref<RepFilters>({
  searchText: (route.query?.search as string) ?? '',
  dateRange: {
    start: route.query?.startDate
      ? new Date(route.query.date as string)
      : undefined,
    end: route.query?.endDate
      ? new Date(route.query.endDate as string)
      : undefined,
  },
  tags: route.query?.tags ? JSON.parse(route.query.tags as string) : [],
  type: (route.query?.type as string) ?? '',
})

// prevent reloading the rep name when the session changes
const lastSeenRepName = ref('')

// header data
useHead({
  title: computed(
    () => `rep.observer | Voting Record for ${lastSeenRepName.value}`
  ),
  link: [{ rel: 'canonical', content: `https://rep.observer${route.path}` }],
})

useSeoMeta({
  description: computed(
    () =>
      `Voting record for ${lastSeenRepName.value}'s most recent elected term. See what ${lastSeenRepName.value} voted on.'`
  ),
  ogUrl: computed(
    () => `https://rep.observer${route.path}?session=${session.value}`
  ),
  ogTitle: computed(
    () => `rep.observer | Voting Record for ${lastSeenRepName.value}`
  ),
  ogDescription: computed(
    () =>
      `View the voting record for ${lastSeenRepName.value}.'`
  ),
  ogLocale: 'en_US',
  ogSiteName: 'rep.observer',
})

// this might have to be computed at some point, if filtered values change we have to clamp
const currentPage = ref(1)

// retrieve rep data
const repData = useAsyncData(
  'repInfo',
  () => {
    const query: Record<string, any> = {}

    if (session.value != null) {
      query['session'] = session.value
    }

    return $fetch<RepInfoResponse>(`/api/rep/${repId.value}`, { query })
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

// update the url when the session changes (or other things?)
const { rewriteQueryParams } = useRewriteQueryParams()
watch(
  () => ({
    session: session.value,
  }),
  (newParams) => {
    rewriteQueryParams(newParams)
  }
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
    watch: [session, repId],
  }
)

// compute the active term, either the current returned from the API or one of the terms specified by
// the session query param
const activeTerm = computed(() => {
  if (session.value != null) {
    const term = repData.data.value?.terms.find(
      (t) => t.sessions?.id === session.value
    )

    // if you did not specify a valid session id, then we reset to the current
    if (term == null) {
      session.value = repData.data.value?.currentTerm.sessions?.id ?? 0
      return repData.data.value?.currentTerm
    } else {
      return term
    }
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
      label: `${
        t.sessions?.level === 'national'
          ? `${getTitle(t.sessions?.level, t.sessions?.chamber, t.party)} -`
          : ''
      }${getSessionTitle(
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

// let's compute these at the same time, they use the same data so we should
// iterate over the entire list of votes once
const availableTagsAndTypes = computed(() => {
  const tags = new Set<string>()
  const types = new Set<string>()

  votes.data.value?.forEach((v) => {
    if (v.votes.actions.top_tag) {
      tags.add(v.votes.actions.top_tag.toLowerCase())
    }
    if (v.votes.actions.tags) {
      v.votes.actions.tags.forEach((t) => tags.add(t.toLowerCase()))
    }
    if (v.votes.type) {
      types.add(v.votes.type.toLowerCase())
    }
  })

  // we will need to have a better state level override
  // only national uses useful tags, so we'll only return them in that mode
  const useTags = activeTerm.value?.sessions.level === 'national'

  return {
    tags: useTags ? Array.from(tags) : [],
    types: ['', ...Array.from(types)],
  }
})

const hasFilters = computed(() => {
  return (
    filters.value.searchText !== '' ||
    filters.value.dateRange.start ||
    filters.value.dateRange.end ||
    filters.value.tags.length > 0 ||
    filters.value.type !== ''
  )
})

/**
 * Items filtered by the search criteria
 */
const filteredItems = computed(() => {
  // filter on return
  const items =
    votes.data.value?.filter((i) => {
      let pass = true

      if (filters.value.searchText !== '') {
        pass =
          pass &&
          (i.votes.question
            ?.toLowerCase()
            .includes(filters.value.searchText.toLowerCase()) ??
            false)
      }

      const date = new Date(i.votes.date ?? '1776-07-04')

      if (filters.value.dateRange.start != null) {
        pass = pass && filters.value.dateRange.start.getTime() <= date.getTime()
      }

      if (filters.value.dateRange.end != null) {
        pass = pass && date.getTime() <= filters.value.dateRange.end.getTime()
      }

      if (filters.value.tags.length > 0) {
        // inclusive search
        pass =
          pass &&
          filters.value.tags.some((t) => {
            return (
              i.votes.actions.tags?.find(
                (vt) => vt.toLowerCase() === t.toLowerCase()
              ) != null || i.votes.actions.top_tag?.toLowerCase() === t
            )
          })
      }

      if (filters.value.type !== '') {
        pass = pass && i.votes.type?.toLowerCase() === filters.value.type
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

function clearStartDate() {
  filters.value.dateRange.start = undefined
}

function clearEndDate() {
  filters.value.dateRange.end = undefined
}

function resetFilters() {
  filters.value = {
    searchText: '',
    dateRange: {
      start: undefined,
      end: undefined,
    },
    tags: [],
    type: '',
  }
}

const pageItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value

  return filteredItems.value.slice(start, end)
})
</script>

<template>
  <div class="container mx-auto">
    <div class="flex flex-col gap-2 my-2">
      <div class="flex gap-2">
        <h1 class="text-3xl font-medium flex align-middle gap-2">
          {{
            lastSeenRepName === ''
              ? repData.data?.value?.full_name
              : lastSeenRepName
          }}
        </h1>
        <UButton
          v-if="repData.data?.value?.homepage"
          icon="heroicons:home-solid"
          variant="soft"
          color="green"
          :to="repData.data?.value?.homepage"
          target="_blank"
        />
      </div>
      <div>
        <UBadge v-if="repData.status.value !== 'pending'" :color="badgeColor"
          >{{ activeTerm?.sessions?.level === 'national' ? repTitle : '' }}
          {{ badgeLabel }}</UBadge
        >
        <USkeleton class="w-64 h-6 rounded-lg" v-else></USkeleton>
      </div>
      <div class="text-md">
        <ClientOnly>
          <UFormGroup label="Legislative Term">
            <USelectMenu
              v-model="session"
              placeholder="Select a Legislative Session"
              :options="availableTerms"
              value-attribute="id"
            >
            </USelectMenu>
          </UFormGroup>
        </ClientOnly>
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
          <div class="flex gap-1"></div>
        </div>
        <UDivider class="my-2"></UDivider>
        <div class="w-full mt-2 flex gap-2 md:flex-row flex-col">
          <div>
            <div class="text-sm">Title Search</div>
            <UInput
              v-model="filters.searchText"
              icon="i-heroicons-magnifying-glass-20-solid"
              size="md"
              color="white"
              placeholder="Search Titles"
            ></UInput>
          </div>
          <div>
            <div class="text-sm">Start Date</div>
            <div class="flex gap-1">
              <ClientOnly
                ><DatePickerButton v-model="filters.dateRange.start"
              /></ClientOnly>
              <UButton
                v-if="filters.dateRange.start != null"
                color="red"
                square
                icon="icon-park-solid:clear-format"
                @click="clearStartDate"
              />
            </div>
          </div>
          <div>
            <div class="text-sm">End Date</div>
            <div class="flex gap-1">
              <ClientOnly>
                <DatePickerButton v-model="filters.dateRange.end" />
              </ClientOnly>
              <UButton
                v-if="filters.dateRange.end != null"
                color="red"
                square
                icon="icon-park-solid:clear-format"
                @click="clearEndDate"
              />
            </div>
          </div>
          <div v-if="availableTagsAndTypes.types.length > 0">
            <div class="text-sm">Vote Type</div>
            <ClientOnly>
              <USelectMenu
                searchable
                :options="availableTagsAndTypes.types"
                v-model="filters.type"
                class="w-full md:w-48"
              >
                <template #option="{ option }">
                  <span class="capitalize">{{
                    option === '' ? 'All Vote Types' : option
                  }}</span>
                </template>
              </USelectMenu>
            </ClientOnly>
          </div>
          <div v-if="availableTagsAndTypes.tags.length > 0">
            <div class="text-sm">Tags</div>
            <ClientOnly>
              <USelectMenu
                searchable
                multiple
                :options="availableTagsAndTypes.tags"
                v-model="filters.tags"
                class="w-full md:w-48"
              >
                <template #option="{ option }">
                  <span class="capitalize">{{ option }}</span>
                </template>
              </USelectMenu>
            </ClientOnly>
          </div>
          <div v-if="hasFilters" class="flex items-end pb-1">
            <UButton
              color="red"
              icon="icon-park-solid:clear-format"
              @click="resetFilters"
              >Clear Filters</UButton
            >
          </div>
        </div>
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
