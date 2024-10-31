// Ceci est un fichier d'interfaces

export interface ApiResponse {
    success: boolean;
    message: string;
    code: number;
    data: any[];
  }