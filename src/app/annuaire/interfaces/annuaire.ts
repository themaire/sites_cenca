// Interfaces du module Annuaire (contacts : agriculteurs, entreprises, etc.)
// Backend : schéma "ann" — routes /annuaire/...

export interface EtiquetteAgregee {
  typ_etiquette: string;
  libelle: string;
}

// Ligne de la liste des contacts (GET /annuaire)
export interface AnnuaireLite {
  uuid_ann: string;
  nom: string;
  adresse?: string;
  typ_personne?: string;
  telephone?: string;
  mail?: string;
  validite?: boolean;
  etiquettes?: EtiquetteAgregee[];
}

// Fiche complète d'un contact (GET /annuaire/:uuid, POST /annuaire, PUT /annuaire/:uuid)
export interface Annuaire {
  uuid_ann?: string;
  nom: string;
  adresse?: string;
  val_tri?: string;
  val_filtre?: string;
  typ_personne?: string;
  validite?: boolean;
  telephone?: string;
  mail?: string;
  actuel?: string;
}

// ann.competences (PK composite annuaire, typ_competence)
export interface Competence {
  annuaire: string;
  typ_competence: string;
  libelle?: string;
  notation?: number;
  remarque?: string;
}

// ann.etiquettes (PK composite annuaire, typ_etiquette)
export interface Etiquette {
  annuaire: string;
  typ_etiquette: string;
  libelle?: string;
}
