import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallbackComponent { 
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals para el estado
  isProcessing = signal(true);
  hasError = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.processCallback();
  }

  private processCallback() {
    try {
      // Obtener tokens desde el AuthService
      const tokens = this.authService.getCallbackTokensFromUrl();
      
      if (!tokens) {
        throw new Error('No se encontraron tokens de autenticación en la URL');
      }

      // Procesar la invitación usando el AuthService
      this.authService.processInvitationCallback(tokens.accessToken, tokens.refreshToken)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (user) => {
            console.log('Usuario activado exitosamente:', user.email);
            this.isProcessing.set(false);
            
            // Redireccionar después de 2 segundos
            setTimeout(() => {
              this.goToDashboard();
            }, 2000);
          },
          error: (error) => {
            console.error('Error procesando callback:', error);
            this.hasError.set(true);
            this.isProcessing.set(false);
            this.errorMessage.set(error.message || 'Error procesando la invitación');
          }
        });

    } catch (error) {
      console.error('Error inicial procesando callback:', error);
      this.hasError.set(true);
      this.isProcessing.set(false);
      this.errorMessage.set(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/sign-in']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
  
}
