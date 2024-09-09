export interface MenuItem {
  name: string;
  class_color?: string;
  short?: string;
  children?: MenuItem[]; // Optionnel : sous-menu
}
