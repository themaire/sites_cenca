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
  pmfu_agence?: number;
  pmfu_associe?: string;
  pmfu_proch_etape?: number;
  pmfu_dep?: string;
  pmfu_territoire?: number;
  pmfu_type_acte?: number;
  pmfu_commune_insee?: string;
  pmfu_commune_nom?: string;
  pmfu_annee_debut?: number;
  pmfu_proprietaire?: string;
  pmfu_appui?: number;
  pmfu_appui_desc?: string;
  pmfu_quest_juri?: string;
  pmfu_validation?: number;
  pmfu_mes_comp?: boolean;
  pmfu_cout?: number;
  pmfu_financements?: number[];
  pmfu_superficie?: number;
  pmfu_priorite?: number;
  pmfu_status?: number;
  pmfu_annee_signature?: number;
  pmfu_echeances?: Date;
  pmfu_creation?: Date; // ISO date string
  pmfu_derniere_maj?: Date; // ISO date string
  pmfu_parc_list?: string;
  // Maintenant les champs additionnels hors bdd
  pmfu_parc_list_array?: string[];
  pmfu_createur?: string;
  projet_acte_nb?: number;
  note_bureau_nb?: number;
  decision_bureau_nb?: number;
  photos_site_nb?: number;
}

export interface ProjetsMfu {
  pmfu_id: number;
  pmfu_nom: string;
  pmfu_responsable?: string;
  pmfu_commune_insee?: string;
  pmfu_commune_nom?: string;
}

export interface DocPmfu {
  doc_id: number;
  doc_name: string;
  doc_type: string;
  doc_path: string;
  ref_pmfu_id: number;
}

export interface ParcellesSelected {
  idu: string;
  nom_com: string;
  section: string;
  numero: string;
  contenance: number;
  bbox?: number[]; // [minX, minY, maxX, maxY]
}
