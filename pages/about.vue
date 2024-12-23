<script setup lang="ts">
import moment from 'moment'

useHead({
  title: 'rep.observer | About'
})

const statusData = useAsyncData('status', () => $fetch('/api/status'))

const statusTableData = computed(() => {
  if (statusData.data.value) {
    return statusData.data.value.map((d) => ({
      script: d.script_id,
      status: d.status,
      'Last Success': moment(d.last_success).fromNow(),
      'Last Run': moment(d.last_run).fromNow(),
    }))
  }

  return []
})
</script>

<template>
  <div class="container mx-auto">
    <h2 class="text-2xl font-bold text-center my-2">About Rep.Observer</h2>
    <p>
      Rep.observer is a data aggregator aimed at making it easy to look at the
      actual actions taken by elected officials in the United States. The data
      on this site is presented as-is with no additional commentary, and with
      back links to the page where the data was originally acquired from. The
      goal of presenting this data in this way is to make it easier for
      constituents to hold their elected officials responsible for their
      actions. Rep.observer is focused on displaying voting records for current
      representatives and started tracking national data in 2024.
    </p>
    <p class="my-2">
      This site will not automatically contact representatives for you. Links
      are provided to each representative's current homepage (for
      representatives actively serving a term), and you may express your
      approval or displeasure at their actions through their websites.
    </p>
    <p class="my-2">
      Rep.observer was created by
      <ULink
        class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
        to="https://bsky.app/profile/falindrith.me"
        target="_blank"
        >Falindrith</ULink
      >. Source code is available on
      <ULink
        class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
        to="https://github.com/ebshimizu/rep.observer"
        target="_blank"
        >GitHub</ULink
      >.
    </p>
    <h3 class="text-xl font-bold text-center my-2">Data Sources</h3>
    <p class="mb-2">
      Rep.observer currently uses the following public domain data sources for
      the national level and CA State. Want to see your state representatives on
      this site? Visit the
      <ULink
        class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
        to="https://github.com/ebshimizu/rep.observer"
        target="_blank"
        >GitHub repository</ULink
      >
      to lend a hand.
    </p>
    <ul class="list-disc list-inside">
      <li>
        <ULink
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          to="https://github.com/unitedstates/congress"
          target="_blank"
          >unitedstates/congress</ULink
        >
        - Python library that downloads and processes data from
        <ULink
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          to="https://www.govinfo.gov/"
          target="_blank"
          >GovInfo.gov</ULink
        >. This is the same data source that powers
        <ULink
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          to="https://www.govtrack.us/"
          target="_blank"
          >GovTrack.us</ULink
        >.
      </li>
      <li>
        <ULink
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          to="https://github.com/unitedstates/congress-legislators"
          target="_blank"
          >unitedstates/congress-legislators</ULink
        >
        - Identity reconciliation as members move between different levels of
        government.
      </li>
      <li>
        <ULink
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          to="https://gpo.congress.gov/"
          target="_blank"
          >Congress.gov API</ULink
        >
        - Congressional biographical info and identity verification
      </li>
      <li>
        <ULink
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          to="https://leginfo.legislature.ca.gov/faces/home.xhtml"
          target="_blank"
          >California Legislative Information</ULink
        >
        - CA State database for searching for and viewing bills.
      </li>
      <li>
        <ULink
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          to="https://www.assembly.ca.gov/assemblymembers"
          target="_blank"
          >California State Assembly</ULink
        >
        - CA State Assembly members list.
      </li>
      <li>
        <ULink
          class="hover:dark:text-blue-200 dark:text-blue-400 text-blue-600 hover:text-blue-400"
          to="https://www.senate.ca.gov/senators"
          target="_blank"
          >California State Senate</ULink
        >
        - CA State Senate members list.
      </li>
    </ul>
    <h3 class="text-xl font-bold text-center my-2">Data Update Status</h3>
    <p class="mb-2">
      This table displays the current status of the update scripts that power
      this site. Scripts that update representative data are only run if the
      representatives change. If a script has encountered an error, the dates
      for Last Success and Last Run will differ.
    </p>
    <div class="flex items-center w-full justify-center">
      <UTable
        :rows="statusTableData"
        class="border rounded border-gray-500 max-w-screen-md"
      >
        <template #status-data="{ row }">
          <UBadge
            :color="row.status === 'success' ? 'green' : 'red'"
            class="capitalize"
            >{{ row.status }}</UBadge
          >
        </template>
      </UTable>
    </div>
  </div>
</template>
