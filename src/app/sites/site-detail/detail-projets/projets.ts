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
    geojson_site: string;
    nom?: string;
}

// A EFFACTER DES QUE POSSIBLE
export interface ProjetV {
    uuid_proj: string;
    code: string;
    itin_tech: string;
    validite: string;
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
    validite?: string;
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
    // pro_debut?: Date;
    // pro_fin?: Date;
    pro_pression_ciblee?: string;
    pro_webapp?: boolean
    pro_results_attendus?: number;
    pro_maitre_ouvrage?: number;
    pro_surf_totale?: number;
    ref_loc_id?: number;
    geojson_site?: string;
    geom?: string;
}
