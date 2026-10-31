<script setup lang="ts">
import {nextTick,onBeforeUnmount,ref,useId,watch} from 'vue';
import {lockScroll} from './scrollLock';

/* Accessible dialog: Esc and backdrop close it, focus moves in and returns to the opener. */
const props=withDefaults(defineProps<{open:boolean;title:string;width?:string;dismissable?:boolean}>(),{width:'720px',dismissable:true});
const emit=defineEmits<{close:[];opened:[];closed:[]}>();
const panel=ref<HTMLElement|null>(null),titleId=useId();
let opener:HTMLElement|null=null,counted=false;
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function lock(on:boolean){if(on!==counted){counted=on;lockScroll(on);}}
watch(()=>props.open,async open=>{
  if(open){
    opener=document.activeElement as HTMLElement|null;
    lock(true);await nextTick();
    // preventScroll: focusing inside the dialog or back on a sticky opener must not move the page.
    (panel.value?.querySelector<HTMLElement>('[autofocus]')||panel.value)?.focus({preventScroll:true});
  }else{
    lock(false);
    opener?.focus?.({preventScroll:true});opener=null;
  }
},{immediate:true});
onBeforeUnmount(()=>lock(false));

function close(){if(props.dismissable)emit('close');}
// Keep Tab inside the panel.
function trap(event:KeyboardEvent){
  if(event.key==='Escape'){event.stopPropagation();close();return;}
  if(event.key!=='Tab'||!panel.value)return;
  const items=[...panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el=>el.offsetParent!==null);
  if(!items.length)return;
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal" @after-enter="emit('opened')" @after-leave="emit('closed')">
      <div v-if="open" class="ui-modal" @keydown="trap" @mousedown.self="close">
        <section ref="panel" class="ui-modal-panel" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1" :style="{'--modal-w':width}">
          <header class="ui-modal-head">
            <h2 :id="titleId">{{ title }}</h2>
            <button v-if="dismissable" class="ui-modal-x" type="button" aria-label="关闭" @click="close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
          </header>
          <div class="ui-modal-body"><slot/></div>
          <footer v-if="$slots.footer" class="ui-modal-foot"><slot name="footer"/></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
