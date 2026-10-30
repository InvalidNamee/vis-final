<script setup lang="ts">
import {computed,ref,watch,nextTick,onMounted,onBeforeUnmount} from 'vue';
import {useRouter} from 'vue-router';
import {useSearch,palette,openPalette,excerpt,type SearchKind} from '../../composables/useSearch';
import Hl from '../common/Hl.vue';
const router=useRouter(),{search}=useSearch();
const input=ref<HTMLInputElement|null>(null),list=ref<HTMLElement|null>(null),cursor=ref(0);
const KINDS:[SearchKind,string][]=[['stage','作业环节'],['scene','场景'],['method','智能方法'],['case','案例']];
const hits=computed(()=>search(palette.query));
// Group by kind but keep a flat order for keyboard navigation.
const groups=computed(()=>KINDS.map(([k,label])=>({k,label,items:hits.value.filter(h=>h.kind===k)})).filter(g=>g.items.length));
const flat=computed(()=>groups.value.flatMap(g=>g.items));
watch(()=>palette.query,()=>{cursor.value=0;});
watch(()=>palette.open,v=>{if(v)nextTick(()=>{input.value?.focus();input.value?.select();});});
function go(i=cursor.value){const h=flat.value[i];if(!h)return;palette.open=false;void router.push(h.to);}
function move(d:number){
  const n=flat.value.length;if(!n)return;cursor.value=(cursor.value+d+n)%n;
  nextTick(()=>list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'}));
}
function key(e:KeyboardEvent){
  if(e.key==='ArrowDown'){e.preventDefault();move(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();move(-1);}
  else if(e.key==='Enter'&&!e.isComposing){e.preventDefault();go();}
}
function globalKey(e:KeyboardEvent){
  const t=e.target as HTMLElement,typing=/^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName)||t?.isContentEditable;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();palette.open?palette.open=false:openPalette();}
  else if(e.key==='/'&&!typing&&!palette.open){e.preventDefault();openPalette();}
}
onMounted(()=>window.addEventListener('keydown',globalKey));
onBeforeUnmount(()=>window.removeEventListener('keydown',globalKey));
const idx=(h:any)=>flat.value.indexOf(h);
</script>

<template>
  <n-modal v-model:show="palette.open" class="sp-modal" :auto-focus="false" transform-origin="center">
    <div class="sp" role="dialog" aria-modal="true" aria-label="全站搜索">
      <div class="sp-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input ref="input" v-model="palette.query" class="sp-input" type="search" placeholder="搜索环节、场景、方法或案例内容…" role="combobox" aria-expanded="true" aria-controls="sp-list" :aria-activedescendant="flat.length?`sp-${cursor}`:undefined" autocomplete="off" @keydown="key">
        <kbd class="sp-esc" @click="palette.open=false">ESC</kbd>
      </div>
      <div id="sp-list" ref="list" class="sp-list" role="listbox" aria-label="搜索结果">
        <template v-if="flat.length">
          <section v-for="g in groups" :key="g.k" class="sp-group" role="group" :aria-label="g.label">
            <h3 class="sp-gh">{{ g.label }}<span>{{ g.items.length }}</span></h3>
            <a v-for="h in g.items" :id="`sp-${idx(h)}`" :key="h.id" class="sp-item" role="option" :href="router.resolve(h.to).href" :aria-selected="idx(h)===cursor" @mousemove="cursor=idx(h)" @click.prevent="go(idx(h))">
              <span class="sp-t"><Hl :text="h.title" :terms="h.terms"/></span>
              <span class="sp-sub">{{ h.sub }}</span>
              <span class="sp-snip"><Hl :text="excerpt(h)" :terms="h.terms"/></span>
            </a>
          </section>
        </template>
        <p v-else-if="palette.query.trim()" class="sp-empty">没有匹配“{{ palette.query.trim() }}”的内容，可换用更短的关键词。</p>
        <p v-else class="sp-empty">输入关键词检索 13 个作业环节、全部场景、智能方法与案例正文。</p>
      </div>
      <div class="sp-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span><span><kbd>⌘</kbd><kbd>K</kbd> 或 <kbd>/</kbd> 唤起</span><span class="r">{{ hits.length?`${hits.length} 条结果`:'' }}</span></div>
    </div>
  </n-modal>
</template>
