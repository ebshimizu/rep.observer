<script setup lang="ts">
import { format } from 'date-fns'

const props = defineProps({
  modelValue: {
    type: Object as PropType<Date | undefined>,
    default: undefined,
  },
})

const emit = defineEmits(['update:model-value', 'close'])
</script>

<template>
  <UPopover :popper="{ placement: 'bottom-start' }">
    <UButton
      icon="i-heroicons-calendar-days-20-solid"
      :label="
        props.modelValue
          ? format(props.modelValue, 'd MMM, yyy')
          : 'No Date Selected'
      "
    />

    <template #panel="{ close }">
      <DatePicker
        :model-value="props.modelValue"
        @update:model-value="(v) => emit('update:model-value', v)"
        is-required
        @close="close"
      />
    </template>
  </UPopover>
</template>
