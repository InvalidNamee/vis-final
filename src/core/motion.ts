import type {Directive} from 'vue';

export const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

let observer:IntersectionObserver|null=null;
function watcher(){
  observer??=new IntersectionObserver(entries=>{
    for(const e of entries)if(e.isIntersecting){e.target.classList.add('is-in');observer!.unobserve(e.target);}
  },{rootMargin:'0px 0px -6% 0px'});
  return observer;
}

/** Fades a block in when it enters the viewport; v-reveal="n" staggers by n steps. Content stays visible without JS support. */
export const vReveal:Directive<HTMLElement,number|undefined>={
  mounted(el,{value}){
    if(reducedMotion()||typeof IntersectionObserver!=='function')return;
    el.classList.add('reveal');
    if(value)el.style.setProperty('--stagger',String(value));
    watcher().observe(el);
  },
  unmounted(el){observer?.unobserve(el);},
};
