<script setup lang="ts">
/* Multi-select as toggle chips; emits a new array and never mutates the bound one. */
const props=defineProps<{modelValue:string[];options:{value:string;label:string;abbr?:string;color?:string}[];label:string}>();
const emit=defineEmits<{'update:modelValue':[v:string[]]}>();
function toggle(value:string){
  const on=props.modelValue.includes(value);
  emit('update:modelValue',on?props.modelValue.filter(v=>v!==value):[...props.modelValue,value]);
}
</script>

<template>
  <div class="ui-chips" role="group" :aria-label="label">
    <button v-for="o in options" :key="o.value" type="button" class="chip" :data-m="o.color" :aria-pressed="modelValue.includes(o.value)" @click="toggle(o.value)">
      <b v-if="o.abbr">{{ o.abbr }}</b>{{ o.label }}
    </button>
  </div>
</template>
