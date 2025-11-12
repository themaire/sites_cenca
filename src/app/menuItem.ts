export interface MenuItem {
  id?: number;
  name: string;
  class_color?: string;
  parent?: number;
  parent_name?: string;
  route?: string;
  short?: string;
  url?: string;
  description?: string;
  picture?: string;
  accueil?: boolean;
  date_added?: Date;
  opened?: boolean;
  children?: MenuItem[]; // Optionnel : sous-menu
}
