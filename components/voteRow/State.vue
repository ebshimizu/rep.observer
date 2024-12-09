<script setup lang="ts">
const props = defineProps<{ vote: RepVotesResponse; repId: string }>()

const questionTitle = computed(() => {
  if (props.vote.votes.question) {
    return props.vote.votes.question.trim()
  }

  return ''
})

// this is CA specific right now so once we get a new state, we should lift this somewhere else
const links = [
  [
    {
      icon: 'heroicons:document-text-solid',
      label: 'Bill Text',
      to: props.vote.votes.actions.source_url,
      target: '_blank',
    },
    {
      icon: 'heroicons:question-mark-circle',
      label: 'Status',
      to: `https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id=${props.vote.votes.actions.id}`,
      target: '_blank',
    },
    {
      icon: 'heroicons:magnifying-glass-16-solid',
      label: 'Analysis',
      to: `https://leginfo.legislature.ca.gov/faces/billAnalysisClient.xhtml?bill_id=${props.vote.votes.actions.id}`,
      target: '_blank',
    },
  ],
]
</script>

<template>
  <VoteRowBase
    :action-id="props.vote.votes.actions.id"
    :rep-id="props.repId"
    :vote="props.vote.vote"
    :type="props.vote.votes.type ?? ''"
    :result="props.vote.votes.result"
    :title="questionTitle"
    :full-title="props.vote.votes.actions.official_title"
    :tags="props.vote.votes.actions.tags"
    :date="new Date(props.vote.votes.date ?? '')"
  >
    <template #links>
      <UDropdown :items="links" :popper="{ placement: 'bottom-end' }">
        <UButton
          size="xs"
          :ui="{ rounded: 'rounded-full' }"
          icon="heroicons:information-circle"
        />
      </UDropdown>
    </template>
  </VoteRowBase>
</template>
