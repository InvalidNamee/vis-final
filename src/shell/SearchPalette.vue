<script setup lang="ts">
import {computed,nextTick,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import {useRouter} from 'vue-router';
import {searchSite,palette,openPalette,excerpt,type SearchKind} from '../core/search';
import Highlight from '../components/Highlight.vue';
import {lockScroll} from '../ui/scrollLock';

const router=useRouter();
const input=ref<HTMLInputElement|null>(null),list=ref<HTMLElement|null>(null),cursor=ref(0);
let opener:HTMLElement|null=null;
const KINDS:[SearchKind,string][]=[['stage','作业环节'],['scene','场景'],['method','智能方法'],['case','案例']];
const hits=computed(()=>palette.open?searchSite(palette.query):[]);
// Grouped by kind, with one flat order for keyboard navigation.
const groups=computed(()=>KINDS.map(([k,label])=>({k,label,items:hits.value.filter(h=>h.kind===k)})).filter(g=>g.items.length));
const flat=computed(()=>groups.value.flatMap(g=>g.items));
const indexOf=(id:string)=>flat.value.findIndex(h=>h.id===id);

watch(()=>palette.query,()=>{cursor.value=0;});
watch(()=>palette.open,open=>{
  lockScroll(open);
  if(open){opener=document.activeElement as HTMLElement|null;void nextTick(()=>{input.value?.focus({preventScroll:true});input.value?.select();});}
  else{opener?.focus?.({preventScroll:true});opener=null;}
});
const close=()=>{palette.open=false;};
function go(i=cursor.value){const h=flat.value[i];if(!h)return;close();void router.push(h.to);}
function move(d:number){
  const n=flat.value.length;if(!n)return;
  cursor.value=(cursor.value+d+n)%n;
  void nextTick(()=>list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'}));
}
function key(e:KeyboardEvent){
  if(e.key==='ArrowDown'){e.preventDefault();move(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();move(-1);}
  else if(e.key==='Enter'&&!e.isComposing){e.preventDefault();go();}
  else if(e.key==='Escape'){e.preventDefault();close();}
}
function globalKey(e:KeyboardEvent){
  const t=e.target as HTMLElement|null,typing=/^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName||'')||!!t?.isContentEditable;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(palette.open)close();else openPalette();}
  else if(e.key==='/'&&!typing&&!palette.open&&!document.documentElement.classList.contains('has-modal')){e.preventDefault();openPalette();}
}
onMounted(()=>window.addEventListener('keydown',globalKey));
onBeforeUnmount(()=>window.removeEventListener('keydown',globalKey));
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="palette.open" class="palette" @mousedown.self="close">
        <div class="palette-panel" role="dialog" aria-modal="true" aria-label="全站搜索">
          <div class="palette-bar">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input ref="input" v-model="palette.query" class="palette-input" type="search" placeholder="搜索环节、场景、方法或案例内容…" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" :aria-activedescendant="flat.length?`palette-${cursor}`:undefined" autocomplete="off" @keydown="key">
            <button type="button" class="palette-esc" aria-label="关闭搜索" @click="close"><kbd>ESC</kbd></button>
          </div>
          <div id="palette-list" ref="list" class="palette-list" role="listbox" aria-label="搜索结果">
            <template v-if="flat.length">
              <section v-for="g in groups" :key="g.k" class="palette-group" role="group" :aria-label="g.label">
                <h3>{{ g.label }}<span class="mono">{{ g.items.length }}</span></h3>
                <a v-for="h in g.items" :id="`palette-${indexOf(h.id)}`" :key="h.id" class="palette-item" role="option" :href="router.resolve(h.to).href" :aria-selected="indexOf(h.id)===cursor" @mousemove="cursor=indexOf(h.id)" @click.prevent="go(indexOf(h.id))">
                  <span class="pi-title"><Highlight :text="h.title" :terms="h.terms"/></span>
                  <span class="pi-sub">{{ h.sub }}</span>
                  <span class="pi-snip"><Highlight :text="excerpt(h)" :terms="h.terms"/></span>
                </a>
              </section>
            </template>
            <p v-else-if="palette.query.trim()" class="palette-empty">没有匹配“{{ palette.query.trim() }}”的内容，可换用更短的关键词。</p>
            <p v-else class="palette-empty">输入关键词检索作业环节、业务场景、智能方法与案例正文。</p>
          </div>
          <div class="palette-foot mono"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span><span><kbd>⌘</kbd><kbd>K</kbd> / <kbd>/</kbd> 唤起</span><span class="r">{{ hits.length?`${hits.length} 条结果`:'' }}</span></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
