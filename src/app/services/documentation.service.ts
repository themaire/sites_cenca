import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { marked } from 'marked';

import { LoginService } from '../login/login.service';

export interface DocSection {
  id: string;
  title: string;
  path: string;
  order: number;
  published: boolean;
  requireAuth: boolean;
  backendUrl?: string | null;
  content?: string;
  accessLevel?: number;
}

interface DocIndex {
  sections: DocSection[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {
  private activeUrl: string = environment.apiBaseUrl;
  private readonly docsPath = '/assets/docs/';
  private sectionsCache: DocSection[] = [];
  private allSectionsCache: DocSection[] = [];

  constructor(private http: HttpClient, public loginService: LoginService) {
    // Configuration de marked pour améliorer le rendu
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  /**
   * Charge l'index des sections depuis le fichier JSON
   */
  private loadSectionsIndex(): Observable<DocIndex> {
    return this.http.get<DocIndex>(`${this.docsPath}index.json`);
  }

  /**
   * Récupère les sections publiées et filtrées selon la convention POSIX et l'authentification
   */
  getSections(isAuthenticated: boolean = false): Observable<DocSection[]> {
    return this.loadSectionsIndex().pipe(
      map(index => {
        const userGroId = this.loginService.user()?.gro_id ?? 0;
        const filteredSections = index.sections
          .filter(section => section.published)
          .filter(section => !section.requireAuth || isAuthenticated)
          .filter(section => (typeof section.accessLevel === 'number' ? section.accessLevel : 0) <= userGroId)
          .sort((a, b) => a.order - b.order);
        
        console.log('Sections filtrées chargées:', filteredSections.map(s => s.id));
        
        return filteredSections;
      })
    );
  }

  /**
   * Récupère toutes les sections (y compris les drafts) - pour usage développeur
   */
  getAllSections(): Observable<DocSection[]> {
    if (this.allSectionsCache.length > 0) {
      return of(this.allSectionsCache);
    }

    return this.loadSectionsIndex().pipe(
      map(index => {
        const allSections = index.sections.sort((a, b) => a.order - b.order);
        this.allSectionsCache = allSections;
        return allSections;
      })
    );
  }

  /**
   * Charge et parse un fichier markdown
   */
  loadMarkdownFile(filename: string): Observable<string> {
    const url = `${this.docsPath}${filename}`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(markdown => marked(markdown) as string)
    );
  }

  /**
   * Récupère une section spécifique par son ID (seulement les sections publiées)
   */
  getSection(id: string): Observable<DocSection | undefined> {
    return this.getSections().pipe(
      map(sections => sections.find(section => section.id === id))
    );
  }

  /**
   * Récupère une section spécifique par son ID (y compris les drafts) - pour usage développeur
   */
  getSectionIncludingDrafts(id: string): Observable<DocSection | undefined> {
    return this.getAllSections().pipe(
      map(sections => sections.find(section => section.id === id))
    );
  }

  /**
   * Charge le contenu HTML d'une section
   * Si backendUrl est défini, charge le HTML depuis le backend
   */
  getSectionContent(id: string, isAuthenticated: boolean = false): Observable<string> {
    return this.getSections(isAuthenticated).pipe(
      map(sections => {
        const section = sections.find(s => s.id === id);
        if (!section) {
          throw new Error(`Section '${id}' not found`);
        }
        return section;
      }),
      switchMap(section => {
        if (section.backendUrl) {
          // Préfixer l'URL si besoin
          let url = section.backendUrl;
          if (!/^https?:\/\//.test(url)) {
            url = this.activeUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
          }
          return this.http.get(url, { responseType: 'text' });
        } else {
          // Charge le markdown local
          return this.loadMarkdownFile(section.path);
        }
      })
    );
  }
}