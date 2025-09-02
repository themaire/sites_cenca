export interface Extraction {
  ext_id: number;
  ref_identifiant: string;
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
  
export interface ProjetMfu {
  pmfu_id: number;
  pmfu_nom: string;
  pmfu_responsable?: string;
  pmfu_agence?: string;
  pmfu_associe?: string;
  pmfu_etapes?: string;
  pmfu_departement?: string;
  pmfu_territoire?: string;
  pmfu_type?: string;
  pmfu_commune?: string;
  pmfu_debut?: number;
  pmfu_proprietaire?: string;
  pmfu_appui?: string;
  pmfu_juridique?: string;
  pmfu_validation?: string;
  pmfu_decision?: string;
  pmfu_note?: string;
  pmfu_acte?: string;
  pmfu_compensatoire?: string;
  pmfu_cout?: string;
  pmfu_financements?: string;
  pmfu_superficie?: number;
  pmfu_priorite?: string;
  pmf_status?: string;
  pmfu_signature?: number;
  pmfu_echeances?: string;
  pmfu_creation?: string; // ISO date string
  pmfu_derniere_maj?: string; // ISO date string
  pmfu_photos_site?: string;
  pmfu_date_ajout?: string; // ISO date string
}

export interface ProjetsMfu {
  pmfu_id: number;
  pmfu_nom: string;
  pmfu_responsable?: string;
  pmfu_commune?: string;
}