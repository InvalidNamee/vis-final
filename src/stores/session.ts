import {defineStore} from 'pinia';
import {ref} from 'vue';
import * as auth from '../services/management';
export const useSessionStore=defineStore('session',()=>{
 const authenticated=ref(auth.loggedIn());
 function login(user:string,password:string){const result=auth.login(user,password);authenticated.value=auth.loggedIn();return result;}
 function logout(){auth.logout();authenticated.value=false;}
 return {authenticated,login,logout};
});
