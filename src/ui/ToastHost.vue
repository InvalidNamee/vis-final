<script setup lang="ts">
import {toasts,dismiss} from './feedback';
const ICON={ok:'✓',warn:'!',error:'✕',info:'i'};
</script>

<template>
  <Teleport to="body">
    <TransitionGroup tag="div" name="toast" class="ui-toasts" aria-live="polite">
      <div v-for="t in toasts" :key="t.id" class="ui-toast" :data-kind="t.kind" :role="t.kind==='error'?'alert':'status'">
        <span class="ui-toast-ic" aria-hidden="true">{{ ICON[t.kind] }}</span>
        <span class="ui-toast-txt"><b>{{ t.title }}</b><small v-if="t.sub">{{ t.sub }}</small></span>
        <button type="button" class="ui-toast-x" aria-label="关闭提示" @click="dismiss(t.id)">×</button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>
