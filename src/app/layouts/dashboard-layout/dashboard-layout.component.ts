import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { User } from '../../features/auth/interfaces/user.interface';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './dashboard-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {

  router = inject(Router);
  authService = inject(AuthService);

  // Signals for reactive state
  notifications = signal([
    {
      id: 1,
      title: 'Nueva tarea asignada',
      description: 'Revisar diseño de la página principal',
      time: 'Hace 5 minutos',
      type: 'info' as const
    },
    {
      id: 2,
      title: 'Reunión en 30 minutos',
      description: 'Daily standup con el equipo',
      time: 'Hace 15 minutos',
      type: 'warning' as const
    },
    {
      id: 3,
      title: 'Proyecto completado',
      description: 'El diseño del dashboard ha sido finalizado',
      time: 'Hace 1 hora',
      type: 'success' as const
    }
  ]);

  user = signal<User | null>(null);

  stats = signal({
    pendingTasks: 12,
    completedToday: 3,
    activeProjects: 5,
    teamMembers: 8
  });


  ngOnInit() {
    this.loadUserData();
  }


  loadUserData() {
    // Obtener información del usuario desde Supabase
    this.authService.getCurrentUser().subscribe({
      next: (user: User | null) => {
        if (user) {
          this.user.set({
            id: user.id,
            name: user.fullName || user.email?.split('@')[0] || 'Usuario',
            email: user.email,
            avatar: user.avatar 
          });
        }
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        // Mantener valores por defecto en caso de error
      }
    });
  }

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

  markNotificationAsRead(notificationId: number) {
    const notifications = this.notifications();
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    this.notifications.set(updatedNotifications);
  }

  onProfileClick() {
    // Implementar navegación al perfil
    console.log('Navigate to profile');
  }

  onSettingsClick() {
    // Implementar navegación a configuración
    console.log('Navigate to settings');
  }
}
