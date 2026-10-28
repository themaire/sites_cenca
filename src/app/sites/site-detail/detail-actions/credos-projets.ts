/**
 * Crédos du CENCA et correspondance avec les types de projet.
 *
 * Le crédo donne le texte et la couleur du bandeau vertical de la fiche projet,
 * ainsi que la couleur du fond derrière la fenêtre de dialogue.
 * Les couleurs sont dans src/app/styles/_variables.scss ($proteger, $connaitre...),
 * appliquées par les classes .credo-<cle> (action_travaux.component.scss et styles.scss).
 */

export type CleCredo = 'proteger' | 'connaitre' | 'gerer' | 'valoriser' | 'accompagner' | 'administratif';

/** Crédo pas encore connu (chargement, type de projet pas choisi) : couleurs neutres, bandeau sans texte */
export const CREDO_NEUTRE = { cle: 'neutre', libelle: '' } as const;

export interface Credo {
  cle: CleCredo;
  libelle: string;
}

export const CREDOS: Record<CleCredo, Credo> = {
  proteger: { cle: 'proteger', libelle: 'Protéger' },
  connaitre: { cle: 'connaitre', libelle: 'Connaître' },
  gerer: { cle: 'gerer', libelle: 'Gérer' },
  valoriser: { cle: 'valoriser', libelle: 'Valoriser' },
  accompagner: { cle: 'accompagner', libelle: 'Accompagner' },
  administratif: { cle: 'administratif', libelle: 'Administratif' },
};

/**
 * TABLEAU DE CORRESPONDANCE type de projet → crédo.
 * À modifier ici si les collègues décident de reclasser un type.
 * Un type absent du tableau tombe sur CREDO_PAR_DEFAUT.
 */
export const CREDO_PAR_TYPE_PROJET: Record<string, CleCredo> = {
  TRV: 'gerer',          // Intervention sur site (travaux)
  NR: 'gerer',           // Non renseigné (anciens travaux)
  SEN: 'valoriser',      // Sensibilisation et communication
  FON: 'proteger',       // Veille et animation foncière
  ETU: 'connaitre',      // Étude et suivi scientifique
  PAR: 'proteger',       // Partenariat et ancrage territorial
  POL: 'proteger',       // Police et surveillance
  ACC: 'proteger',       // Accompagnement et conseil
  ADM: 'administratif',  // Administratif
  // AUT : Autre — non classé pour l'instant, prend le crédo par défaut
};

/**
 * TABLEAU DE CORRESPONDANCE branche d'action (racine, cd_action) → crédo.
 * Sert aux projets « autres » sans type exploitable (TYPES_SANS_CREDO, souvent d'anciens
 * projets saisis dans Access) : on prend la branche de leur première opération.
 */
export const CREDO_PAR_BRANCHE_ACTION: Record<string, CleCredo> = {
  '3': 'connaitre',      // Etudes et suivis écologiques
  '13': 'connaitre',     // Diagnostics de territoire
  '10': 'connaitre',     // Plans de gestion
  '9': 'valoriser',      // Sensibilisation
  '11': 'valoriser',     // Animation du réseau de bénévoles
  '1': 'proteger',       // Gestion du foncier et conventionnement
  '2': 'proteger',       // Police de l'environnement
  '12': 'proteger',      // Développement et maintien de partenariats
  '14': 'proteger',      // Assistance technique et représentation
  '15': 'administratif', // Coordination de projets
  '7': 'gerer',          // Gestion de la faune sauvage
  '6': 'gerer',          // Gestion des déchets
};

/** Types qui ne disent rien du crédo : on se rabat sur la branche d'action */
export const TYPES_SANS_CREDO = ['NR', 'AUT'];

export const CREDO_PAR_DEFAUT: CleCredo = 'gerer';

export function credoDuTypeProjet(typ_projet: string | null | undefined): Credo {
  return CREDOS[CREDO_PAR_TYPE_PROJET[typ_projet ?? ''] ?? CREDO_PAR_DEFAUT];
}

/**
 * Crédo d'un projet : par son type, ou, si le type est NR/AUT/vide,
 * par la branche racine de l'action de sa première opération.
 */
export function credoDuProjet(typ_projet: string | null | undefined, brancheAction?: string | null): Credo {
  if (typ_projet && !TYPES_SANS_CREDO.includes(typ_projet)) return credoDuTypeProjet(typ_projet);
  const cle = CREDO_PAR_BRANCHE_ACTION[brancheAction ?? ''];
  return cle ? CREDOS[cle] : credoDuTypeProjet(typ_projet);
}
