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

const govtrackBillUrl = `https://www.govtrack.us/congress/bills/${props.vote.votes.actions.congress}/${props.vote.votes.actions.bill_type}${props.vote.votes.actions.number}`

// vote url is a bit more complicated
let govtrackVoteUrl = ''
if (props.vote.votes.alternate_id) {
  const parts = props.vote.votes.alternate_id?.split('-')

  const id = parts[0]
  const session = parts[1]

  const sessionParts = session.split('.')

  govtrackVoteUrl = `https://www.govtrack.us/congress/votes/${sessionParts[0]}-${sessionParts[1]}/${id}`
}

// congress.gov is yet another url format
// and it uses ordinals
const congressUrl = getCongressUrl(
  props.vote.votes.actions.congress ?? 1,
  props.vote.votes.actions.bill_type ?? '',
  props.vote.votes.actions.number ?? 0
)

const links = [
  [
    ...(congressUrl
      ? [
          {
            icon: 'heroicons:building-library-16-solid',
            label: 'Congress.gov Summary',
            to: congressUrl,
            target: '_blank',
          },
        ]
      : []),
    ...(props.vote.votes.actions.bill_type != null
      ? [
          {
            icon: 'uil:document-info',
            label: 'GovTrack Bill Info',
            to: govtrackBillUrl,
            target: '_blank',
          },
        ]
      : []),
    {
      icon: 'heroicons:chat-bubble-left-right-16-solid',
      label: 'GovTrack Vote Info',
      to: govtrackVoteUrl,
      target: '_blank',
    },
    {
      icon: 'heroicons:code-bracket',
      label: 'Motion Source File',
      to: props.vote.votes.actions.source_url,
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
    :tags="props.vote.votes.actions.tags ?? []"
    :date="new Date(props.vote.votes.date ?? '')"
    :required="props.vote.votes.requires"
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
