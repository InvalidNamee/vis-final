<script setup lang="ts">
/* Case body HTML (K.* output or package markup). Rendered as HTML, never compiled as a Vue template.
   The only behaviour the shell adds is the K.checklist tick-off counter. */
defineProps<{html:string}>();
function toggleChecklist(event:MouseEvent){
  const item=(event.target as Element).closest('.cl-item');
  if(!item)return;
  item.classList.toggle('done');
  const list=item.closest('.checklist');
  if(!list)return;
  const done=list.querySelectorAll('.cl-item.done').length,total=list.querySelectorAll('.cl-item').length;
  const txt=list.querySelector('#cl-txt'),fill=list.querySelector<HTMLElement>('#cl-fill');
  if(txt)txt.textContent=`${done} / ${total}`;
  if(fill)fill.style.width=`${total?done/total*100:0}%`;
}
</script>

<template><div class="content-html" @click="toggleChecklist" v-html="html"></div></template>
