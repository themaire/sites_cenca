import { GeoJsonObject } from 'geojson';
import { Localisation } from '../shared/interfaces/localisation';

export interface DetailSite {
    message: string;
    uuid_site: string;
    code: string;
    prem_ctr: string;
    ref_fcen: string;
    pourc_gere: string;
    surf_actes: string; 
    url_cen: string;
    validite: boolean;
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
    ref_public: boolean;

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

    localisation: Localisation;
}

export interface DetailSiteProjet {

    uuid_site: string;
    uuid_espace: string;

    nom: string;
    surface: number;

    localisation: Localisation;
}