import { computed, inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '../../../../core/services/supabase.service';
import {
  catchError,
  finalize,
  from,
  map,
  Observable,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import {
  PaginatedUsers,
  User,
  UserFilters,
  UserStats,
} from '../interfaces/user.interface';
import { fromSupabaseUser } from '../mappers/user.mapper';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private supabaseClient = inject(SupabaseService).supabaseClient;

  // Signals para estado reactivo
  private allUsers = signal<User[]>([]);
  private currentFilters = signal<UserFilters>({});
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  // Signals computados para datos derivados
  users = computed(() => {
    const users = this.allUsers();
    const filters = this.currentFilters();

    if (!filters.search && filters.role === 'all' && filters.status === 'all') {
      return users;
    }

    return this.applyFilters(users, filters);
  });

  stats = computed(() => {
    const users = this.allUsers();
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: users.length,
      active: users.filter((user) => user.status === 'active').length,
      inactive: users.filter((user) => user.status === 'inactive').length,
      newThisMonth: users.filter((user) => {
        const createdAt = new Date(user.createdAt || now);
        return createdAt >= thisMonth;
      }).length,
    };
  });

  paginatedUsers = computed(() => {
    const users = this.users();
    const filters = this.currentFilters();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedUsers = users.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages,
    };
  });

  // Getters para acceso readonly
  isLoading = this.loading.asReadonly();
  hasError = computed(() => this.error() !== null);
  errorMessage = this.error.asReadonly();

  /**
   * Carga todos los usuarios desde Supabase
   */
  loadUsers(): Observable<User[]> {
    this.loading.set(true);
    this.error.set(null);

    return from(
      this.supabaseClient
        .from('users')
        .select(
          `
          id,
          email,
          name,
          role,
          status,
          created_at,
          updated_at,
          last_sign_in_at
        `
        )
        .order('created_at', { ascending: false })
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }

        const users = response.data.map((user) => fromSupabaseUser(user));

        this.allUsers.set(users);

        return users;
      }),
      tap(() => this.loading.set(false)),
      catchError((error) => {
        console.error('Error loading users:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        this.error.set(errorMessage);
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene un usuario por ID
   */
  getUserById(userId: string): Observable<User> {
    return from(
      this.supabaseClient.from('users').select('*').eq('id', userId).single()
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }

        return fromSupabaseUser(response.data);
      }),
      catchError((error) => {
        console.error('Error fetching user:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crea un nuevo usuario
   */
  createUser(userData: {
    email: string;
    password?: string; // Opcional con inviteUserByEmail
    name: string;
    role?: 'admin' | 'moderator' | 'user';
  }): Observable<User> {
    this.loading.set(true);
    this.error.set(null);

    // Primero enviar invitación por email
    return from(
      this.supabaseClient.auth.admin.inviteUserByEmail(userData.email, {
        data: {
          full_name: userData.name,
          role: userData.role || 'user',
        },
        redirectTo: `${window.location.origin}/auth/callback`, // URL de tu app donde maneja el callback
      })
    ).pipe(
      // Luego crear el registro en la tabla users
      switchMap((authResponse) => {
        if (authResponse.error) {
          throw new Error(authResponse.error.message);
        }

        const authUser = authResponse.data.user;

        return from(
          this.supabaseClient
            .from('users')
            .insert({
              id: authUser.id, // Usar el mismo ID del usuario de auth
              email: userData.email,
              full_name: userData.name,
              role: userData.role || 'user',
              status: 'inactive', // Inactivo hasta que confirme el email
              created_at: authUser.created_at,
              updated_at: new Date().toISOString(),
              last_sign_in_at: null,
            })
            .select()
            .single()
        );
      }),
      map((dbResponse) => {
        if (dbResponse.error) {
          throw new Error(dbResponse.error.message);
        }

        const newUser = fromSupabaseUser(dbResponse.data);

        // Actualizar la lista local
        this.allUsers.update((users) => [...users, newUser]);

        return newUser;
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Error invitando usuario';
        this.error.set(errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza un usuario
   */
  updateUser(
    userId: string,
    userData: {
      name?: string;
      email?: string;
      role?: 'admin' | 'moderator' | 'user';
    }
  ): Observable<User> {
    this.loading.set(true);
    this.error.set(null);

    const updateData: any = {};

    if (userData.email) {
      updateData.email = userData.email;
    }

    if (userData.name || userData.role) {
      updateData.user_metadata = {};
      if (userData.name) {
        updateData.user_metadata.full_name = userData.name;
      }
      if (userData.role) {
        updateData.user_metadata.role = userData.role;
      }
    }

    return from(
      this.supabaseClient
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }

        const updatedUser = fromSupabaseUser(response.data);

        // Actualizar la lista local
        this.allUsers.update((users) =>
          users.map((user) => (user.id === userId ? updatedUser : user))
        );

        return updatedUser;
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Error actualizando usuario';
        this.error.set(errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina un usuario
   */
  deleteUser(userId: string): Observable<boolean> {
    this.loading.set(true);
    this.error.set(null);

    return from(
      this.supabaseClient.from('users').delete().eq('id', userId)
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }

        // Actualizar la lista local
        this.allUsers.update((users) =>
          users.filter((user) => user.id !== userId)
        );

        return true;
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Error eliminando usuario';
        this.error.set(errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cambia el estado de un usuario (activo/inactivo)
   */
  toggleUserStatus(userId: string, isActive: boolean): Observable<User> {
    this.loading.set(true);
    this.error.set(null);

    return from(
      this.supabaseClient
        .from('users')
        .update({
          status: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        console.log(response.data)
        const updatedUser = fromSupabaseUser(response.data);
        updatedUser.status = isActive ? 'active' : 'inactive';

        // Actualizar la lista local
        this.allUsers.update((users) =>
          users.map((user) => (user.id === userId ? updatedUser : user))
        );

        return updatedUser;
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error cambiando estado del usuario';
        this.error.set(errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Busca usuarios por término
   */
  searchUsers(searchTerm: string): Observable<User[]> {
    this.setFilters({ search: searchTerm });
    return from([this.users()]);
  }

  /**
   * Aplica filtros y devuelve observable
   */
  getFilteredUsers(filters: UserFilters): Observable<PaginatedUsers> {
    this.setFilters(filters);
    return from([this.paginatedUsers()]);
  }

  /**
   * Recarga los datos desde el servidor
   */
  refresh(): Observable<User[]> {
    return this.loadUsers();
  }

  /**
   * Obtiene estadísticas como observable
   */
  getStats(): Observable<UserStats> {
    return from([this.stats()]);
  }

  /**
   * Aplica filtros a la lista de usuarios
   */
  setFilters(filters: UserFilters): void {
    this.currentFilters.set({ ...this.currentFilters(), ...filters });
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.currentFilters.set({});
  }

  /**
   * Obtiene un usuario del estado local
   */
  getUserByIdFromState(userId: string): User | undefined {
    return this.allUsers().find((user) => user.id === userId);
  }

  /**
   * Aplica filtros a la lista de usuarios
   */
  private applyFilters(users: User[], filters: UserFilters): User[] {
    let filteredUsers = [...users];

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter((user) => {
        const userName = user.name || ''; // Fallback a string vacío si es null/undefined
        const userEmail = user.email || ''; // Fallback a string vacío si es null/undefined

        return (
          userName.toLowerCase().includes(searchLower) ||
          userEmail.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filtro por rol
    if (filters.role && filters.role !== 'all') {
      filteredUsers = filteredUsers.filter(
        (user) => user.role === filters.role
      );
    }

    // Filtro por estado
    if (filters.status && filters.status !== 'all') {
      filteredUsers = filteredUsers.filter((user) => {
        switch (filters.status) {
          case 'active':
            return user.status === 'active';
          case 'inactive':
            return user.status === 'inactive';
          default:
            return true;
        }
      });
    }

    return filteredUsers;
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.allUsers.set([]);
    this.currentFilters.set({});
    this.loading.set(false);
    this.error.set(null);
  }
}
