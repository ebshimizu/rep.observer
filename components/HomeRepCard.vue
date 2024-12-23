<script setup lang="ts">
import numberToWords from 'number-to-words'
import { getTitle } from '~/utils/textUtils'

const props = defineProps<{
  name: string
  chamber?: string | null
  district?: number | null
  level?: string | null
  party?: string | null
  repId: string
  state?: string | null
  congress?: number | null
  title?: string | null
}>()

const roleTitle = computed(() => {
  return getTitle(props.level, props.chamber, props.state)
})

const badgeLabel = computed(() =>
  getDistrictBadge(props.level, props.district, props.party, props.state)
)

const badgeColor = computed(() => {
  return getPartyColor(props?.party ?? '') as any
})

const congressTitle = computed(() => {
  if (props.level === 'national')
    return `${numberToWords.toOrdinal(
      props.congress ?? 1
    )} United States Congress`
  else {
    if (props.state === 'CA') {
      return props.title
        ?.replace('CA State Assembly - ', '')
        .replace('CA State Senate - ', '')
    }
    return props.title
  }
})
</script>

<template>
  <ULink :to="`/rep/${props.repId}`">
    <UCard
      class="cursor-pointer hover:shadow-lg hover:outline-indigo-500 hover:outline"
      :ui="{
        background: 'bg-white dark:hover:bg-gray-800 dark:bg-gray-900 ',
      }"
    >
      <div class="text-xl font-medium flex justify-between">
        {{ props.name }}
        <UBadge
          v-if="props.level != null"
          :color="badgeColor"
          variant="subtle"
          >{{ badgeLabel }}</UBadge
        >
      </div>
      <div class="text-md dark:text-white/75">
        {{ roleTitle }}
      </div>
      <div class="text-md dark:text-white/75">
        {{ congressTitle }}
      </div>
    </UCard>
  </ULink>
</template>
