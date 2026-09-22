import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { getAdminOverviewRequest } from '@/apis/admin';
import { useAuth } from '@/hooks/context/useAuth';

export const SuperAdminRoute = ({ children }) => {
    const { auth, setAuth } = useAuth();

    const adminProbe = useQuery({
        queryKey: ['super-admin-probe', auth?.token],
        queryFn: () => getAdminOverviewRequest({ token: auth?.token }),
        enabled: !!auth?.token && !auth?.user?.isSuperAdmin,
        retry: false
    });

    useEffect(() => {
        if (!adminProbe.isSuccess || auth?.user?.isSuperAdmin) return;

        const nextUser = {
            ...auth.user,
            isSuperAdmin: true
        };

        setAuth((previous) => ({
            ...previous,
            user: nextUser
        }));
    }, [adminProbe.isSuccess, auth?.user, setAuth]);

    if (auth.isLoading) {
        return null;
    }

    if (auth?.user?.isSuperAdmin) {
        return children;
    }

    if (adminProbe.isLoading) {
        return null;
    }

    if (adminProbe.isSuccess) {
        return children;
    }

    if (!auth?.user?.isSuperAdmin) {
        return <Navigate to="/home" replace />;
    }

    return null;
};
