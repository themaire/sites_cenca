export interface ListSiteChiro {
  id_site: number;
  type_site: string;
  nature: string;
  insee: string;
  commune: string;
  code: string;
  nom: string;
  nbrel: number;
  nbobs: number;
  wgs84_x?: number;
  wgs84_y?: number;
}

export interface DetailSiteChiro {
  id_site: number;
  code: string;
  nom: string;
  localisation?: string;
  contact?: string;
  proprietaire?: string;
  type_proprietaire?: string;
  description?: string;
  interet?: string;
  accessibilite?: boolean;
  protection?: boolean;
  date_protection?: string;
  definition?: string;
  definition_libelle?: string;
  nature?: string;
  nature_libelle?: string;
  configuration?: string;
  configuration_libelle?: string;
  habitat?: number;
  habitat_libelle?: string;
  periode?: string;
  periode_libelle?: string;
  suivi_prc?: boolean;
  date_creation?: string;
  communes?: string[];
  insees?: string[];
  wgs84_x?: number;
  wgs84_y?: number;
  x_lambert?: number;
  y_lambert?: number;
  type_localisation?: number;
  pointage_loc?: number;
  precision_loc?: number;
  priorisation?: boolean;
}

export interface CreateSite {
  code: string;
  nom: string;
  insee: string;
  nature?: string;
  definition?: string;
  configuration?: string;
  habitat?: number;
  periode?: string;
  localisation?: string;
  contact?: string;
  proprietaire?: string;
  type_proprietaire?: string;
  description?: string;
  interet?: string;
  accessibilite?: boolean;
  protection?: boolean;
  date_protection?: string;
  suivi_prc?: boolean;
  priorisation?: boolean;
  lat?: number;
  lng?: number;
  x_lambert?: number;
  y_lambert?: number;
  type_localisation?: number;
  pointage_loc?: number;
  precision_loc?: number;
}

export type UpdateSite = Partial<CreateSite>;
