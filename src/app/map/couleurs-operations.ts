/**
 * Couleurs fixes par type d'opération de travaux.
 * Copie de la source de vérité côté backend : node_pgsql/fonctions/couleursOperations.js
 * (utilisée pour la carte de la fiche travaux .docx) — à garder synchronisée.
 *
 * Règle : COULEURS_ACTION_2[action_2] ?? COULEURS_ACTION[action] ?? COULEUR_OPERATION_DEFAUT
 * Le jaune est réservé au contour du site.
 */

/** Par type d'intervention (action_2) */
export const COULEURS_ACTION_2: Record<string, string> = {
  '201': '#00796b', // Bûcheronnage
  '202': '#c5e1a5', // Débroussaillage
  '203': '#7cb342', // Broyage
  '204': '#2ecc40', // Fauche
  '205': '#4db6ac', // Taille
  '206': '#33691e', // Arrachage
  '210': '#e67e22', // Pâturage
  '211': '#a0522d', // Intervention sur clôtures
  '212': '#8d6e63', // Infrastructures pour le pâturage
  '220': '#8e44ad', // Infrastructures d'accès au site
  '221': '#e84393', // Équipements pédagogiques
  '225': '#616161', // Évacuation des déchets
  '230': '#1565c0', // Creusement
  '231': '#42a5f5', // Curage
  '232': '#00acc1', // Vidange
  '233': '#0d47a1', // Intervention sur les berges
  '234': '#5c6bc0', // Équipements de régulation des niveaux d'eau
  '235': '#26c6da', // Pêche
  '236': '#283593', // Digue
};

/** Par type d'opération (action), pour les opérations sans action_2 */
export const COULEURS_ACTION: Record<string, string> = {
  '027_TRAV_MECA': '#43a047', // Végétation
  '027_TRAV_MECA_V2': '#43a047',
  '028_TRAV_PAT': '#e67e22', // Pâturage
  '028_TRAV_PAT_V2': '#e67e22',
  '031_TRAV_INFR': '#8d6e63', // Infrastructures pâturage
  '008_TRAV_AMEN': '#8e44ad', // Aménagement
  '008_TRAV_AMEN_V2': '#8e44ad',
  '200_TRAV_DECH': '#616161', // Déchets
  '200_TRAV_DECH_V2': '#616161',
  '005_TRAV_HYDRO': '#1e88e5', // Hydraulique
  '005_TRAV_HYDRO_V2': '#1e88e5',
  '029_TRAV_SOL': '#795548', // Travail du sol
  '029_TRAV_SOL_V2': '#795548',
};

/** Autre / non renseigné */
export const COULEUR_OPERATION_DEFAUT = '#90a4ae';

/** Opacité de remplissage des polygones d'opération (identique à la fiche travaux) */
export const OPACITE_OPERATION = 0.35;

export function couleurOperation(action_2?: string | number | null, action?: string | null): string {
  return (
    (action_2 != null ? COULEURS_ACTION_2[String(action_2)] : undefined) ??
    (action ? COULEURS_ACTION[action] : undefined) ??
    COULEUR_OPERATION_DEFAUT
  );
}
