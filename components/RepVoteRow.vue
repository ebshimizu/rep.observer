<script setup lang="ts">
const props = defineProps<{ vote: RepVotesResponse }>()
</script>

<template>
  <VoteRowNational v-if="props.vote.votes.actions.level === 'national'" :vote="props.vote" />
</template>
