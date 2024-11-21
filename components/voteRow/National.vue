<script setup lang="ts">
const props = defineProps<{ vote: RepVotesResponse }>()

const questionTitle = computed(() => {
  if (props.vote.votes.question) {
    return props.vote.votes.question.substring(props.vote.votes.question?.indexOf(':') + 1).trim()
  }

  return ''
})
</script>

<template>
  <VoteRowBase
    :vote="props.vote.vote"
    :type="props.vote.votes.type ?? ''"
    :passed="props.vote.votes.result?.toLowerCase() === 'passed'"
    :title="questionTitle"
    :tags="props.vote.votes.actions.tags ?? []"
    :date="new Date(props.vote.votes.date ?? '')"
    :required="props.vote.votes.requires"
  />
</template>
