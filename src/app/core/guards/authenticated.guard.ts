import { Router, type CanMatchFn } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { inject } from '@angular/core';

export const authenticatedGuard: CanMatchFn = async (route, segments) => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const { data } = await authService.session();

  if (!data.session) {
    router.navigate(['/auth/sign-in']);
  }
  return !!data.session;
};
