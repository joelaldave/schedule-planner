import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './dashboard-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {

  router = inject(Router);
  authService = inject(AuthService);

  onLogout(){
    this.authService.signOut()
      .subscribe(()=>{
        this.router.navigate(['/auth/sign-in']);
      })
  }


  onSearch(term: string) {
    // Implementar lógica de búsqueda
    console.log('Searching for:', term);
  }
 }
