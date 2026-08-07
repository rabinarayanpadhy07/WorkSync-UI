import { LucideLoader2, TriangleAlert } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { buildGoogleAuthUrl } from '@/utils/buildGoogleAuthUrl';

export const SignupCard = ({
    signupForm,
    setSignupForm,
    validationError,
    onSignupFormSubmit,
    error,
    isPending,
    isSuccess
}) => {

    const navigate = useNavigate();

    return (
        <Card className="mx-auto w-full max-w-sm rounded-2xl shadow-xl sm:max-w-md">
            <CardHeader className="text-center space-y-2">
                <CardTitle className="text-xl sm:text-2xl font-bold">
                    Create your account
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                    Join thousands of teams on WorkSync
                </CardDescription>

                {validationError && (
                    <div className='bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive'>
                        <TriangleAlert className='size-5' />
                        <p>{validationError.message}</p>
                    </div>
                )}

                {error && (
                    <div className='bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive'>
                        <TriangleAlert className='size-5' />
                        <p>{error.message}</p>
                    </div>
                )}


            </CardHeader>

            <CardContent>
                {/* Google Button */}
                <Button
                    className="relative mb-4 w-full cursor-pointer disabled:cursor-not-allowed"
                    disabled={isPending}
                    onClick={() => {
                        window.location.href = buildGoogleAuthUrl();
                    }}
                    variant="outline"
                    size="lg"
                >
                    <FcGoogle className="size-5 absolute left-3" />
                    Continue with Google
                </Button>

                <div className="flex items-center gap-2 my-4">
                    <Separator className="flex-1" />
                    <span className="text-sm text-muted-foreground">or</span>
                    <Separator className="flex-1" />
                </div>

                {/* Form */}
                <form className='space-y-3' onSubmit={onSignupFormSubmit}>
                    <Input
                        placeholder="Username"
                        required
                        value={signupForm.username}
                        onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                        disabled={isPending}
                    />

                    <Input
                        placeholder="Email"
                        required
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        disabled={isPending}
                    />

                    <Input
                        placeholder="Password"
                        required
                        type="password"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        disabled={isPending}
                    />

                    <Input
                        placeholder="Confirm Password"
                        required
                        type="password"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        disabled={isPending}
                    />

                    <Button
                        disabled={isPending || isSuccess}
                        size="lg"
                        type="submit"
                        className="mt-2 w-full flex items-center justify-center gap-2 cursor-pointer bg-[#4d1baa] hover:bg-[#4d1baa] disabled:cursor-not-allowed"
                    >
                        {isPending || isSuccess ? (
                            <>
                                <LucideLoader2 className="size-5 animate-spin" />
                                {isSuccess ? 'Redirecting...' : 'Creating Account...'}
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </Button>
                </form>

                {/* Sign in */}
                <p className='text-sm text-muted-foreground mt-4 text-center'>
                    Already have an account?{' '}
                    <span
                        className='text-[#4d1baa] hover:underline cursor-pointer'
                        onClick={() => navigate('/auth/signin')}
                    >
                        Sign in
                    </span>
                </p>
            </CardContent>
        </Card>
    );
};
