import { NextFunction } from "express";

export type TypeDataWithRetry = {
    url: string;
    data?: any;
    headers?: any;
    retry?: number;
    delay?: number;
    next?: NextFunction;
    responseType?: 'arraybuffer' | 'json' | 'text';
};

export type TypeArgumentPostBtn = {
    viewState: string | string[] ;
    jsessionid: string;
    next: NextFunction;
    pageIndex: number;
};

export type TypeParserXmlArg = {
    xml: string;
    jsessionid: string;
    next: NextFunction;
    index:number;
};

export type TypeDownloadPdfArg = {
    jsessionid: string;
    viewState: string;
    paramUuid: string;
    botonId: string;
    outputPath: string;
    next: NextFunction;
};

export type GetParamsType = {
    type: TypePostBtn;
    pageIndex: number;
    viewState?: string | string[];
}

export type TypePostBtn = 'postBtn' | 'pagination'