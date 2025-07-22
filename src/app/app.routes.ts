import { Routes } from '@angular/router';
import { notAuthenticatedGuard } from './core/guards/not-authenticated.guard';
import { authenticatedGuard } from './core/guards/authenticated.guard';

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
        canMatch: [notAuthenticatedGuard],
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
        canMatch: [authenticatedGuard],
    },
    {
        path:'**',
        redirectTo: 'auth'
    }
];
