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
  description_programme?: string;
  cadre_intervention?: number;
  cadre_intervention_detail?: number;
  quantite?: number;
  unite?: number;

  exportation_fauche?: boolean;
  total_exporte_fauche?: number;
  productivite_fauche?: number;

  effectif_paturage?: number;
  nb_jours_paturage?: number;
  chargement_paturage?: number;
  abroutissement_paturage?: number;
  recouvrement_ligneux_paturage?: number;

  interv_cloture?: number;

  type_intervention_hydro?: number;

  // Nouvelles propriétés pour les cases à cocher des programmes
  ope_programmes?: OperationCheckbox[]; // Liste des programmes associés
  liste_ope_programmes?: OperationCheckbox[]; // Liste complète des programmes disponibles

  // Nouvelles propriétés pour les cases à cocher des types d'animaux
  ope_animal_paturage?: OperationCheckbox[]; // Liste des programmes associés
  liste_ope_animaux_paturage?: OperationCheckbox[]; // Liste complète des programmes disponibles
}

export interface OperationCheckbox {
    lib_libelle?: any;
    lib_id?: any;
    uuid_ope: string; // Identifiant unique de l'opération
    checkbox_id?: number; // Identifiant du programme associé
    checkbox_ids?: number[];
    checked?: boolean; // Tableau contenant les IDs des programmes associés
}