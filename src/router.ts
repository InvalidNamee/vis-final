import {createRouter,createWebHistory} from 'vue-router';

export const router=createRouter({
  history:createWebHistory(import.meta.env.BASE_URL),
  routes:[
    {path:'/',component:()=>import('./pages/HomePage.vue')},
    {path:'/chain',component:()=>import('./pages/ChainPage.vue')},
    {path:'/stage/:id',component:()=>import('./pages/StagePage.vue')},
    {path:'/method/:id',component:()=>import('./pages/MethodPage.vue')},
    {path:'/scene/:id',component:()=>import('./pages/ScenePage.vue')},
    {path:'/cases',component:()=>import('./pages/CasesPage.vue')},
    {path:'/guide',component:()=>import('./pages/GuidePage.vue')},
    {path:'/admin/:section?',component:()=>import('./pages/AdminPage.vue')},
    {path:'/:pathMatch(.*)*',component:()=>import('./pages/NotFound.vue')},
  ],
  scrollBehavior(to,from,saved){return saved||(to.path!==from.path?{top:0}:{});},
});

/** Original links used `#/scene/d1?tab=demo`; convert them to History URLs in place. */
export function consumeLegacyHash(){
  if(!location.hash.startsWith('#/'))return;
  const target=location.hash.slice(1);
  history.replaceState(history.state,'',location.pathname+location.search);
  void router.replace(target);
}
