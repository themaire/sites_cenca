export interface Extraction {
  ext_id: number;
  ref_identifiant: string;
  nom_complet: string;
  ext_code_site?: string;
  ext_description: string;
  date: string;
  ext_code_inconnu?: boolean
}

export interface ParcelleExtraction {
  parex_id: number;
  ref_ext_id: number;
  parex_insee: number;
  parex_prefixe: number;
  parex_section: string;
  parex_numero: number;
}
  