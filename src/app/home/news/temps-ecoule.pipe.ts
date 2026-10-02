import { Pipe, PipeTransform } from '@angular/core';

/**
 * Affiche une date sous forme relative : « à l'instant », « il y a 5 min », « il y a 3 h »,
 * « hier », « il y a 4 j ». Au-delà d'une semaine : date au format jj/mm/aaaa.
 */
@Pipe({ name: 'tempsEcoule', standalone: true })
export class TempsEcoulePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, maintenant: Date = new Date()): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const minutes = Math.floor((maintenant.getTime() - date.getTime()) / 60000);
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `il y a ${heures} h`;
    const jours = Math.floor(heures / 24);
    if (jours === 1) return 'hier';
    if (jours < 7) return `il y a ${jours} j`;

    const jj = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${jj}/${mm}/${date.getFullYear()}`;
  }
}
