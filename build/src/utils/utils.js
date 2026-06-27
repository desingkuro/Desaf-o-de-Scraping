import axios from "axios";
const url = process.env.BASE_URL_DEV;
export const getData = async (next) => {
    try {
        const response = await axios.get(url);
        return response.data;
    }
    catch (error) {
        console.error(error);
        next(error);
    }
};
export const getDataWithRetry = async (url, next, retry = 3, delay = 1000) => {
    try {
        const response = await axios.get(url);
        return response.data;
    }
    catch (error) {
        console.error(error);
        const retryAfter = error.response?.headers['retry-after'];
        const delayToUse = retryAfter ? parseInt(retryAfter) * 1000 : delay;
        if (retry > 0 && error.response?.status === 429) {
            await new Promise(resolve => setTimeout(resolve, delayToUse));
            return getDataWithRetry(url, next, retry - 1, delayToUse * 2);
        }
        next(error);
    }
};
