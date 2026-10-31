/* Page scroll lock shared by every dialog and the search palette.
   Hiding the root scrollbar would widen the viewport and shift the layout, so its width is
   added back as padding (Chromium ignores scrollbar-gutter on an overflow:hidden root). */
let holders=0;

export function lockScroll(on:boolean){
  holders=Math.max(0,holders+(on?1:-1));
  const root=document.documentElement,locked=holders>0;
  if(locked===root.classList.contains('has-modal'))return;
  if(locked)root.style.setProperty('--scrollbar-w',`${window.innerWidth-root.clientWidth}px`);
  root.classList.toggle('has-modal',locked);
  if(!locked)root.style.removeProperty('--scrollbar-w');
}
