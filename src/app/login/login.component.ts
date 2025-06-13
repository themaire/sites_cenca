import { Component, Inject, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';
import { MatIconModule } from '@angular/material/icon';

import { ActivatedRoute } from '@angular/router';

import {
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import { LoginService } from './login.service';
import { FormService } from '../shared/services/form.service';

import { Router } from '@angular/router';
import { Credentials } from './credentials';
import { User } from './user.model';

import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy {
  // Déclaration des 3 formGroup pour les formulaires
  loginFormGroup: FormGroup;
  forgotPasswordForm: FormGroup;
  resetPasswordForm: FormGroup;

  invalidCredentials = false;
  loginSubscription: Subscription | null = null;

  // Indique si l'utilisateur est en mode de réinitialisation de mot de passe
  isForgotPasswordMode: boolean = false;
  showPassword = false;

  get newPasswordValue(): string {
    return this.resetPasswordForm.get('newPassword')?.value || '';
  }
  get hasMinLength(): boolean {
    return this.newPasswordValue.length >= 8;
  }
  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.newPasswordValue);
  }
  get hasLowercase(): boolean {
    return /[a-z]/.test(this.newPasswordValue);
  }
  get hasDigit(): boolean {
    return /\d/.test(this.newPasswordValue);
  }
  get hasSpecial(): boolean {
    return /[@$!%*?&]/.test(this.newPasswordValue);
  }

  // Indique si l'utilisateur est en mode de réinitialisation de mot de passe avec un token
  isResetPasswordMode = false;
  resetToken: string = '';

  message: string | null = null;
  erreur: boolean = false;
  
  // Injection des services dans le constructeur
  constructor(
    private loginService: LoginService,
    private formService: FormService,
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    // Initialisation des formGroup
    this.loginFormGroup = this.formService.login();
    this.forgotPasswordForm = this.formService.forgotPassword();
    this.forgotPasswordForm.setValue({ email: '(￣﹏￣；)@cen-champagne-ardenne.org' }); // Assure que le champ email est vide au départ
    this.resetPasswordForm = this.formService.resetPasswordForm();

    // Détecte la route ou le paramètre
    this.route.url.subscribe(urlSegments => {
      if (urlSegments.some(seg => seg.path === 'reset-password')) {
        this.isResetPasswordMode = true;
        // Récupère le token si besoin
        this.route.queryParams.subscribe(params => {
          this.resetToken = params['token'] || '';
        });
      }
    });
  }

  login() {
    this.loginSubscription = this.loginService
      .login(this.loginFormGroup.value as Credentials)
      .subscribe({
        next: (result: User | undefined | null) => {
          this.navigateHome();
        },
        error: (error: Error) => {
          this.invalidCredentials = true;
        },
      });
  }

  forgotPassword() {
    if (this.forgotPasswordForm.invalid){
      this.message = "Veuillez entrer une adresse e-mail valide.";
      return;
    };
    const email = this.forgotPasswordForm.value.email;
    this.http.post<{ message: string | null }>(`${environment.apiUrl}auth/forgot-password`, { email }).subscribe({
      next: (res) => {
        this.erreur = false;
        this.message = res.message;
      },
      error: (err) => {
      // On récupère le message du backend s'il existe, sinon un message générique
      this.erreur = true;
      this.message = err.error && err.error.message
        ? err.error.message
        : "Erreur lors de la demande de réinitialisation.";
    }
    });
  }

  resetPassword() {
    console.log('resetPasswordForm: activééééée!');

    if (this.resetPasswordForm.invalid) return;

    // Mot de passe du formulaire
    const newPassword = this.resetPasswordForm.value.newPassword;
    console.log('nouveau mot de passe:', newPassword);

    // URL vers le backend
    const url = `${environment.apiUrl}auth/reset-password`;
    console.log('URL de réinitialisation:', url);
    
    this.http.post<{ message: string }>(url, {
      token: this.resetToken,
      newPassword
    }).subscribe({
      next: (res) => {
        this.message = res.message || 'Mot de passe réinitialisé !';
      },
      error: (err) => {
      // On récupère le message du backend s'il existe, sinon un message générique
      this.erreur = true;
      this.message = err.error && err.error.message
        ? err.error.message
        : "Erreur lors de la demande de réinitialisation.";
      }
    });
  }

  navigateHome() {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }

  navigateLogin() {
    this.isForgotPasswordMode = false;
    this.isResetPasswordMode = false;
    this.message = null;
    this.erreur = false;
    this.loginFormGroup.reset();
    this.router.navigate(['/login']);
}
}