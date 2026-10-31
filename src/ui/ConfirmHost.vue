<script setup lang="ts">
import {computed} from 'vue';
import Modal from './Modal.vue';
import {confirmState,settle} from './feedback';
const current=computed(()=>confirmState.current);
</script>

<template>
  <Modal :open="!!current" :title="current?.title||''" width="440px" @close="settle(false)">
    <p class="ui-confirm-body">{{ current?.body }}</p>
    <template #footer>
      <button type="button" class="btn" @click="settle(false)">{{ current?.cancel }}</button>
      <button type="button" class="btn" :class="current?.danger?'danger':'primary'" autofocus @click="settle(true)">{{ current?.ok }}</button>
    </template>
  </Modal>
</template>
