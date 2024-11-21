<script setup lang="ts">
import moment from 'moment'

const props = defineProps<{
  vote: string
  type: string
  date: Date
  passed: boolean
  title: string
  tags: string[]
  top_tag?: string
  required?: string
}>()

const topTag = computed(() => props.top_tag ?? props.tags[0])
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
        <div class="flex gap-1 flex-wrap">
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
      <div class="text-md font-bold">
        {{ props.title }}
      </div>
      <div class="text-md">
        <slot name="details">
          <div>
            <span>{{ props.passed ? 'Passed' : 'Failed' }}</span>
            {{ moment(props.date).format('MMMM Do YYYY') }}
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
