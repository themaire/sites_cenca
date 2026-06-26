// Liste des documents planificateurs d'un site (vue docplan.docplanifsites)
export interface DocPlan {
    uuid_doc: string;
    document: string;
    annee_deb: number;
    annee_fin: number | null;
    docactuel: string;
    url: string | null;
    surface: number | null;
}

// Détail complet d'un document planificateur (table docplan.documents)
export interface DocPlanDetail {
    uuid_doc: string;
    nom: string;
    surface: number | null;
    annee_deb: number;
    annee_fin: number | null;
    validite: boolean;
    url: string | null;
    site: string | null;
    entite_coherente: string | null;
    typ_document: string | null;
    actuel: string | null;
    evaluation: number | null;
}

// Unité de gestion liée à un document planificateur (table docplan.unites_gestion)
export interface UniteGestion {
    uuid_ug: string;
    code: string | null;
    nom: string | null;
    surface: number | null;
    document: string;
}

// Entité cohérente de gestion (vue docplan.listecg)
export interface EntiteCoherente {
    uuid_ecg: string;
    nom_ecg: string;
    nom: string | null; // sites associés concaténés
}
