export interface ObservationDetail {
  uuid_observation: string;
  cd_espece: string;
  espece_nom: string;
  nombre: number;
  type_observation: string;
  type_obs_libelle: string;
  type_denombrement: string;
  denombrement_libelle: string;
  objet: string;
  objet_libelle: string;
  cd_methode: string;
  methode_libelle: string;
  cd_statut_biologique: string;
  statut_bio_libelle: string;
  stade: string;
  stade_libelle: string;
  sexe: string;
  sexe_libelle: string;
  etat_biologique: string;
  etat_bio_libelle: string;
  commentaire?: string;
  mortalite_cause?: string;
  mortalite_detail?: string;
  test_rabique?: string;
  resultat_test?: string;
  nb_biometries: number;
}
