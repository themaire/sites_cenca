// Ceci est un fichier d'interfaces
import { Feature, Geometry } from 'geojson';

export interface Localisation {
    loc_id?: number;
    loc_date: Date | null;
    geojson: Feature<Geometry>;
    surface: number;
    type: string;
    ref_uuid_ope?: string;
    ref_uuid_proj?: string;
  }