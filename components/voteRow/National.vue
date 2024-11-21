<script setup lang="ts">
const props = defineProps<{ vote: RepVotesResponse }>()
</script>

<template>
  <div class="p-2 flex h-fit content-center">
    <div class="text-lg w-32 flex items-center justify-center shrink-0">
      {{ props.vote.vote }}
    </div>
    <div>
      <div class="text-sm">{{ props.vote.votes.type }}</div>
      <div class="text-sm">{{ props.vote.votes.date }}</div>
      <div class="font-medium">
        {{ props.vote.votes.actions.bill_type?.toUpperCase() }}
        {{ props.vote.votes.actions.number }}
        {{
          props.vote.votes.actions.short_title ??
          props.vote.votes.actions.official_title
        }}
        {{ props.vote.votes.actions.top_tag }}
      </div>
    </div>
  </div>
</template>
