import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LucideLoader2 } from 'lucide-react';

import { googleAuthExchangeRequest } from '@/apis/auth';
import { useAuth } from '@/hooks/context/useAuth';

export const GoogleAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const { setAuth } = useAuth();
    const navigate = useNavigate();
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            toast.error('Failed to sign in with Google', {
                description: 'Please try again.'
            });
            navigate('/auth/signin', { replace: true });
            return;
        }

        if (!code) {
            console.error('No authentication code found in URL');
            navigate('/auth/signin', { replace: true });
            return;
        }

        (async () => {
            try {
                const response = await googleAuthExchangeRequest({ code });

                setAuth({
                    token: response.data.token,
                    user: response.data,
                    isLoading: false
                });

                toast.success('Successfully signed in', {
                    description: 'Welcome back!'
                });

                setTimeout(() => {
                    navigate('/home', { replace: true });
                }, 1000);
            } catch (fetchError) {
                console.error('Error exchanging Google auth code', fetchError);
                toast.error('Failed to sign in', {
                    description: 'Something went wrong with Google authentication.'
                });
                navigate('/auth/signin', { replace: true });
            }
        })();
    }, [searchParams, navigate, setAuth]);

    return (
        <div className="h-[100vh] flex items-center justify-center bg-slack">
            <div className="md:h-auto md:w-[420px] bg-white p-8 rounded-lg shadow-md flex flex-col items-center gap-y-4">
                <LucideLoader2 className="size-10 animate-spin text-slack-primary" />
                <p className="text-lg font-semibold">Completing authentication...</p>
                <p className="text-muted-foreground text-sm">Please wait while we set up your session.</p>
            </div>
        </div>
    );
};
