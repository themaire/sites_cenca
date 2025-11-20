export interface Salaries {
    cd_salarie: string;
    nom_complet: string;
    email: string;
    fonction: string;
    identifiant: string;
}

export interface Salarie {
    cd_salarie: string;
    nom: string;
    prenom: string;
    email: string;
    statut: boolean;
    typ_fonction: string;
    identifiant: string;
    sal_role: string;
    date_embauche?: string;
    date_depart?: string;
}

export interface Groupes {
    gro_id: string;
    gro_nom: string;
    gro_description: string;
}

export interface Groupe {
    gro_id: string;
    gro_nom: string;
    gro_description: string;
    gro_statut: boolean;
}