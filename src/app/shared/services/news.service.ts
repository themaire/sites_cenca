import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { News, NewsComment, NewsReaction } from '../interfaces/news';

/** Réactions proposées sous chaque actualité (l'ordre est celui de l'affichage) */
export const NEWS_REACTIONS: { emoji: string; label: string }[] = [
  { emoji: '👍', label: "J'aime" },
  { emoji: '❤️', label: "J'adore" },
  { emoji: '🌿', label: 'Nature' },
  { emoji: '👏', label: 'Bravo' },
  { emoji: '😮', label: 'Surpris' },
];

/**
 * Service des actualités côté utilisateur.
 * Passe par HttpClient (et non fetch) pour que authTokenInterceptor ajoute le JWT :
 * le backend s'en sert pour savoir qui réagit / commente / a lu.
 */
@Injectable({ providedIn: 'root' })
export class NewsService {
  private baseUrl = environment.apiUrl + 'news/';

  constructor(private http: HttpClient) {}

  /** Récupère les actualités publiées, les plus récentes en premier
   * @param limite Nombre maximum d'actualités à récupérer (par défaut 5)
   * @param offset Nombre d'actualités à sauter (pagination « Voir plus »)
   */
  getNews(limite: number = 5, offset: number = 0): Promise<News[]> {
    return firstValueFrom(this.http.get<News[]>(`${this.baseUrl}?limite=${limite}&offset=${offset}`))
      .then((news) => news ?? []);
  }

  /** Récupère le détail complet (avec contenu) d'une actualité publiée
   * @param id L'ID de l'actualité
   */
  getNewsById(id: number): Promise<News> {
    return firstValueFrom(this.http.get<News>(`${this.baseUrl}${id}`));
  }

  /** Ajoute la réaction de l'utilisateur connecté, ou la retire s'il l'avait déjà.
   * Une seule réaction par utilisateur et par actualité : en choisir une autre remplace la précédente.
   * @returns Les compteurs de réactions à jour
   */
  toggleReaction(newsId: number, emoji: string): Promise<NewsReaction[]> {
    return firstValueFrom(this.http.post<NewsReaction[]>(`${this.baseUrl}${newsId}/reactions`, { emoji }));
  }

  /** Commentaires d'une actualité, du plus ancien au plus récent */
  getComments(newsId: number): Promise<NewsComment[]> {
    return firstValueFrom(this.http.get<NewsComment[]>(`${this.baseUrl}${newsId}/comments`))
      .then((comments) => comments ?? []);
  }

  /** Ajoute un commentaire au nom de l'utilisateur connecté */
  addComment(newsId: number, contenu: string): Promise<NewsComment> {
    return firstValueFrom(this.http.post<NewsComment>(`${this.baseUrl}${newsId}/comments`, { contenu }));
  }

  /** Supprime un commentaire (autorisé à son auteur ou à un admin, vérifié côté backend) */
  deleteComment(commentId: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}comments/${commentId}`));
  }

  /** Marque l'actualité comme lue par l'utilisateur connecté (idempotent) */
  markAsRead(newsId: number): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.baseUrl}${newsId}/vue`, {}));
  }
}
