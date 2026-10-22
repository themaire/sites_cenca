/** Avatar habituel de Sonneur, et repli si un avatar de saison ne se charge pas. */
export const AVATAR_SONNEUR = 'assets/chatbot/sonneur.svg';

/** Déguisement de Sonneur, porté quand `active(date)` est vrai. */
interface Saison {
  nom: string;
  avatar: string;
  active: (date: Date) => boolean;
}

/** Date ramenée à un nombre comparable MMJJ (ex. 15 octobre → 1015). */
function moisJour(date: Date): number {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

/**
 * Période fixe chaque année, bornes incluses (MMJJ). Elle peut chevaucher
 * le changement d'année (Noël : 1201 → 0106).
 */
function periode(debut: number, fin: number): (date: Date) => boolean {
  return date => {
    const jour = moisJour(date);
    return debut <= fin ? jour >= debut && jour <= fin : jour >= debut || jour <= fin;
  };
}

/** Dimanche de Pâques (calendrier grégorien, algorithme de Meeus/Jones/Butcher). */
export function dimanchePaques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(annee, mois - 1, jour);
}

/** Semaine de Pâques : du lundi précédant Pâques au lundi de Pâques inclus. */
function semainePaques(date: Date): boolean {
  const paques = dimanchePaques(date.getFullYear());
  const debut = new Date(paques.getFullYear(), paques.getMonth(), paques.getDate() - 6);
  const fin = new Date(paques.getFullYear(), paques.getMonth(), paques.getDate() + 1);
  const jour = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return jour >= debut && jour <= fin;
}

/** Dans l'ordre de priorité : le premier déguisement actif l'emporte (1er avril avant Pâques). */
const SAISONS: Saison[] = [
  { nom: 'poisson-avril', avatar: 'assets/chatbot/sonneur-poisson-avril.svg', active: periode(401, 401) },
  { nom: 'paques', avatar: 'assets/chatbot/sonneur-paques.svg', active: semainePaques },
  { nom: 'musique', avatar: 'assets/chatbot/sonneur-musique.svg', active: periode(621, 621) },
  { nom: 'ete', avatar: 'assets/chatbot/sonneur-ete.svg', active: periode(714, 815) },
  { nom: 'halloween', avatar: 'assets/chatbot/sonneur-halloween.svg', active: periode(1015, 1102) },
  { nom: 'noel', avatar: 'assets/chatbot/sonneur-noel.svg', active: periode(1201, 106) },
];

/** Saison en cours à cette date, ou null hors période de déguisement. */
export function saisonSonneur(date: Date = new Date()): Saison | null {
  return SAISONS.find(saison => saison.active(date)) ?? null;
}

/** Avatar de Sonneur à afficher à cette date : déguisé en saison, habituel sinon. */
export function avatarSonneur(date: Date = new Date()): string {
  return saisonSonneur(date)?.avatar ?? AVATAR_SONNEUR;
}
