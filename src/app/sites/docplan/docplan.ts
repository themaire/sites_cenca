export interface DocPlanListe {
  uuid_doc: string;
  document: string;
  code_site: string;
  annee_deb: number;
  annee_fin: number | null;
  docactuel: string;
  typ_document: string | null;
  surface: number | null;
}
