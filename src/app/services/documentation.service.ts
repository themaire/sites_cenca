import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { marked } from 'marked';

export interface DocSection {
  id: string;
  title: string;
  path: string;
  order: number;
  published: boolean;
  requireAuth: boolean;
  content?: string;
}

interface DocIndex {
  sections: DocSection[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {
  private readonly docsPath = '/assets/docs/';
  private sectionsCache: DocSection[] = [];
  private allSectionsCache: DocSection[] = [];

  constructor(private http: HttpClient) {
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
        const filteredSections = index.sections
          .filter(section => section.published)
          .filter(section => !section.requireAuth || isAuthenticated)
          .sort((a, b) => a.order - b.order);
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
   */
  getSectionContent(id: string): Observable<string> {
    return this.getSection(id).pipe(
      map(section => {
        if (!section) {
          throw new Error(`Section '${id}' not found`);
        }
        return section;
      }),
      switchMap(section => this.loadMarkdownFile(section.path))
    );
  }
}