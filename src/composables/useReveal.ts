import type {Directive} from 'vue';

// Adds `.in` when an element scrolls into view; CSS in styles/motion.css owns the transition.
const io=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{
  for(const e of entries)if(e.isIntersecting){e.target.classList.add('in');io!.unobserve(e.target);}
},{rootMargin:'0px 0px -8% 0px',threshold:.08});

export const vReveal:Directive<HTMLElement,number|undefined>={
  mounted(el,{value}){
    el.classList.add('reveal');
    if(value)el.style.setProperty('--rd',`${value*60}ms`);
    if(!io||matchMedia('(prefers-reduced-motion: reduce)').matches){el.classList.add('in');return;}
    io.observe(el);
  },
  unmounted(el){io?.unobserve(el);},
};
