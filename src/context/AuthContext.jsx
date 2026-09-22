import { createContext, useCallback, useEffect, useRef, useState } from 'react';

import axiosInstance, { setAccessToken } from '@/config/axiosConfig';

const AuthContext = createContext();

// Access tokens are short-lived (15m server-side); refresh well before that
// using the HttpOnly refresh-session cookie so the user stays signed in
// without ever storing the access token in localStorage.
const SILENT_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export const AuthContextProvider = ({ children }) => {

    const [auth, setAuth] = useState({
        user: null,
        token: null,
        isLoading: true
    });
    const refreshTimerRef = useRef(null);

    useEffect(() => {
        setAccessToken(auth.token);
    }, [auth.token]);

    const refreshSession = useCallback(async () => {
        try {
            const response = await axiosInstance.post('/users/refresh');
            const data = response?.data?.data;

            if (data?.token) {
                setAuth({ token: data.token, user: data, isLoading: false });
                return true;
            }
        } catch {
            // No valid refresh session (never logged in, expired, or revoked).
        }

        setAuth({ user: null, token: null, isLoading: false });
        return false;
    }, []);

    // Silently restore the session on first load using the refresh cookie
    // instead of reading a token back out of localStorage.
    useEffect(() => {
        refreshSession();
    }, [refreshSession]);

    useEffect(() => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        if (!auth.user) {
            return undefined;
        }

        refreshTimerRef.current = setInterval(refreshSession, SILENT_REFRESH_INTERVAL_MS);
        return () => clearInterval(refreshTimerRef.current);
    }, [auth.user, refreshSession]);

    async function logout() {
        try {
            await axiosInstance.post('/users/logout');
        } catch {
            // Clear local state regardless of network failure.
        }
        setAuth({
            user: null,
            token: null,
            isLoading: false
        });
    }

    return (
        <AuthContext.Provider value={{ auth, setAuth, logout, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
