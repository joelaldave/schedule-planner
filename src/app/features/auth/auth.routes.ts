import { Routes } from "@angular/router";
import { AuthLayoutComponent } from "../../layouts/auth-layout/auth-layout.component";

export const authRoutes:Routes = [
    {
        path: '',
        component: AuthLayoutComponent,
        children:[
            {
                path:'sign-in',
                loadComponent: () => import('./pages/sign-in-page/sign-in-page.component').then(m => m.SignInPageComponent)
            },
            {
                path:'sign-up',
                loadComponent: () => import('./pages/sign-up/sign-up.component').then(m => m.SignUpComponent)
            },
            {
                path:'**',
                redirectTo: 'sign-in'
            }
        ]
    },
    
]