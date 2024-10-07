import { Component, Inject, OnDestroy } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import { LoginService } from './login.service';
import { Router } from '@angular/router';
import { Credentials } from './credentials';
import { Subscription } from 'rxjs';
import { User } from './user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy {
  loginFormGroup: FormGroup;
  invalidCredentials = false;
  loginSubscription: Subscription | null = null;

  // Injection des services dans le constructeur
  constructor(
    private loginService: LoginService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    // Initialisation du formGroup
    this.loginFormGroup = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
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

  navigateHome() {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }
}
