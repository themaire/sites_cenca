import {
  Component,
  OnInit,
  Input,
  inject,
  ViewChildren,
  QueryList,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MenuService } from '../menu.service';
import { MatMenu } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MenuItem } from '../menuItem';
import { LoginService } from '../login/login.service';
import { Subscription } from 'rxjs';
import { effect } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    CommonModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Ajout: abonnement de menu enrichi pour injecter l'entree Foncier sous Proteger.
  public logoutSubscription: Subscription | null = null;
  initials: string | null = null;

  userGroId: number | null = null;

  constructor(
    private router: Router,
    private menuService: MenuService,
    private breakpointObserver: BreakpointObserver,
    public loginService: LoginService
  ) {
    effect(() => {
      const user = this.loginService.user();
      if (user) {
        // console.log('Utilisateur chargé dans HeaderComponent :', user);
        this.userGroId = user.gro_id ?? null;
        this.menuService.loadMenuItems(this.userGroId ?? 0);
      }
    });
  }

  isMobile: boolean = false;
  menuItems: MenuItem[] = [
    {
      id: 0,
      name: 'Axes du CENCA',
      children: [], // A remplir par le service this.menuService
    },
    {
      id: 1,
      name: 'Préférences',
      children: [
        {
          id: 3,
          name: 'Vraiment plus tard',
          children: [],
        },
      ],
    },
  ];

  ngOnInit() {
// Menu foncier dans le header
      this.menuService.menuItems$.subscribe((items) => {
      this.menuItems[0].children = items;
      this.addFoncierOptionToProteger();
    });

    // Si ce n'est pas déjà fait, charger les données
    this.menuService.loadMenuItems(this.userGroId ?? 0);

    // console.log('Menu Items at end of onInit() :');
    // console.log(this.menuItems);

    // Détecter si c'est la version mobile
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  private addFoncierOptionToProteger(): void {
    const rootMenu = this.menuItems[0];
    if (!rootMenu?.children) {
      return;
    }

    const protegerItem = rootMenu.children.find((item) => {
      const hasProtegerClass =
        item.class_color?.toLowerCase().includes('proteger') ?? false;
      const hasProtegerName = item.name.toLowerCase().includes('proteg');
      return hasProtegerClass || hasProtegerName;
    });

    if (!protegerItem) {
      return;
    }

    if (!protegerItem.children) {
      protegerItem.children = [];
    }

    const hasFoncierEntry = protegerItem.children.some(
      (child) => child.route === '/fonciers' || child.route === 'fonciers'
    );

    if (!hasFoncierEntry) {
      protegerItem.children.push({
        name: 'Foncier',
        route: '/fonciers',
      });
    }
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  // Bouton deconnexion
  logout() {
    this.logoutSubscription = this.loginService.logout().subscribe({
      next: (_) => {
        this.navigateToLogin();
      },
      error: (_) => {
        this.navigateToLogin();
      },
    });
  }
  // Bouton connexion
  navigateToLogin() {
    this.router.navigate(['login']);
  }

  ngOnDestroy(): void {
    this.logoutSubscription?.unsubscribe();
  }

  initialsName() {
    if (this.loginService.user()) {
      this.initials =
        this.loginService.user()!.nom[0] + this.loginService.user()!.prenom[0];
    }
  }
}
