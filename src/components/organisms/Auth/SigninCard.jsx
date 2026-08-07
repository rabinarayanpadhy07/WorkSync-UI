import { LucideLoader2, TriangleAlert } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { buildGoogleAuthUrl } from '@/utils/buildGoogleAuthUrl';

export const SigninCard = ({
    signinForm,
    setSigninForm,
    onSigninFormSubmit,
    validationError,
    error,
    isSuccess,
    isPending
}) => {
    const navigate = useNavigate();

    return (
        <Card className="mx-auto w-full max-w-sm rounded-2xl border-0 shadow-xl sm:max-w-md">
            <CardHeader className="space-y-2 px-5 pt-5 text-center sm:px-6 sm:pt-6">
                <CardTitle className="text-xl font-bold sm:text-2xl">
                    Welcome back
                </CardTitle>
                <CardDescription className="text-sm leading-6 sm:text-base">
                    Sign in to continue to WorkSync
                </CardDescription>
            </CardHeader>

            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                {validationError && (
                    <div className="mb-3 flex items-start gap-2.5 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        <TriangleAlert className="mt-0.5 size-5 shrink-0" />
                        <p className="break-words">{validationError.message}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-3 flex items-start gap-2.5 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        <TriangleAlert className="mt-0.5 size-5 shrink-0" />
                        <p className="break-words">{error.message}</p>
                    </div>
                )}



                <Button
                    className="mb-4 flex h-11 w-full cursor-pointer items-center justify-center gap-2 px-4 text-sm sm:text-base disabled:cursor-not-allowed"
                    disabled={isPending}
                    onClick={() => {
                        window.location.href = buildGoogleAuthUrl();
                    }}
                    variant="outline"
                    size="lg"
                >
                    {isPending ? (
                        <LucideLoader2 className="size-5 animate-spin" />
                    ) : (
                        <>
                            <FcGoogle className="size-5 shrink-0" />
                            <span className="truncate">Continue with Google</span>
                        </>
                    )}
                </Button>

                <div className="my-4 flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground sm:text-sm">or</span>
                    <Separator className="flex-1" />
                </div>

                <form className="space-y-4" onSubmit={onSigninFormSubmit}>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Email</label>
                        <Input
                            disabled={isPending}
                            placeholder="you@example.com"
                            required
                            type="email"
                            value={signinForm.email}
                            onChange={(e) =>
                                setSigninForm({ ...signinForm, email: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Password</label>
                        <Input
                            disabled={isPending}
                            placeholder="••••••••"
                            required
                            type="password"
                            value={signinForm.password}
                            onChange={(e) =>
                                setSigninForm({ ...signinForm, password: e.target.value })
                            }
                        />
                    </div>

                    <Button
                        className="mt-2 flex h-11 w-full cursor-pointer items-center justify-center gap-2 bg-[#4B2AAD] text-sm hover:bg-[#3b2190] sm:text-base disabled:cursor-not-allowed"
                        disabled={isPending || isSuccess}
                        size="lg"
                        type="submit"
                    >
                        {isPending || isSuccess ? (
                            <>
                                <LucideLoader2 className="size-5 animate-spin" />
                                {isSuccess ? 'Redirecting...' : 'Signing in...'}
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm leading-6 text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <span
                        className="cursor-pointer text-[#4B2AAD] hover:underline"
                        onClick={() => navigate('/auth/signup')}
                    >
                        Sign up
                    </span>
                </p>
            </CardContent>
        </Card>
    );
};
