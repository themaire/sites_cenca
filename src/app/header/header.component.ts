import { Component, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

import { MenuService } from '../menu.service';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    CommonModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly PARAMETRES_ID = 28;

  // Axes du CENCA (alimentés par le MenuService)
  readonly menuItems = toSignal(this.menuService.menuItems$, { initialValue: [] });

  // Axes affichés sous forme de bouton déroulant (hors Paramètres)
  readonly axes = computed(() =>
    this.menuItems().filter((item) => item.id !== this.PARAMETRES_ID)
  );

  readonly parametresMenuItem = computed(() =>
    this.menuItems().find((item) => item.id === this.PARAMETRES_ID)
  );

  // Accès Chiroptères : règle de groupes centralisée dans LoginService
  readonly hasChiroAccess = computed(() => this.loginService.isChiro());

  // Seuils calés sur la largeur réelle du menu (≈ 1000px pour les 9 axes d'un admin, ligne complète ≈ 1630px) :
  // - compact : petit logo, Aide en icône, boutons resserrés
  // - mobile  : menu hamburger
  readonly isCompact = this.matches('(max-width: 1699.98px)');
  readonly isMobile = this.matches('(max-width: 1239.98px)');

  constructor(
    private router: Router,
    private menuService: MenuService,
    private breakpointObserver: BreakpointObserver,
    public loginService: LoginService
  ) {
    // (Re)charger le menu à chaque changement d'utilisateur connecté
    // (arbre admin avec « Paramètres » pour le groupe 5)
    effect(() => {
      if (this.loginService.user()) {
        this.menuService.loadMenuItems(this.loginService.isAdmin());
      }
    });
  }

  private matches(query: string) {
    return toSignal(
      this.breakpointObserver.observe(query).pipe(map((result) => result.matches)),
      { initialValue: this.breakpointObserver.isMatched(query) }
    );
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  // Bouton deconnexion
  logout() {
    this.menuService.clearCache();
    this.loginService.logout().subscribe({
      complete: () => this.navigateToLogin(),
      error: () => this.navigateToLogin(),
    });
  }

  // Bouton connexion
  navigateToLogin() {
    this.router.navigate(['login']);
  }
}
