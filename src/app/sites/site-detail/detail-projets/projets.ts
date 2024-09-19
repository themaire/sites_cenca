export interface ProjetLite {
    uuid_ope: string;
    uuid_proj: string;
    responsable: string;
    annee: string;
    date_deb: string;
    projet: string;
    action: string;
    typ_interv: string;
    statut: string;
    webapp: boolean;
    uuid_site?: string;

}
export interface ProjetV {
    uuid_ope: string;
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
    uuid_ope: string;
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
    pro_debut: Date;
    pro_fin: Date;
    pro_pression_ciblee: string;
    pro_typ_objectif: string;
    pro_enjeux_eco: string;
    pro_nv_enjeux: string;
    pro_obj_ope: string;
    pro_obj_projet: string;
    pro_surf_totale: string;
    pro_webapp: boolean
}