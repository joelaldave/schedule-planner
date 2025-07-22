import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormValidatorsCustom } from '../../../../utils/form-validators';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, EMPTY } from 'rxjs';
import { CommonModule } from '@angular/common';

interface SignUpForm {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
}

interface SignUpResponse {
  ok: boolean;
  message: string;
  show: boolean;
}

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './sign-up.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
  formValidatorsCustom = FormValidatorsCustom;

  authService = inject(AuthService);

  messageResponse = signal<SignUpResponse>({ ok: false, message: '', show: false });
  fb = inject(FormBuilder);

  signUpForm = this.fb.group<SignUpForm>({
    email: this.fb.control<string>('', [Validators.required, Validators.pattern(this.formValidatorsCustom.emailPattern)]),
    password: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
  });

  onSubmit() {
    if (!this.signUpForm.valid) {
      this.signUpForm.markAsDirty()
    }

    this.authService.signUp({
      email: this.signUpForm.value.email!,
      password: this.signUpForm.value.password!
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
    console.log('Google login clicked');
  }
}
