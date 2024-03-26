export interface DetailSite {
    uuid_site: string;
    code: string;
    prem_ctr: string;
    ref_fcen: string;
    pourc_gere: string;
    surf_actes: string; 
    url_cen: string;
    validite: string;
    espace: string;
    typ_site: string; 
    responsable: string;
    date_crea_site: Date;
    id_mnhn: string;
    modif_admin: string;
    actuel: string;
    url_mnhn: string;
    parties_gerees: string;
    typ_ouverture: string;
    description_site: string;
    sensibilite: string;
    remq_sensibilite: string;
    ref_public: string;

    uuid_espace: string;
    date_crea_espace: Date;
    id_espace: string;
    nom: string;
    surface: number;
    carto_hab: number; 
    zh: boolean;
    typ_espace: string;
    bassin_agence: string;
    rgpt: string; 
    typ_geologie: string;
    id_source: string;
    id_crea: string;
    url: string;
    maj_admin: Date;

    // : string;
    // : string;
    // : string;
    // : string;
    // : string;
    // : string;
    // : string;
}