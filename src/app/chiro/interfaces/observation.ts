export interface ObservationDetail {
  uuid_observation: string;
  cd_espece: string;
  espece_nom: string;
  nombre: number;
  type_observation: string;
  type_obs_libelle: string;
  denombrement: string;
  denombrement_libelle: string;
  objet: string;
  objet_libelle: string;
  methode: string;
  methode_libelle: string;
  statut_biologique: string;
  statut_bio_libelle: string;
  stade: string;
  stade_libelle: string;
  sexe: string;
  sexe_libelle: string;
  etat_bio: string;
  etat_bio_libelle: string;
  commentaire?: string;
  mortalite_cause?: string;
  test_rabique?: boolean;
  resultat_test?: string;
  nb_biometries: number;
}
