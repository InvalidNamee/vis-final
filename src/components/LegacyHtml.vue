<script setup>
defineProps({ html: { type: String, default: '' } });
function toggleChecklist(event) {
  const item = event.target.closest('.cl-item');
  if (!item) return;
  const list = item.closest('.checklist');
  item.classList.toggle('done');
  if (!list) return;
  const n = list.querySelectorAll('.cl-item.done').length, total = list.querySelectorAll('.cl-item').length;
  const txt = list.querySelector('#cl-txt'), fill = list.querySelector('#cl-fill');
  if (txt) txt.textContent = `${n} / ${total}`;
  if (fill) fill.style.width = `${total ? n / total * 100 : 0}%`;
}
</script>

<template><div class="atlas-content-html" @click="toggleChecklist" v-html="html"></div></template>
