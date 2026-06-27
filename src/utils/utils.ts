import axios from "axios";
import { NextFunction } from "express";

const url: string = process.env.BASE_URL_DEV!;

export const getData = async (next:NextFunction):Promise<any> => {
  try {
    return await axios.get(url);
  } catch (error: any) {
    console.error(error);
    next(error);
    return null;
  }
};

export const getDataWithRetry = async (url:string, next:NextFunction, retry = 3, delay = 1000):Promise<any> => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {  
    console.error(error);
    const retryAfter = error.response?.headers['retry-after'];
    const delayToUse = retryAfter ? parseInt(retryAfter) * 1000 : delay;
    if (retry > 0 && error.response?.status === 429) {
      await new Promise(resolve => setTimeout(resolve, delayToUse));
      return getDataWithRetry(url, next, retry - 1, delayToUse * 2);
    }
    next(error);
    return null;
  }
}
