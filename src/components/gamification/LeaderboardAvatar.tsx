import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type LeaderboardAvatarProps = {
  nama: string;
  avatarUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
} as const;

function getInitials(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function LeaderboardAvatar({
  nama,
  avatarUrl,
  size = 'md',
  className,
}: LeaderboardAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt="" />
      ) : (
        <AvatarImage src={undefined} alt="" />
      )}
      <AvatarFallback className="bg-slate-700 font-semibold text-sigma-cyan">
        {getInitials(nama)}
      </AvatarFallback>
    </Avatar>
  );
}
