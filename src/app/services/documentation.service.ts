import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { marked } from 'marked';

import { LoginService } from '../login/login.service';

/**
 * Droit requis pour voir une catégorie ou une fiche d'aide.
 * Chaque valeur correspond à une méthode de LoginService (isAdmin, isCadre...) :
 * les groupes ne sont pas hiérarchiques, on ne compare donc jamais leurs numéros.
 */
export type DocDroit = 'admin' | 'cadre' | 'edit' | 'chiro' | 'foncier';

/** Fonctionnalité activable (voir `environment.fonctionnalites`) dont dépend une fiche d'aide. */
export type DocFonctionnalite = keyof typeof environment.fonctionnalites;

export interface DocSection {
  id: string;
  title: string;
  path: string | null;
  order: number;
  published: boolean;
  requireAuth: boolean;
  backendUrl?: string | null;
  content?: string;
  droit?: DocDroit;
  /** Fiche masquée tant que cette fonctionnalité est désactivée (ex. Sonneur en prod). */
  fonctionnalite?: DocFonctionnalite;
}

export interface DocCategory {
  id: string;
  title: string;
  droit?: DocDroit;
  sections: DocSection[];
}

interface DocHierarchicalIndex {
  categories: DocCategory[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {
  private activeUrl: string = environment.apiBaseUrl;
  private readonly docsPath = '/assets/docs/';

  constructor(private http: HttpClient, private loginService: LoginService) {
    // Configuration de marked pour améliorer le rendu
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  /**
   * Charge l'index hiérarchique des catégories et sections
   */
  private loadHierarchicalIndex(): Observable<DocHierarchicalIndex> {
    return this.http.get<DocHierarchicalIndex>(`${this.docsPath}index.hierarchical.json`);
  }

  /**
   * Indique si l'utilisateur connecté possède le droit demandé (aucun droit = accessible à tous)
   */
  aLeDroit(droit?: DocDroit): boolean {
    switch (droit) {
      case undefined:
        return true;
      case 'admin':
        return this.loginService.isAdmin();
      case 'cadre':
        return this.loginService.isCadre();
      case 'edit':
        return this.loginService.isEdit();
      case 'chiro':
        return this.loginService.isChiro();
      case 'foncier':
        return this.loginService.isFoncier();
      default:
        // Droit inconnu dans l'index : on masque par prudence
        return false;
    }
  }

  /**
   * Indique si la fonctionnalité dont dépend une fiche est activée (aucune = toujours visible)
   */
  estActivee(fonctionnalite?: DocFonctionnalite): boolean {
    return !fonctionnalite || environment.fonctionnalites[fonctionnalite] === true;
  }

  /**
   * Récupère les catégories et leurs sections accessibles selon les droits de l'utilisateur
   */
  getHierarchicalSections(isAuthenticated: boolean = false): Observable<DocCategory[]> {
    return this.loadHierarchicalIndex().pipe(
      map(index => index.categories
        .filter(cat => this.aLeDroit(cat.droit))
        .map(cat => ({
          ...cat,
          sections: cat.sections
            .filter(section => section.published)
            .filter(section => !section.requireAuth || isAuthenticated)
            .filter(section => this.aLeDroit(section.droit))
            .filter(section => this.estActivee(section.fonctionnalite))
            .sort((a, b) => a.order - b.order)
        }))
        .filter(cat => cat.sections.length > 0)
      )
    );
  }

  /**
   * Charge et parse un fichier markdown
   */
  loadMarkdownFile(filename: string): Observable<string> {
    const url = `${this.docsPath}${filename}`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(markdown => marked(this.filtrerFonctionnalites(markdown)) as string)
    );
  }

  /**
   * Retire les passages d'une fonctionnalité désactivée, balisés sur des lignes à part :
   *
   *     <!-- fonctionnalite:sonneur -->
   *     ...passage...
   *     <!-- /fonctionnalite -->
   *
   * Les balises sont toujours retirées, pour ne pas couper une liste Markdown en deux.
   */
  filtrerFonctionnalites(markdown: string): string {
    return markdown.replace(
      /^[ \t]*<!--\s*fonctionnalite:(\w+)\s*-->[ \t]*\r?\n([\s\S]*?)^[ \t]*<!--\s*\/fonctionnalite\s*-->[ \t]*(?:\r?\n|$)/gm,
      (_bloc, nom: string, contenu: string) => this.estActivee(nom as DocFonctionnalite) ? contenu : ''
    );
  }

  /**
   * Charge le contenu HTML d'une section : depuis le backend si backendUrl est défini,
   * sinon depuis le fichier markdown local
   */
  loadSectionContent(section: DocSection): Observable<string> {
    if (section.backendUrl) {
      let url = section.backendUrl;
      if (!/^https?:\/\//.test(url)) {
        url = this.activeUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
      }
      return this.http.get(url, { responseType: 'text' });
    }
    return this.loadMarkdownFile(section.path ?? '');
  }
}
