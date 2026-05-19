'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { generateSiswaEmailFromNisn } from '@/lib/auth/generate-siswa-email';
import { getDashboardPath } from '@/lib/auth/get-dashboard-path';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

const KELAS_OPTIONS = ['X', 'XI', 'XII'] as const;

const registerSchema = z
  .object({
    nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
    nisn: z
      .string()
      .min(1, 'NISN wajib diisi')
      .regex(/^\d{10}$/, 'NISN harus 10 digit angka'),
    email: z.string(),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
    kelas: z.enum(KELAS_OPTIONS, {
      message: 'Kelas wajib dipilih',
    }),
    kode_sekolah: z.string().min(1, 'Kode sekolah wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      const trimmed = data.email.trim();
      if (trimmed === '') return true;
      return z.email().safeParse(trimmed).success;
    },
    { message: 'Email tidak valid', path: ['email'] }
  );

type RegisterFormValues = z.infer<typeof registerSchema>;

const SUCCESS_MESSAGE =
  'Akun kamu berhasil dibuat! Selamat datang di SIGMA, Agen baru! 🎉';

const selectClassName =
  'flex h-10 w-full rounded-md border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigma-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50';

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nama_lengkap: '',
      nisn: '',
      email: '',
      password: '',
      confirmPassword: '',
      kelas: undefined,
      kode_sekolah: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    const email =
      values.email.trim() === ''
        ? generateSiswaEmailFromNisn(values.nisn)
        : values.email.trim();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: values.password,
      options: {
        data: {
          nama_lengkap: values.nama_lengkap.trim(),
          role: UserRole.Siswa,
        },
      },
    });

    if (signUpError || !authData.user) {
      toast({
        variant: 'destructive',
        title:
          signUpError?.message === 'User already registered'
            ? 'Email atau NISN sudah terdaftar. Coba masuk ya!'
            : 'Pendaftaran gagal. Periksa data kamu dan coba lagi.',
      });
      return;
    }

    if (!authData.session) {
      toast({
        title: SUCCESS_MESSAGE,
        description:
          'Cek email kamu untuk konfirmasi akun, lalu masuk ke Markas SIGMA.',
      });
      router.push('/login');
      return;
    }

    const { data: sekolah, error: sekolahError } = await supabase
      .from('sekolah')
      .select('id')
      .eq('npsn', values.kode_sekolah.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (sekolahError || !sekolah) {
      await supabase.auth.signOut();
      toast({
        variant: 'destructive',
        title: 'Kode sekolah tidak ditemukan. Pastikan NPSN benar ya!',
      });
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        sekolah_id: sekolah.id,
        kelas: values.kelas,
        nisn: values.nisn,
        nama_lengkap: values.nama_lengkap.trim(),
      })
      .eq('id', authData.user.id);

    if (profileError) {
      await supabase.auth.signOut();
      toast({
        variant: 'destructive',
        title:
          profileError.code === '23505'
            ? 'NISN sudah terdaftar. Hubungi guru jika ini akunmu.'
            : 'Gagal menyimpan profil. Coba lagi ya!',
      });
      return;
    }

    const { error: statsError } = await supabase.from('siswa_stats').insert({
      siswa_id: authData.user.id,
    });

    if (statsError && statsError.code !== '23505') {
      await supabase.auth.signOut();
      toast({
        variant: 'destructive',
        title: 'Gagal menginisialisasi statistik siswa. Coba lagi ya!',
      });
      return;
    }

    toast({ title: SUCCESS_MESSAGE });
    router.push(getDashboardPath(UserRole.Siswa));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nama_lengkap">Nama lengkap</Label>
        <Input
          id="nama_lengkap"
          autoComplete="name"
          placeholder="Nama lengkap kamu"
          aria-invalid={errors.nama_lengkap ? true : undefined}
          {...register('nama_lengkap')}
        />
        {errors.nama_lengkap ? (
          <p className="text-sm text-red-400" role="alert">
            {errors.nama_lengkap.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nisn">NISN</Label>
        <Input
          id="nisn"
          inputMode="numeric"
          autoComplete="off"
          placeholder="10 digit NISN"
          maxLength={10}
          aria-invalid={errors.nisn ? true : undefined}
          {...register('nisn')}
        />
        {errors.nisn ? (
          <p className="text-sm text-red-400" role="alert">
            {errors.nisn.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Kosongkan untuk generate dari NISN"
          aria-invalid={errors.email ? true : undefined}
          {...register('email')}
        />
        <p className="text-xs text-slate-500">
          Kosongkan untuk email otomatis: NISN@siswa.aijarin.id
        </p>
        {errors.email ? (
          <p className="text-sm text-red-400" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="kelas">Kelas</Label>
        <select
          id="kelas"
          className={cn(
            selectClassName,
            errors.kelas && 'border-red-500 focus-visible:ring-red-500'
          )}
          aria-invalid={errors.kelas ? true : undefined}
          defaultValue=""
          {...register('kelas')}
        >
          <option value="" disabled>
            Pilih kelas
          </option>
          {KELAS_OPTIONS.map((kelas) => (
            <option key={kelas} value={kelas}>
              {kelas}
            </option>
          ))}
        </select>
        {errors.kelas ? (
          <p className="text-sm text-red-400" role="alert">
            {errors.kelas.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="kode_sekolah">Kode sekolah</Label>
        <Input
          id="kode_sekolah"
          autoComplete="off"
          placeholder="NPSN sekolah (contoh: 20532118)"
          aria-invalid={errors.kode_sekolah ? true : undefined}
          {...register('kode_sekolah')}
        />
        {errors.kode_sekolah ? (
          <p className="text-sm text-red-400" role="alert">
            {errors.kode_sekolah.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Kata sandi</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi kata sandi</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Ulangi kata sandi"
            className="pr-10"
            aria-invalid={errors.confirmPassword ? true : undefined}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-200"
            aria-label={
              showConfirmPassword
                ? 'Sembunyikan konfirmasi kata sandi'
                : 'Tampilkan konfirmasi kata sandi'
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {errors.confirmPassword ? (
          <p className="text-sm text-red-400" role="alert">
            {errors.confirmPassword.message}
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
            <LoadingSpinner size="sm" label="Mendaftar..." />
            Mendaftar...
          </>
        ) : (
          'Daftar sebagai Agen SIGMA'
        )}
      </Button>
    </form>
  );
}
