export interface OperationLite {
    uuid_ope: string;
    ref_uuid_proj: string;
    obj_oper?: string;
    code?: string;
    titre?: string;
    description?: string;
    surf?: number;
    date_debut?: Date;
  }

  export interface Operation {
  uuid_ope: string;
  code?: string;
  titre?: string;
  obj_ope?: string;
  inscrit_pdg?: string;
  rmq_pdg?: string;
  description?: string;
  interv_zh?: string;
  surf?: number;
  lin?: number;
  app_fourr?: number;
  pression_moy?: number;
  ugb_moy?: number;
  nbjours?: number;
  charge_moy?: number;
  charge_inst?: number;
  remarque?: string;
  validite?: boolean;
  action?: string;
  action_2?: string;
  objectif?: string;
  typ_intervention?: string;
  date_debut?: Date;
  date_fin?: Date;
  date_approx?: string;
  ben_participants?: number;
  ben_heures?: number;
  ref_uuid_proj: string;
  date_ajout?: Date;
  ref_loc_id?: Number;
  nom_mo?: string;
  programme?: string;
  cadre_intervention?: number;
  cadre_intervention_detail?: number;

  // Nouvelles propriétés
  ope_programmes?: { lib_id: number; lib_libelle: string }[]; // Liste des programmes associés
  liste_ope_programmes?: { lib_id: number; lib_libelle: string, checked: boolean }[]; // Liste complète des programmes disponibles
}
  
  export interface OperationProgramme {
    lib_libelle: any;
    lib_id: any;
    uuid_ope: string; // Identifiant unique de l'opération
    programme_ids: number[]; // Tableau contenant les IDs des programmes associés
  }