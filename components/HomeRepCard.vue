<script setup lang="ts">
import numberToWords from 'number-to-words'
import { getTitle } from '~/utils/textUtils';

const props = defineProps<{
  name: string
  chamber?: string | null
  district?: number | null
  level?: string | null
  party?: string | null
  repId: string
  state?: string | null
  congress?: number | null
}>()

const roleTitle = computed(() => {
  return getTitle(props.level, props.chamber)
})

const badgeLabel = computed(() => {
  if (props.level === 'national') {
    const district = props.district ? ` District ${props.district}` : ''
    return `${props.party?.charAt(0)}-${props.state}${district}`
  }
})

const badgeColor = computed(() => {
  return getPartyColor(props?.party ?? '') as any
})

const congressTitle = computed(() => {
  return props.level === 'national'
    ? `${numberToWords.toOrdinal(props.congress ?? 1)} United States Congress`
    : ''
})

const goToRep = () => {
  return navigateTo({
    path: `/rep/${props.repId}`,
  })
}
</script>

<template>
  <UCard
    class="cursor-pointer hover:shadow-lg hover:outline-indigo-500 hover:outline"
    :ui="{
      background: 'bg-white dark:hover:bg-gray-800 dark:bg-gray-900 ',
    }"
    @click="goToRep"
  >
    <div class="text-xl font-medium flex justify-between">
      {{ props.name }}
      <UBadge v-if="props.level != null" :color="badgeColor" variant="subtle">{{
        badgeLabel
      }}</UBadge>
    </div>
    <div class="text-md dark:text-white/75">
      {{ roleTitle }}
    </div>
    <div v-if="props.level === 'national'" class="text-md dark:text-white/75">
      {{ congressTitle }}
    </div>
  </UCard>
</template>
