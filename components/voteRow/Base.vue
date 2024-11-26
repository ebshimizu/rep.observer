<script setup lang="ts">
import moment from 'moment'

const props = defineProps<{
  id: string
  repId: string
  vote: string
  type: string
  date: Date
  result?: string
  title: string
  tags?: string[]
  top_tag?: string
  required?: string
}>()

const expanded = ref(false)

const voteDataCache = ref<any>(undefined)

const topTag = computed(() => props.top_tag ?? props.tags?.[0])

const expand = async () => {
  expanded.value = true
  if (voteDataCache.value == null) {
    // fetch the expanded data
    voteDataCache.value = await $fetch(`/api/action/${props.id}/${props.repId}/votes`)
    console.log(voteDataCache.value)
  }
}
</script>

<template>
  <div class="p-2 flex h-fit content-center dark:bg-zinc-700 dark:hover:bg-zinc-600">
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
          <UPopover mode="hover">
            <UBadge variant="soft" size="xs">{{ topTag }}</UBadge>

            <template #panel>
              <div class="p-2 w-80">
                <div class="text-lg mb-2">All Tags</div>
                <div class="flex flex-wrap gap-2 max-h-80 overflow-auto">
                  <UBadge v-for="tag in props.tags" size="xs">{{ tag }}</UBadge>
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
      <div class="text-md font-bold cursor-pointer" @click="expand">
        {{props.id}} {{ props.title }}
      </div>
      <div class="text-md">
        <slot name="details">
          <div>
            <span>{{ props.result }}</span>
            {{ moment(props.date).format('MMMM Do YYYY') }}
          </div>
        </slot>
      </div>
    </div>
    <div v-if="expanded">
    </div>
  </div>
</template>
