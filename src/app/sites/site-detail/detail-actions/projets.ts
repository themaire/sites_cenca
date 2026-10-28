import { Localisation } from "../../../shared/interfaces/localisation";
import { Commune } from '../../site-detail/detail-infos/commune';

// Sont en fait des champs de la vue ope.synthesesites
export interface ProjetLite {
    uuid_proj: string;
    responsable: string;
    annee: string;
    pro_debut: string;
    action: string;
    typ_interv: string;
    generation: string;
    statut: string;
    webapp: boolean;
    uuid_site: string;
    uuid_espace?: string; // cd_localisation du site pour les projets « autres »
    geojson_site: string;
    nom?: string;
    communes?: Commune[];
    code?: string;
    departement?: string;
    localisation_site?: Localisation;
    typ_projet?: string;     // type du projet (SEN, ETU...), si la route lite le fournit
    typ_projet_libelle?: string; // libellé du type (« Sensibilisation et Communication »)
    branche_action?: string; // cd_action racine de l'action (ex. '9'), si la route lite le fournit
    credo?: string; // clé du crédo (couleur de la ligne), calculée par detail-actions
}

// A EFFACTER DES QUE POSSIBLE
export interface ProjetV {
    uuid_proj: string;
    code: string;
    itin_tech: string;
    validite: boolean;
    document: string;
    programme: string;
    nom: string;
    perspectives: string;
    annee: string;
    statut: string;
    responsable: string;
    typ_projet: string;
    type_projet: string;
    createur: string;
    date_crea: Date;
}

export interface Projet {
    uuid_proj: string;
    code?: string;
    itin_tech?: string;
    validite?: boolean;
    document?: string;
    programme?: string;
    nom?: string;
    perspectives?: string;
    annee?: string;
    statut?: string;
    responsable?: string;
    typ_projet?: string;
    createur?: string;
    date_crea?: Date;
    site?: string;
    pro_webapp?: boolean;
    pro_maitre_ouvrage?: number;
    ref_loc_id?: number;
    localisation_projet?: Localisation | null;
    communes?: Commune[];
    geom?: string;
}
