import { Routes } from "@angular/router";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { DashboardLayoutComponent } from "../../layouts/dashboard-layout/dashboard-layout.component";

export const dashboardRoutes :Routes = [
    {
        path: '',
        component: DashboardLayoutComponent,
        children: [
            {
                path: '',
                component: DashboardComponent
            }
        ]
    },
    
]