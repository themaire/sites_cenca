import { Component, OnInit, computed, signal } from '@angular/core';
import { NavigationEnd, RouterLink, RouterOutlet } from '@angular/router';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { ChatbotComponent } from './chatbot/chatbot.component';

import { environment } from '../environments/environment';
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
    ChatbotComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  /** Routes accessibles sans authentification. */
  private static readonly ROUTES_PUBLIQUES = ['/aide', '/documentation', '/login', '/reset-password', '/not-found'];

  token: string | null = localStorage.getItem('token');
  isResetPasswordMode = false;

  /** URL courante, mise à jour à chaque navigation. */
  private urlCourante = signal(this.router.url);

  /**
   * Le chatbot ne s'affiche que s'il est activé (préproduction uniquement en prod),
   * pour un utilisateur connecté, hors routes publiques.
   */
  afficherChatbot = computed(() =>
    environment.fonctionnalites.sonneur
    && !!this.loginService.user() && !this.estRoutePublique(this.urlCourante())
  );

  constructor(private router: Router, private loginService: LoginService, private route: ActivatedRoute) {}

  ngOnInit() {
    // Appel explicite au chargement initial uniquement si route privée
    if (!this.estRoutePublique(this.router.url)) {
      this.checkToken();
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.urlCourante.set(this.router.url);
        if (!this.estRoutePublique(this.router.url)) {
          this.checkToken();
        }
      }
    });
  }

  private estRoutePublique(url: string): boolean {
    return AppComponent.ROUTES_PUBLIQUES.some(route => url.startsWith(route));
  }

  /**
   * Vérifie si un token d'authentification existe et redirige l'utilisateur en conséquence.
   * Si le token est valide, l'utilisateur est redirigé vers la page d'accueil.
   * Si le token n'est pas valide ou inexistant, l'utilisateur est redirigé vers la page de connexion.
   */
  checkToken() {
    // Ne rien faire si route publique
    if (this.estRoutePublique(this.router.url)) {
      return;
    }

    // Toujours relire le token depuis le localStorage
    this.token = localStorage.getItem('token');
    // console.log('Checking token:', this.token);

    if (this.token) {
      // console.log('Token exists:', this.token);
      this.isResetPasswordMode = false;

      this.loginService.getUsers().subscribe({
        next: (result: User | undefined | null) => {
          console.log('User:', result);

          // Ne redirige que si l'utilisateur est sur la page de login
          if (this.router.url === '/login') {
            console.log('Redirecting to home');
            this.navigate(); // Redirige vers la page d'accueil
          }
        },
        error: (error: Error) => {
          console.log('Error:', error);

          // Suppression du token si erreur d'authentification
          localStorage.removeItem('token');
          this.token = null;

          // Redirige vers /login en mémorisant la page demandée, pour y revenir après connexion
          if (!this.router.url.startsWith('/login')) {
            this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          }
        },
      });
    } else {
      console.log('No token found');

      // Si l'utilisateur est sur la page de réinitialisation du mot de passe
      if (this.router.url.startsWith('/reset-password')) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
          // Se rappeller que l'on est en mode reset-password
          this.isResetPasswordMode = true;
          return;
        } else {
          // Pas de token dans l'URL, on redirige vers /login
          if (this.router.url !== '/login') {
            this.navigate('login');
          }
          return;
        }
      }

      // Si on est en mode reset-password, ne pas rediriger
      if (this.isResetPasswordMode) {
        console.log('In reset password mode, not redirecting');
        return;
      } else if (this.router.url !== '/login') {
        // Ne redirige vers /login que si l'utilisateur n'est pas déjà sur cette page
        console.log('Redirecting to login');
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
