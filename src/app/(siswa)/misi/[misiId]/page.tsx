import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { MissionPlayer } from '@/components/missions/MissionPlayer';
import { Button } from '@/components/ui/button';
import { fetchMissionForPlayer } from '@/lib/missions/fetch-mission-player';
import { createClient } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{ misiId: string }>;
};

export default async function MisiPlayerPage({ params }: PageProps) {
  const { misiId } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const data = await fetchMissionForPlayer(misiId);

  if (!data) {
    const { data: misiExists } = await supabase
      .from('misi')
      .select('id')
      .eq('id', misiId)
      .maybeSingle();

    if (!misiExists) {
      notFound();
    }

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-xl font-bold text-white">Misi Terkunci</h1>
        <p className="max-w-md text-sm text-slate-400">
          Selesaikan misi sebelumnya dulu ya, Agen. Setiap level SIGMA punya
          urutan yang harus kamu ikuti.
        </p>
        <Button asChild variant="outline" className="border-slate-600">
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </div>
    );
  }

  return <MissionPlayer {...data} />;
}
