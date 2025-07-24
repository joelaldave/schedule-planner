import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../interfaces/user.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-edit-user',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-edit-user.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewEditUserComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  // Signals para el estado del componente
  isEditMode = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  currentUser = signal<User | null>(null);
  submitError = signal<string | null>(null);
  submitSuccess = signal<boolean>(false);

  // Form reactive
  userForm: FormGroup;

  // Computed para el título de la página
  pageTitle = computed(() => this.isEditMode() ? 'Editar Usuario' : 'Crear Usuario');
  submitButtonText = computed(() => this.isEditMode() ? 'Actualizar Usuario' : 'Crear Usuario');

  constructor() {
    // Inicializar el formulario
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', [Validators.required]]
    });

    // Efecto para cargar el usuario si estamos en modo edición
    effect(() => {
      const userId = this.route.snapshot.paramMap.get('id');
      if (userId) {
        this.isEditMode.set(true);
        this.loadUser(userId);
      }
    });
  }

  /**
   * Carga los datos del usuario para editar
   */
  private loadUser(userId: string): void {
    this.isLoading.set(true);
    this.submitError.set(null);

    this.userService.getUserById(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.populateForm(user);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error cargando usuario:', error);
          this.submitError.set('Error cargando los datos del usuario');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Llena el formulario con los datos del usuario
   */
  private populateForm(user: User): void {
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role
    });
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    const formData = this.userForm.value;

    if (this.isEditMode()) {
      this.updateUser(formData);
    } else {
      this.createUser(formData);
    }
  }

  /**
   * Crea un nuevo usuario
   */
  private createUser(formData: any): void {
    this.userService.createUser({
      email: formData.email,
      name: formData.name,
      role: formData.role
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          console.log('Usuario creado exitosamente:', user.email);
          this.submitSuccess.set(true);
          this.isSubmitting.set(false);
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/admin/users']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error creando usuario:', error);
          this.submitError.set(error.message || 'Error creando el usuario');
          this.isSubmitting.set(false);
        }
      });
  }

  /**
   * Actualiza un usuario existente
   */
  private updateUser(formData: any): void {
    const currentUser = this.currentUser();
    if (!currentUser) return;

    this.userService.updateUser(currentUser.id, {
      name: formData.name,
      email: formData.email,
      role: formData.role
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          console.log('Usuario actualizado exitosamente:', user.email);
          this.submitSuccess.set(true);
          this.isSubmitting.set(false);
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/admin/users']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error actualizando usuario:', error);
          this.submitError.set(error.message || 'Error actualizando el usuario');
          this.isSubmitting.set(false);
        }
      });
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verifica si un campo tiene errores y ha sido tocado
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Ingresa un email válido';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    
    return '';
  }

  /**
   * Obtiene la etiqueta del campo para los mensajes de error
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nombre',
      email: 'Email',
      role: 'Rol'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Cancela la operación y regresa a la lista
   */
  onCancel(): void {
    this.router.navigate(['/admin/users']);
  }

  /**
   * Resetea el formulario
   */
  onReset(): void {
    if (this.isEditMode()) {
      const user = this.currentUser();
      if (user) {
        this.populateForm(user);
      }
    } else {
      this.userForm.reset({
        name: '',
        email: '',
        role: 'user'
      });
    }
    this.submitError.set(null);
    this.submitSuccess.set(false);
  }
  
 }
