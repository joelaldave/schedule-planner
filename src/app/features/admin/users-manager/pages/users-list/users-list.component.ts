import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Subject, takeUntil } from 'rxjs';
import { UserFilters } from '../../interfaces/user.interface';

@Component({
  selector: 'app-users-list',
  imports: [CommonModule],
  templateUrl: './users-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent { 

  Math = Math; // Exponer Math para uso en la plantilla

  private userService = inject(UserService);
  private destroy$ = new Subject<void>();

  // Signals para el estado local del componente
  selectedUserIds = signal<string[]>([]);
  searchTerm = signal<string>('');
  selectedRole = signal<string>('all');
  selectedStatus = signal<string>('all');
  currentPage = signal<number>(1);
  pageLimit = signal<number>(10);

  // Signals computados para lógica de UI
  isAllSelected = computed(() => {
    const users = this.userService.paginatedUsers().users;
    const selectedIds = this.selectedUserIds();
    return users.length > 0 && users.every(user => selectedIds.includes(user.id));
  });

  hasSelectedUsers = computed(() => this.selectedUserIds().length > 0);
  
  selectedCount = computed(() => this.selectedUserIds().length);

  // Signals del servicio (acceso directo)
  users = this.userService.paginatedUsers;
  stats = this.userService.stats;
  isLoading = this.userService.isLoading;
  hasError = this.userService.hasError;
  errorMessage = this.userService.errorMessage;

  ngOnInit(): void {
    this.loadUsers();
  }

   ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

   /**
   * Carga la lista inicial de usuarios
   */
  loadUsers(): void {
    this.userService.loadUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          console.log(`${users.length} usuarios cargados`);
        },
        error: (error) => {
          console.error('Error cargando usuarios:', error);
        }
      });
  }

  /**
   * Busca usuarios por término
   */
  onSearch(): void {
    this.currentPage.set(1);
    this.applyFilters();
  }

  /**
   * Aplica filtros seleccionados
   */
  onFilterChange(): void {
    this.currentPage.set(1);
    this.applyFilters();
  }

  /**
   * Aplica todos los filtros actuales
   */
  private applyFilters(): void {
    const filters: UserFilters = {
      search: this.searchTerm().trim(),
      role: this.selectedRole() as any,
      status: this.selectedStatus() as any,
      page: this.currentPage(),
      limit: this.pageLimit()
    };

    this.userService.setFilters(filters);
  }

  /**
   * Limpia todos los filtros
   */
  onClearFilters(): void {
    this.searchTerm.set('');
    this.selectedRole.set('all');
    this.selectedStatus.set('all');
    this.currentPage.set(1);
    this.selectedUserIds.set([]);
    this.userService.clearFilters();
  }

  /**
   * Cambia de página
   */
  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.applyFilters();
    // Limpiar selecciones al cambiar de página
    this.selectedUserIds.set([]);
  }

  /**
   * Cambia el número de elementos por página
   */
  onPageSizeChange(size: number): void {
    this.pageLimit.set(size);
    this.currentPage.set(1);
    this.applyFilters();
  }

  /**
   * Selecciona/deselecciona un usuario
   */
  toggleUserSelection(userId: string): void {
    this.selectedUserIds.update(ids => {
      if (ids.includes(userId)) {
        return ids.filter(id => id !== userId);
      } else {
        return [...ids, userId];
      }
    });
  }

  /**
   * Selecciona/deselecciona todos los usuarios de la página actual
   */
  toggleAllSelection(): void {
    const users = this.userService.paginatedUsers().users;
    const allUserIds = users.map(user => user.id);
    
    if (this.isAllSelected()) {
      // Deseleccionar todos
      this.selectedUserIds.set([]);
    } else {
      // Seleccionar todos los de la página actual
      this.selectedUserIds.set(allUserIds);
    }
  }

  /**
   * Elimina un usuario individual
   */
  onDeleteUser(userId: string, userName: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${userName}"?`)) {
      this.userService.deleteUser(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Usuario eliminado exitosamente');
            // Remover de seleccionados si estaba seleccionado
            this.selectedUserIds.update(ids => ids.filter(id => id !== userId));
          },
          error: (error) => {
            console.error('Error eliminando usuario:', error);
            alert('Error al eliminar el usuario. Por favor, inténtalo de nuevo.');
          }
        });
    }
  }

  /**
   * Cambia el estado de un usuario (activo/inactivo)
   */
  onToggleUserStatus(userId: string, currentStatus: string, userName: string): void {
    const newStatus = currentStatus === 'active';
    const action = newStatus ? 'desactivar' : 'activar';
    
    if (confirm(`¿Estás seguro de que quieres ${action} al usuario "${userName}"?`)) {
      this.userService.toggleUserStatus(userId, !newStatus)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(`Usuario ${action}do exitosamente`);
          },
          error: (error) => {
            console.error('Error cambiando estado del usuario:', error);
            alert('Error al cambiar el estado del usuario. Por favor, inténtalo de nuevo.');
          }
        });
    }
  }

  /**
   * Elimina múltiples usuarios seleccionados
   */
  onBulkDelete(): void {
    const selectedIds = this.selectedUserIds();
    const count = selectedIds.length;
    
    if (count === 0) {
      alert('Por favor, selecciona al menos un usuario para eliminar.');
      return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar ${count} usuario${count > 1 ? 's' : ''}?`)) {
      // Simular eliminación múltiple (Supabase no tiene bulk delete directo)
      const deletePromises = selectedIds.map(id => 
        this.userService.deleteUser(id).pipe(takeUntil(this.destroy$))
      );

      // Ejecutar todas las eliminaciones
      Promise.allSettled(deletePromises.map(obs => obs.toPromise()))
        .then(results => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          
          if (successful > 0) {
            console.log(`${successful} usuarios eliminados exitosamente`);
            this.selectedUserIds.set([]);
          }
          
          if (failed > 0) {
            console.error(`Error eliminando ${failed} usuarios`);
            alert(`Se eliminaron ${successful} usuarios, pero ${failed} fallaron.`);
          }
        });
    }
  }

  /**
   * Cambia el estado de múltiples usuarios seleccionados
   */
  onBulkToggleStatus(activate: boolean): void {
    const selectedIds = this.selectedUserIds();
    const count = selectedIds.length;
    const action = activate ? 'activar' : 'desactivar';
    
    if (count === 0) {
      alert(`Por favor, selecciona al menos un usuario para ${action}.`);
      return;
    }

    if (confirm(`¿Estás seguro de que quieres ${action} ${count} usuario${count > 1 ? 's' : ''}?`)) {
      const updatePromises = selectedIds.map(id => 
        this.userService.toggleUserStatus(id, activate).pipe(takeUntil(this.destroy$))
      );

      Promise.allSettled(updatePromises.map(obs => obs.toPromise()))
        .then(results => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          
          if (successful > 0) {
            console.log(`${successful} usuarios ${action}dos exitosamente`);
            this.selectedUserIds.set([]);
          }
          
          if (failed > 0) {
            console.error(`Error ${action}ndo ${failed} usuarios`);
            alert(`Se ${action}ron ${successful} usuarios, pero ${failed} fallaron.`);
          }
        });
    }
  }

 
  /**
   * Actualiza los datos desde el servidor
   */
  onRefresh(): void {
    this.selectedUserIds.set([]);
    this.loadUsers();
  }

  /**
   * Navega a la página de edición de usuario
   */
  onEditUser(userId: string): void {
    // TODO: Implementar navegación a formulario de edición
    console.log('Editar usuario:', userId);
    // this.router.navigate(['/admin/users/edit', userId]);
  }

  /**
   * Navega a la página de creación de usuario
   */
  onCreateUser(): void {
    // TODO: Implementar navegación a formulario de creación
    console.log('Crear nuevo usuario');
    // this.router.navigate(['/admin/users/create']);
  }

  /**
   * Obtiene el texto del rol en español
   */
  getRoleText(role: string): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'moderator':
        return 'Moderador';
      case 'user':
        return 'Usuario';
      default:
        return 'Sin rol';
    }
  }

  /**
   * Obtiene el texto del estado en español
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'suspended':
        return 'Suspendido';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtiene la clase CSS del badge según el rol
   */
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'badge-primary';
      case 'moderator':
        return 'badge-secondary';
      case 'user':
        return 'badge-neutral';
      default:
        return 'badge-ghost';
    }
  }

  /**
   * Obtiene la clase CSS del badge según el estado
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'suspended':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (!d || isNaN(d.getTime())) {
      return '-';
    }

    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Formatea fecha y hora para mostrar
   */
  formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (!d || isNaN(d.getTime())) {
      return '-';
    }

    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea tiempo relativo (hace X tiempo)
   */
  formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (!d || isNaN(d.getTime())) {
      return 'Nunca';
    }

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return this.formatDate(d);
  }

  /**
   * Genera array de páginas para la paginación
   */
  getPageNumbers(): number[] {
    const totalPages = this.users().totalPages;
    const currentPage = this.currentPage();
    const pages: number[] = [];
    
    // Mostrar máximo 5 páginas
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Verifica si hay página anterior
   */
  hasPrevPage(): boolean {
    return this.currentPage() > 1;
  }

  /**
   * Verifica si hay página siguiente
   */
  hasNextPage(): boolean {
    return this.currentPage() < this.users().totalPages;
  }

  /**
   * Va a la página anterior
   */
  goToPrevPage(): void {
    if (this.hasPrevPage()) {
      this.onPageChange(this.currentPage() - 1);
    }
  }

  /**
   * Va a la página siguiente
   */
  goToNextPage(): void {
    if (this.hasNextPage()) {
      this.onPageChange(this.currentPage() + 1);
    }
  }

  /**
   * Va a la primera página
   */
  goToFirstPage(): void {
    this.onPageChange(1);
  }

  /**
   * Va a la última página
   */
  goToLastPage(): void {
    this.onPageChange(this.users().totalPages);
  }
  
  
}
