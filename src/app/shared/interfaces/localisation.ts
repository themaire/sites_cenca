// Ceci est un fichier d'interfaces

export interface Localisation {
    loc_id: number;
    loc_date: Date;
    geojson: string;
    ref_uuid_ope?: string;
    ref_uuid_proj?: string;
  }