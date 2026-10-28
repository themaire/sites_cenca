// Interfaces des projets « autres » (hors travaux) : schéma opeautres
// Backend : routes /sites/autres/...

import { SelectValue } from '../../../../shared/interfaces/formValues';

/** Nœud de l'arbre des actions (GET sites/autres/actions?typ_projet=...) */
export interface ActionAutre {
  cd_action: string;
  cd_sup?: string;
  libelle: string;
  commentaire?: string | null;
  racine?: string;
  profondeur?: number;
  conseillee?: boolean;
  enfants: ActionAutre[];
}

/** Cible écologique : groupe = code du parent */
export interface CibleNomenclature extends SelectValue {
  groupe?: string;
}

/** Mode d'intervention (régie, bénévoles, prestataire...) */
export interface TypIntervention extends SelectValue {
  val_filtre?: number | null;
}

/** GET sites/autres/nomenclatures */
export interface NomenclaturesAutres {
  typ_projets: SelectValue[];
  statuts: string[];
  cibles: {
    publics: CibleNomenclature[];
    ecologiques: CibleNomenclature[];
    autres: CibleNomenclature[];
  };
  indicateurs: SelectValue[];
  roles: SelectValue[];
  typ_interventions: TypIntervention[];
  programmes: SelectValue[];
}

/** GET sites/autres/selectors */
export interface SelectorsAutres {
  annees: number[];
  responsables: SelectValue[];
  typ_projets: SelectValue[];
  statuts: string[];
}

/** GET sites/autres/localisants?q=... */
export interface Localisant {
  cd_localisation: string;
  code?: string;
  libelle: string;
  cat: string;
  description?: string;
}

export interface CibleOperation {
  typ_cible: string;
  libelle?: string;
  detail?: string | null;
}

export interface IndicateurOperation {
  uuid_indic?: string;
  typ_indicateur: string;
  libelle?: string;
  evaluation: string | number | null;
}

export interface IntervenantOperation {
  typ_role: string;
  role_libelle?: string;
  intervenant: string; // uuid_ann
  nom?: string;
}

/** Opération lue (GET projets/:uuid -> operations[], GET operations/:uuid) */
export interface OperationAutre {
  uuid_ope: string;
  uuid_proj: string;
  action: string;
  action_chemin: { cd_action: string; libelle: string }[];
  date_deb: string | null;
  date_fin: string | null;
  date_deb_str?: string | null;
  date_fin_str?: string | null;
  detail: string | null;
  typ_interv: string | null;
  typ_interv_libelle?: string | null;
  com_interv: string | null;
  validite?: boolean;
  localisations: Localisant[];
  cibles: CibleOperation[];
  indicateurs: IndicateurOperation[];
  intervenants: IntervenantOperation[];
}

/** Opération envoyée au backend (POST projets/:uuid/operations, PUT operations/:uuid) */
export interface OperationAutreBody {
  action: string;
  date_deb: string | null;
  date_fin: string | null;
  detail: string | null;
  typ_interv: string | null;
  com_interv: string | null;
  localisations: string[];
  cibles: { typ_cible: string; detail: string | null }[];
  indicateurs: { typ_indicateur: string; evaluation: string | number }[];
  intervenants: { typ_role: string; intervenant: string }[];
}

/** Projet lu (GET projets/:uuid) */
export interface ProjetAutre {
  uuid_proj: string;
  code: string;
  nom: string;
  annee: number;
  statut: string;
  typ_projet: string;
  typ_projet_libelle?: string;
  responsable: string;
  responsable_str?: string;
  programme: string | null;
  createur: string;
  date_crea: string;
  validite?: boolean;
  ouvert_par: { compte: string; nom: string }[];
  operations: OperationAutre[];
}

/** Ligne de la recherche (GET projets?...) */
export interface ProjetAutreLite {
  uuid_proj: string;
  code: string;
  nom: string;
  annee: number;
  statut: string;
  typ_projet: string;
  typ_projet_libelle?: string;
  responsable: string;
  responsable_str?: string;
  programme: string | null;
  createur: string;
  date_crea: string;
  nb_ope: number;
  date_deb: string | null;
  date_fin: string | null;
  localisations: string | null;
}

/** Champs du projet envoyés en POST / PUT */
export interface ProjetAutreBody {
  nom: string;
  typ_projet: string;
  annee: number;
  statut?: string;
  responsable?: string;
  programme?: string | null;
  operations?: OperationAutreBody[];
}

/** Réponse 400 du backend : toutes les erreurs de saisie d'un coup */
export interface ErreurSaisie {
  success: false;
  message: string;
  erreurs?: string[];
  detail?: string;
}

/** Catégories de localisants (GET localisants?cat=...) */
export const CATEGORIES_LOCALISANTS: { cat: string; libelle: string }[] = [
  { cat: 'SITE CENCA', libelle: 'Site CENCA' },
  { cat: 'AUTRE CENCA', libelle: 'Autre espace CENCA' },
  { cat: 'COM', libelle: 'Commune' },
  { cat: 'TERR', libelle: 'Territoire' },
  { cat: 'N2000', libelle: 'Natura 2000' },
  { cat: 'RN', libelle: 'Réserve naturelle' },
  { cat: 'AP', libelle: 'Arrêté de protection' },
  { cat: 'ZIE', libelle: 'ZIE' },
  { cat: 'PN', libelle: 'Parc national' },
  { cat: 'TMIL', libelle: 'Terrain militaire' },
  { cat: 'CDL', libelle: 'Conservatoire du littoral' },
  { cat: 'RB', libelle: 'Réserve biologique' },
  { cat: 'RAMSAR', libelle: 'Ramsar' },
];

/**
 * Valeurs proposées en premier selon le type de projet (usages réels, opérations 2023+).
 * - branches : branches d'actions conseillées (le backend les renvoie aussi avec conseillee: true)
 * - cibles : famille de cibles affichée par défaut
 * - indicateur : indicateur proposé sur la première ligne d'une nouvelle opération
 */
export const USAGES_PAR_TYPE: Record<string, { cibles: 'publics' | 'ecologiques'; indicateur: string }> = {
  SEN: { cibles: 'publics', indicateur: 'NBPER' },
  ETU: { cibles: 'ecologiques', indicateur: 'NBPAS' },
  PAR: { cibles: 'publics', indicateur: 'NBPER' },
  ACC: { cibles: 'ecologiques', indicateur: 'NBINT' },
  POL: { cibles: 'ecologiques', indicateur: 'NBPAS' },
  ADM: { cibles: 'publics', indicateur: 'NBREU' },
  FON: { cibles: 'publics', indicateur: 'NBREU' },
  AUT: { cibles: 'publics', indicateur: 'NBPER' },
};

/** Le backend stocke les retours à la ligne en « | » (fonction Formatage d'Access) */
export function pipesVersSautsDeLigne(texte: string | null | undefined): string {
  return (texte ?? '').replace(/\s*\|\s*/g, '\n');
}
