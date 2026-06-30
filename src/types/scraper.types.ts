export type LinkParamsType = Record<string, string>;

export type Fila = {
  recurso: string;
  nResolution: string;
  pdfUrl: string | null;
  detail: Record<string, string>;
  params: LinkParamsType | null;
};

export type PageResult = {
  nuevoViewState: string;
  totalPages: number;
  filas: Fila[];
};

export type ScraperResult = {
  success: boolean;
  filasProcesadas: number;
  pdfsDescargados: number;
};
