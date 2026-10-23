import type {Result} from '../types';
function hash(s:string){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(36);}
export function account(){let r;try{r=JSON.parse(localStorage.getItem('atlas.admin.v1')||'null');}catch{}
  if(!r?.user||!r.hash){r={user:'admin',hash:hash('admin123')};localStorage.setItem('atlas.admin.v1',JSON.stringify(r));}return r;}
export function loggedIn(){return sessionStorage.getItem('atlas.admin.session')==='1';}
export function login(user:string,password:string):Result{const a=account();if(user.trim()!==a.user||hash(password)!==a.hash)return {ok:false,error:'账号或密码不正确'};sessionStorage.setItem('atlas.admin.session','1');return {ok:true};}
export function logout(){sessionStorage.removeItem('atlas.admin.session');}
export function changePassword(password:string):Result{if(password.length<6)return {ok:false,error:'密码至少 6 位'};try{const a=account();a.hash=hash(password);localStorage.setItem('atlas.admin.v1',JSON.stringify(a));return {ok:true};}catch{return {ok:false,error:'浏览器存储失败'};}}
