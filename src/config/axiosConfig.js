import axios from 'axios';

import { reportClientError } from '@/lib/monitoring';
import { BACKEND_API_URL } from './runtimeConfig';

// The access token now lives only in memory (set by AuthContext), never in
// localStorage — this keeps it out of reach of anything that can read
// localStorage after the fact (e.g. a persisted XSS payload).
let currentAccessToken = null;

export const setAccessToken = (token) => {
    currentAccessToken = token || null;
};

const axiosInstance = axios.create({
    baseURL: BACKEND_API_URL,
    timeout: 10000,
    // Required so the HttpOnly refresh-session cookie is sent to /users/refresh
    // and /users/logout.
    withCredentials: true
});

axiosInstance.interceptors.request.use((config) => {
    if (currentAccessToken && !config.headers?.['x-access-token']) {
        config.headers = {
            ...config.headers,
            'x-access-token': currentAccessToken
        };
    }

    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        reportClientError(error, {
            source: 'axios.response',
            url: error?.config?.url,
            method: error?.config?.method,
            status: error?.response?.status
        });

        return Promise.reject(error);
    }
);

export default axiosInstance;
