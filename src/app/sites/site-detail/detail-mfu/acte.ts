export interface ActeLite {
    nom: string;
    uuid_acte: string;
    debut: Date;
    fin: Date;
    tacit_rec: string;
    surf_totale: string;
    type_prop: string;
    typ_mfu: string;
    site: string;
    url: string;
    actuel: string;
    validite: string;
}

export interface Acte {
    uuid_acte: string;
    debut: Date;
    fin: Date;
    tacit_rec: string;
    detail_rec: string;
    notaire: string;
    cout: string;
    remarque:string; 
    validite:boolean; 
    date_crea:string; 
    date_modif:string;
    typ_mfu: string;
    site: string;
    url: string;
    actuel:boolean;
}

