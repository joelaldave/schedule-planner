import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const notAuthenticatedGuard: CanMatchFn = async (route, segments) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const { data } = await authService.session();

  if (data.session) {
    router.navigate(['/dashboard']);
  }
  return !data.session;
};
