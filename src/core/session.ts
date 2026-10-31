import {ref} from 'vue';
import * as auth from '../services/management';

export const signedIn=ref(auth.loggedIn());
export function signIn(user:string,password:string){const result=auth.login(user,password);signedIn.value=auth.loggedIn();return result;}
export function signOut(){auth.logout();signedIn.value=false;}
export const changePassword=auth.changePassword;
