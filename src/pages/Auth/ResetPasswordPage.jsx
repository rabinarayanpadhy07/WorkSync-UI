import { CheckCircle2, KeyRoundIcon, ShieldCheckIcon, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useResetPassword } from '@/hooks/apis/auth/useResetPassword';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [form, setForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState('');
  const { resetPasswordMutation, isPending, isSuccess, error } = useResetPassword();
  const passwordChecks = [
    {
      label: 'At least 8 characters',
      passed: form.password.length >= 8
    },
    {
      label: 'Contains a letter',
      passed: /[A-Za-z]/.test(form.password)
    },
    {
      label: 'Contains a number',
      passed: /\d/.test(form.password)
    }
  ];

  useEffect(() => {
    if (!isSuccess) {
      return undefined;
    }

    const timeout = globalThis.setTimeout(() => {
      navigate('/auth/signin', { replace: true });
    }, 1500);

    return () => globalThis.clearTimeout(timeout);
  }, [isSuccess, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setLocalError('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (!form.password || !form.confirmPassword) {
      setLocalError('Please fill both password fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLocalError('');
    await resetPasswordMutation({
      token,
      password: form.password
    });
  };

  return (
    <Card className="w-full overflow-hidden border-white/50 shadow-[0_20px_60px_-30px_rgba(97,31,105,0.45)]">
      <CardHeader>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f4e8f7] px-3 py-1 text-xs font-medium text-[#611f69]">
          <KeyRoundIcon className="size-3.5" />
          Secure reset
        </div>
        <CardTitle className="mt-3">Reset password</CardTitle>
        <CardDescription>
          Choose a new password for your SlackApp account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {(localError || error) ? (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <TriangleAlert className="size-4" />
              <p>{localError || getApiErrorMessage(error)}</p>
            </div>
          ) : null}

          {isSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-500/10 p-4 text-sm text-emerald-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Password updated</p>
                  <p className="mt-1">Your password has been changed successfully. Redirecting you to sign in...</p>
                </div>
              </div>
            </div>
          ) : null}

          <Input
            type="password"
            placeholder="New password"
            value={form.password}
            disabled={isPending}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            disabled={isPending}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                confirmPassword: event.target.value
              }))
            }
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Updating...' : 'Reset password'}
          </Button>
        </form>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <ShieldCheckIcon className="size-4 text-[#611f69]" />
            Password requirements
          </div>
          <ul className="mt-2 space-y-1.5">
            {passwordChecks.map((check) => (
              <li
                key={check.label}
                className={check.passed ? 'text-emerald-700' : 'text-slate-500'}
              >
                {check.passed ? 'Passed' : 'Needed'}: {check.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link className="cursor-pointer text-sky-600 hover:underline" to="/auth/signin">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};
