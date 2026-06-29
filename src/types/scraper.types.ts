export type Fila = {
  nResolution: string;
  params: LinkParamsType | null;
};

export type PageResult = {
  nuevoViewState: string;
  totalPages: number;
  filas: Fila[];
};

export type LinkParamsType = Record<string, string>;

export type ScraperResult = {
  success: boolean;
  filasProcesadas: number;
  pdfsDescargados: number;
};
