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
</script>

<template>
  <div class="p-2 flex h-fit content-center">
    <div class="text-lg w-32 flex items-center justify-center shrink-0">
      <slot name="vote">{{ props.vote }}</slot>
    </div>
    <div class="w-full">
      <div class="flex justify-between content-center">
        <div class="text-sm">
          <slot name="type">
            {{ props.type }}
            {{ props.required ? `(${props.required} Required)` : '' }}
          </slot>
        </div>
        <div class="flex gap-1 flex-wrap" v-if="props.tags != null">
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
      </div>
      <div
        class="text-md font-bold cursor-pointer hover:dark:text-blue-400"
        @click="toggleExpand"
      >
        {{ props.title }}
      </div>
      <div class="text-md">
        <slot name="details">
          <div>
            <span>{{ props.result }}</span>
            {{ moment(props.date).format('MMMM Do YYYY') }}
          </div>
        </slot>
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
    </div>
  </div>
</template>
