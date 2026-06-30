export interface ListReleve {
  uuid_releve: string;
  insee: string;
  commune: string;
  site: string;
  date_releve: string;
  orga: string;
  nbesp: number;
  nbobs: number;
  id_site: number;
  code_site_chiro: string;
  nom_site: string;
}

export interface DetailReleve {
  uuid_releve: string;
  date_releve: string;
  date_approximative?: string;
  insee: string;
  commune_nom?: string;
  precision_loc?: string;
  observateur?: string;
  site: number;
  nom_site?: string;
  code_site?: string;
  x?: number;
  y?: number;
  uuid_programme?: string;
  programme_nom?: string;
  cd_protocole?: string;
  protocole_libelle?: string;
  periode?: string;
  periode_libelle?: string;
  duree?: string;
  detail?: string;
  habitat?: number;
  habitat_libelle?: string;
  commentaire?: string;
  compte_creation?: string;
  date_saisie?: string;
}
