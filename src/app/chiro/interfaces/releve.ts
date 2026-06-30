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
  detail_date?: string;
  insee: string;
  commune_nom?: string;
  precision_loc?: string;
  observateur_cite?: string;
  site: number;
  nom_site?: string;
  code_site?: string;
  x?: number;
  y?: number;
  programme?: string;
  programme_nom?: string;
  habitat?: number;
  commentaire?: string;
  compte_saisie?: string;
  date_saisie?: string;
}
