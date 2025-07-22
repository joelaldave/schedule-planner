import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ButtonLoginComponent } from "../../components/button-login/button-login.component";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormValidatorsCustom } from '../../../../utils/form-validators';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, EMPTY } from 'rxjs';
import { CommonModule } from '@angular/common';

interface LoginForm {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
}

interface SignUpResponse {
  ok: boolean;
  message: string;
  show: boolean;
}

@Component({
  selector: 'app-sign-in-page',
  imports: [ButtonLoginComponent, ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './sign-in-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPageComponent {

  formValidatorsCustom = FormValidatorsCustom;

  messageResponse = signal<SignUpResponse>({ ok: false, message: '', show: false });

  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  loginForm = this.fb.group<LoginForm>({
    email: this.fb.control<string>('', [Validators.required, Validators.pattern(this.formValidatorsCustom.emailPattern)]),
    password: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
  });

  onSubmit() {
      if (!this.loginForm.valid) {
        this.loginForm.markAsDirty()
      }
  
      this.authService.signIn({
        email: this.loginForm.value.email!,
        password: this.loginForm.value.password!
      })
        .pipe(
          catchError((error) => {
            this.showToast({
              ok: false,
              message: error.message,
              show: true
            });
            return EMPTY;
          })
        )
        .subscribe((resp) => {
          console.log(resp);
          this.showToast({
            ok: true,
            message: 'User created successfully',
            show: true
          });
          this.router.navigateByUrl('/dashboard');
        })
    }
  
  
    showToast(messageResponse: SignUpResponse) {
  
      this.messageResponse.set({
        ...messageResponse,
      });
  
      setTimeout(() => {
        this.messageResponse.set({
          ...messageResponse,
          show: false
        });
      }, 3000);
    }


  onGoogleLogin() {
    this.authService.signInWithGoogle().subscribe((response) => {
      console.log(response)
      // if (response.error) {
      //   this.showToast({
      //     ok: false,
      //     message: response.error.message,
      //     show: true
      //   });
      // } else {
      //   this.router.navigateByUrl('/dashboard');
      // }
    })
  }
}
