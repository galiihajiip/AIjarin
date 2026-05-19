'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { getDashboardPath } from '@/lib/auth/get-dashboard-path';
import { createClient } from '@/lib/supabase/client';

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AUTH_ERROR_MESSAGE = 'Email atau kata sandi salah. Coba lagi ya!';

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });

    if (error || !data.user) {
      toast({
        variant: 'destructive',
        title: AUTH_ERROR_MESSAGE,
      });
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      toast({
        variant: 'destructive',
        title: AUTH_ERROR_MESSAGE,
      });
      return;
    }

    router.push(getDashboardPath(profile.role as string));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nama@sekolah.id"
          aria-invalid={errors.email ? true : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <p className="text-sm text-red-400" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Kata sandi</Label>
          <Link
            href="#"
            className="text-xs text-sigma-cyan hover:underline"
            onClick={(event) => event.preventDefault()}
            aria-disabled
            title="Fitur lupa kata sandi — Phase 7"
          >
            Lupa kata sandi?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-10"
            aria-invalid={errors.password ? true : undefined}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-200"
            aria-label={
              showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="text-sm text-red-400" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-sigma-cyan font-semibold text-sigma-navy hover:bg-sigma-cyan/90"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" label="Sedang masuk..." />
            Sedang masuk...
          </>
        ) : (
          'Masuk'
        )}
      </Button>
    </form>
  );
}
