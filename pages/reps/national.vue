<script setup lang="ts">
const reps = await useFetch('/api/reps/current', {
  query: { level: 'national' },
})

// split reps by chamber
const byChamber = computed(() => {
  // TODO: clean up types
  const d: Record<string, any[]> = {}

  reps.data.value?.forEach((r) => {
    if (r.chamber) {
      if (!(r.chamber in d)) {
        d[r.chamber] = []
      }

      d[r.chamber].push(r)
    }
  })

  Object.keys(d).forEach(chamber => {
    d[chamber] = useSortBy(d[chamber], ['full_name'])
  })

  return d
})
</script>

<template>
  <div class="md:container mx-auto flex flex-col gap-2">
    <template v-for="(members) of byChamber">
      <h2 class="text-2xl text-center">Members of the {{ members[0].title }}</h2>
      <UDivider></UDivider>
      <ul>
        <li v-for="rep of members">
          <ULink class="hover:text-blue-400" :to="`/rep/${rep.rep_id}`"
            >{{ rep.full_name }} -
            {{
              getDistrictBadge(rep.level, rep.district, rep.party, rep.state)
            }}</ULink
          >
        </li>
      </ul>
    </template>
  </div>
</template>
