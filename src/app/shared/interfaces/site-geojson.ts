import { FeatureCollection, Feature, MultiPolygon, Polygon, Point, LineString } from 'geojson';

/**
 * Interface pour les propriétés spécifiques d'un site CENCA
 */
export interface SiteCencaProperties {
  bassinagence: string;
  carto: number;
  codegeol: string | null;
  codesite: string;
  detail: string;
  gestion: string;
  gestiontxt: string;
  idsite: string;
  localisant: string;
  milieunat: string;
  nomsite: string;
  premiercontrat: number;
  referent: string;
  rgpt: string | null;
  surface: number | null;
  type: string;
  zonehumide: string;
}

/**
 * Interface pour une Feature de site CENCA
 * Étend la Feature GeoJSON avec des propriétés spécifiques
 */
export interface SiteCencaFeature extends Feature {
  id: string;
  bbox: [number, number, number, number]; // [minX, minY, maxX, maxY]
  geometry: MultiPolygon | Polygon | Point | LineString;
  properties: SiteCencaProperties;
}

/**
 * Interface pour la collection de sites CENCA
 * Étend FeatureCollection avec des contraintes spécifiques
 */
export interface SiteCencaCollection extends FeatureCollection {
  type: 'FeatureCollection';
  bbox: [number, number, number, number]; // [minX, minY, maxX, maxY]
  features: SiteCencaFeature[];
}

/**
 * Interface pour les types de gestion possibles
 */
export interface TypeGestion {
  code: string;
  libelle: string;
}

/**
 * Interface pour les types de milieux naturels
 */
export interface TypeMilieuNaturel {
  code: string;
  libelle: string;
}

/**
 * Interface pour les bassins d'agence
 */
export interface BassinAgence {
  code: string;
  libelle: string;
}

/**
 * Interface pour les référents/responsables
 */
export interface Referent {
  nom: string;
  email?: string;
  telephone?: string;
}