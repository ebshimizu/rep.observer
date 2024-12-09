<script setup lang="ts">
import moment from 'moment'
import type { ActionRepVotesResponse } from '~/utils/correctedDbTypes'

const props = defineProps<{
  actionId: string
  repId: string
  vote: string
  type: string
  date: Date
  result?: string
  title: string
  fullTitle?: string
  tags?: string[]
  top_tag?: string
  required?: string
}>()

const expanded = ref(false)

const voteDataCache = ref<ActionRepVotesResponse>([])

const topTag = computed(() => props.top_tag ?? props.tags?.[0])

const toggleExpand = async () => {
  expanded.value = !expanded.value
  if (voteDataCache.value.length === 0) {
    // fetch the expanded data
    const data = await $fetch(
      `/api/action/${props.actionId}/${props.repId}/votes`
    )
    if (data) {
      voteDataCache.value = data as ActionRepVotesResponse
    }
  }
}

const relatedVoteItems = computed(() => {
  return voteDataCache.value
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((v) => ({
      id: v.id,
      date: moment(v.date).format('MMMM Do YYYY'),
      repVote:
        v.rep_votes.length > 0 ? v.rep_votes[0].vote : '[In Other Chamber]',
      result: v.result,
      motion: {
        value: `${v.type}`,
        class: 'text-wrap',
      },
    }))
})

const relatedVoteColumns = [
  {
    key: 'repVote',
    label: "Rep's Vote",
  },
  {
    key: 'result',
    label: 'Result',
  },
  {
    key: 'motion',
    label: 'Motion',
  },
  {
    key: 'date',
    label: 'Date',
  },
]

const resultColor = computed(() => {
  const res = `${props.result?.toLowerCase()}`

  if (res === 'pass' || res === 'passed') {
    return 'green'
  } else if (res === 'fail' || res === 'failed') {
    return 'red'
  }
})
</script>

<template>
  <div class="p-2 flex h-fit content-center flex-col md:flex-row">
    <div class="text-xl font-bold capitalize md:w-32 w-full flex items-center justify-center shrink-0 mb-2 md:mb-0">
      <slot name="vote">{{ props.vote }}</slot>
    </div>
    <div class="w-full flex flex-row md:flex-col gap-1">
      <div class="w-full flex gap-1 md:gap-2 items-center md:items-end flex-col md:flex-row">
        <slot name="result">
          <div>
            <UBadge :color="resultColor" variant="subtle" class="capitalize"
              >{{ props.result }}
              {{ props.required ? `(${props.required})` : '' }}
            </UBadge>
          </div>
        </slot>
        <slot name="type">
          <div class="text-md">
            {{ props.type == null || props.type === 'undefined' ? '' : props.type }}
          </div>
        </slot>
        <slot name="date">
          <div class="text-sm font-bold text-slate-400">
          {{ moment(props.date).format('MMMM Do YYYY') }}
          </div>
        </slot>
        <div class="grow"></div>
        <slot name="tags">
          <div v-if="props.tags != null && props.tags.length > 0" class="w-fit">
            <ClientOnly>
              <UPopover mode="hover">
                <UBadge variant="soft" size="xs">{{ topTag }}</UBadge>

                <template #panel>
                  <div class="p-2 w-80">
                    <div class="text-lg mb-2">All Tags</div>
                    <div class="flex flex-wrap gap-2 max-h-80 overflow-auto">
                      <UBadge v-for="tag in props.tags" size="xs">{{
                        tag
                      }}</UBadge>
                    </div>
                  </div>
                </template>
              </UPopover>
            </ClientOnly>
          </div>
        </slot>
        <div class="flex gap-1">
          <slot name="links"></slot>
        </div>
      </div>
      <div class="w-full flex justify-between">
        <slot name="title">
          <div
            class="cursor-pointer hover:dark:text-blue-400 font-semibold"
            @click="toggleExpand"
          >
            {{ props.title }}
          </div>
        </slot>
      </div>
    </div>
  </div>
  <div class="flex flex-col gap-2 px-8 mt-2" v-if="expanded">
    <h4 class="font-bold text-sm">Full Title</h4>
    <div>{{ props.fullTitle ?? props.title }}</div>
    <h4 class="font-bold text-sm">Related Votes</h4>
    <div v-if="voteDataCache.length === 0">
      <USkeleton class="w-full h-4 mb-2"></USkeleton>
      <USkeleton class="w-full h-4 mb-2"></USkeleton>
      <USkeleton class="w-full h-4 mb-2"></USkeleton>
    </div>
    <UTable
      v-if="voteDataCache.length > 0"
      :columns="relatedVoteColumns"
      :rows="relatedVoteItems"
      class="border dark:border-gray-500 rounded-sm"
    >
      <template #motion-data="{ row }">
        {{ row.motion.value }}
      </template>
    </UTable>
  </div>
</template>
