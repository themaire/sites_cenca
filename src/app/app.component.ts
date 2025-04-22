import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RouterModule, Router } from '@angular/router';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';

import { LoginService } from './login/login.service';
import { User } from './login/user.model';

/**
 * AppComponent est le composant racine de l'application Angular.
 * Il initialise l'application et gère l'authentification de l'utilisateur.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  token: string | null = localStorage.getItem('token');

  constructor(private router: Router, private loginService: LoginService) {}

  ngOnInit() {
    this.checkToken();
  }

  checkToken() {
    if (this.token) {
      console.log('Token exists:', this.token);

      this.loginService.getUsers().subscribe({
        next: (result: User | undefined | null) => {
          console.log('User:', result);
          // Ne redirige que si l'utilisateur est sur la page de login ou d'accueil
          if (this.router.url === '/' || this.router.url === '/login') {
            this.navigate(); // Redirige vers la page d'accueil
          }
        },
        error: (error: Error) => {
          console.log('Error:', error);
          if (this.router.url !== '/login') {
            this.navigate('login'); // Redirige vers la page de connexion
          }
        },
      });
    } else {
      console.log('No token found');
      if (this.router.url !== '/login') {
        this.navigate('login'); // Redirige vers la page de connexion
      }
    }
  }

  /**
   * Navigates to a specified route.
   *
   * @param {string} [route='home'] - The route to navigate to. Defaults to 'home'.
   * If the route is 'home', navigates to the root path ('/').
   * Otherwise, navigates to the specified route.
   */
  navigate(route: string = 'home') {
    if (route === 'home') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/' + route]);
    }
  }
}
