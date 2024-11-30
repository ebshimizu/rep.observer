<script setup lang="ts">
const props = defineProps<{ vote: RepVotesResponse; repId: string }>()
</script>

<template>
  <VoteRowNational
    v-if="props.vote.votes.actions.level === 'national'"
    :vote="props.vote"
    :rep-id="props.repId"
  />
  <VoteRowState
    v-else
    :vote="props.vote"
    :rep-id="props.repId"
  />
</template>
