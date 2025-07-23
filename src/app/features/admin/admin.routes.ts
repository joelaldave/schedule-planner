import { Routes } from "@angular/router";
import { DashboardLayoutComponent } from "../../layouts/dashboard-layout/dashboard-layout.component";
import { UsersListComponent } from "./users-manager/pages/users-list/users-list.component";

export const adminRoutes :Routes = [
    {
        path: '',
        component: DashboardLayoutComponent,
        children: [
            {
                path: 'users',
                loadComponent: () => import('./users-manager/pages/users-list/users-list.component').then(m => m.UsersListComponent),
            },
            {
                path: 'users/new',
                loadComponent: () => import('./users-manager/pages/new-edit-user/new-edit-user.component').then(m => m.NewEditUserComponent),
            },
            {
                path: 'users/:id',
                loadComponent: () => import('./users-manager/pages/new-edit-user/new-edit-user.component').then(m => m.NewEditUserComponent),
            },
            {
                path: '**',
                redirectTo: 'users'
            }
        ]
    },
    
]