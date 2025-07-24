import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { catchError, from, map, switchMap, tap, throwError } from 'rxjs';
import { mapUser } from '../mappers/user.mapper';

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

  getCurrentUser(){
    return from(this._supabaseClient.auth.getUser())
      .pipe(
        map(response => {
          if (response.error) {
            throw new Error(response.error.message);
          }
          return mapUser(response.data.user);
        }),
        catchError((error) => {
          return throwError(() => new Error(error.message));
        })
      );
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

  /**
   * Procesa el callback de invitación de usuario
   * Establece la sesión y activa la cuenta
   */
  processInvitationCallback(accessToken: string, refreshToken: string) {
    return from(this._supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })).pipe(
      switchMap(sessionResponse => {
        if (sessionResponse.error) {
          throw new Error(sessionResponse.error.message);
        }

        const user = sessionResponse.data.user;
        if (!user) {
          throw new Error('No se pudo obtener la información del usuario');
        }

        // Activar el usuario en la tabla users
        return from(this._supabaseClient
          .from('users')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
        ).pipe(
          map(updateResponse => {
            if (updateResponse.error) {
              throw new Error(updateResponse.error.message);
            }
            return user;
          })
        );
      }),
      catchError(error => {
        console.error('Error procesando callback de invitación:', error);
        return throwError(() => new Error(error.message || 'Error procesando invitación'));
      })
    );
  }

  /**
   * Verifica si hay tokens en la URL para procesamiento de callback
   */
  getCallbackTokensFromUrl(): { accessToken: string; refreshToken: string } | null {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    
    return null;
  }
  
}
