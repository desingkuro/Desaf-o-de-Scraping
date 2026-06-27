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
};

export type TypeParserXmlArg = {
    xml: string;
    jsessionid: string;
};
