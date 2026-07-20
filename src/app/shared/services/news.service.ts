import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { News } from '../interfaces/news';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private baseUrl = environment.apiUrl + 'news/';

  private async get<T>(subroute: string): Promise<T> {
    const url = this.baseUrl + subroute;
    console.log('[NewsService] GET', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[NewsService] ${response.status} ${response.statusText} — ${url}`);
    }
    return (await response.json()) ?? [];
  }

  /** Récupère les actualités publiées, les plus récentes en premier
   * @param limite Nombre maximum d'actualités à récupérer (par défaut 5)
   */
  getNews(limite: number = 5): Promise<News[]> {
    return this.get<News[]>(`?limite=${limite}`);
  }

  /** Récupère le détail complet (avec contenu) d'une actualité publiée
   * @param id L'ID de l'actualité
   */
  getNewsById(id: number): Promise<News> {
    return this.get<News>(`${id}`);
  }
}
