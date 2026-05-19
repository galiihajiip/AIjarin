'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ComponentProps } from 'react';

import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

type LogoutButtonProps = {
  className?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
};

export function LogoutButton({
  className,
  variant = 'outline',
  size = 'default',
}: LogoutButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      useAuthStore.getState().reset();
      setOpen(false);
      router.push('/login');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        onClick={() => setOpen(true)}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Keluar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keluar dari Markas?</DialogTitle>
            <DialogDescription className="text-slate-400">
              Yakin mau keluar, Agen? Jangan lupa balik lagi ya!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isLoggingOut}
              onClick={() => setOpen(false)}
              className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
              className="bg-sigma-cyan font-semibold text-sigma-navy hover:bg-sigma-cyan/90"
            >
              {isLoggingOut ? (
                <>
                  <LoadingSpinner size="sm" label="Keluar..." />
                  Keluar...
                </>
              ) : (
                'Ya, Keluar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
