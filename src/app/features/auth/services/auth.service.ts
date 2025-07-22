import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { catchError, from, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  _supabaseClient = inject(SupabaseService).supabaseClient;

  signUp(credentials : SignUpWithPasswordCredentials){
    return from(this._supabaseClient.auth.signUp(credentials))
    .pipe(
      tap((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        } 
        
      }),
     catchError((error)=>{
      return throwError(() => new Error(error.message));
     })
    );
  }

  signIn(credentials: SignInWithPasswordCredentials){
    return from(this._supabaseClient.auth.signInWithPassword(credentials))
    .pipe(
      tap((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        } 
        
      }),
     catchError((error)=>{
      return throwError(() => new Error(error.message));
     })
    );

  }

  signOut(){
    return from(this._supabaseClient.auth.signOut());
  }

  session(){
    return this._supabaseClient.auth.getSession()
  }

  signInWithGoogle(){
    return from(this._supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams:{
          prompt:'select_account'
        }
      },
    }))
    .pipe(
      tap((response) => {
        console.log(response)
        if (response.error) {
          throw new Error(response.error.message);
        } 
        
      }),
     catchError((error)=>{
      return throwError(() => new Error(error.message));
     })
    );
  }

}
