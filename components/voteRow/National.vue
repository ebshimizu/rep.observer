<script setup lang="ts">
const props = defineProps<{ vote: RepVotesResponse; repId: string }>()

const questionTitle = computed(() => {
  if (props.vote.votes.question) {
    return props.vote.votes.question
      .substring(props.vote.votes.question?.indexOf(':') + 1)
      .trim()
  }

  return ''
})
</script>

<template>
  <VoteRowBase
    :id="props.vote.votes.actions.id"
    :rep-id="props.repId"
    :vote="props.vote.vote"
    :type="props.vote.votes.type ?? ''"
    :result="props.vote.votes.result"
    :title="questionTitle"
    :tags="props.vote.votes.actions.tags ?? []"
    :date="new Date(props.vote.votes.date ?? '')"
    :required="props.vote.votes.requires"
  />
</template>
