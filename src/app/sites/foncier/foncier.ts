export interface Extraction {
  ext_id: number;
  ref_cd_salarie: string;
  nom_complet: string;
  ext_code_site?: string;
  ext_description: string;
  date: string;
}

export interface ParcelleExtraction {
  parex_id: number;
  ref_ext_id: number;
  parex_insee: number;
  parex_prefixe: number;
  parex_section: string;
  parex_numero: number;
}
  