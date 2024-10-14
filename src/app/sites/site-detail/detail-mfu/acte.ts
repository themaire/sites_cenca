export interface FicheMFUlite {
  uuid_acte: string;
  site: string;
  typ_mfu: string;
  debut: string;
  fin: string;
  tacit_rec: string;
  surface: string;
  type_prop: string;
  url: string;
  actuel: string;
}

export interface FicheMFU {
  uuid_acte: string;
  site: string;
  typ_mfu: string;
  typ_mfu_lib: string;
  validite: boolean;
  debut: string;
  fin: string;
  tacit_rec: boolean;
  detail_rec: string;
  remarque: string;
  notaire: string;
  cout: string;
  date_crea: Date;
  date_modif: Date;
  actuel: boolean;
  // surface: string;
  // type_prop: string;
  // url: string;
  // actuel: string;
}
