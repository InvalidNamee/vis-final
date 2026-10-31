/** Loading and error panel built without Vue: used before app start and inside demo roots. Styled by styles/loading.css. */
export function showLoading(root:HTMLElement,options:{title:string;message:string;error?:boolean;retry?:()=>void}){
  const panel=document.createElement('section');
  panel.className=`atlas-loader atlas-loader--inline${options.error?' atlas-loader--error':''}`;
  panel.setAttribute('role',options.error?'alert':'status');
  panel.setAttribute('aria-busy',String(!options.error));
  panel.innerHTML='<div class="atlas-loader__content"><div class="atlas-loader__mark" aria-hidden="true"><i></i><i></i><i></i></div><h2 class="atlas-loader__title"></h2><p class="atlas-loader__message"></p><div class="atlas-loader__skeleton" aria-hidden="true"><i></i><i></i><i></i></div></div>';
  panel.querySelector('.atlas-loader__title')!.textContent=options.title;
  panel.querySelector('.atlas-loader__message')!.textContent=options.message;
  if(options.error){panel.querySelector('.atlas-loader__mark')!.textContent='!';panel.querySelector('.atlas-loader__skeleton')!.remove();}
  if(options.retry){
    const button=document.createElement('button');
    button.className='atlas-loader__retry';button.type='button';button.textContent='重新加载';button.onclick=options.retry;
    panel.querySelector('.atlas-loader__content')!.append(button);
  }
  root.replaceChildren(panel);
  return panel;
}
