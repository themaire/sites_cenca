export interface Parcelle {
    uuid_parcelle: string;
    insee: string;
    prefix: string;
    section: string;
    numero: number;
    partie: string;
    surface: number;
    validite: boolean;
    acte_mfu: string;
    remarque: string;
    pour_partie: boolean;
    typ_proprietaire: string;
    proprietaire: string;
    code_parcelle: string;
    libelle_court: string;
    libelle: string;
}
    