import { cn } from '@/lib/utils';

type SigmaLogoProps = {
  className?: string;
  size?: number;
};

/** Mark SIGMA — shield + node (inline SVG, tanpa asset eksternal). */
export function SigmaLogo({ className, size = 48 }: SigmaLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="sigma-shield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        fill="url(#sigma-shield)"
        d="M32 4 8 14v18c0 14.5 10.2 28.1 24 28 13.8-.1 24-13.5 24-28V14L32 4Z"
        opacity={0.95}
      />
      <path
        fill="#0f172a"
        d="M32 12 16 19v12c0 9.8 6.8 18.8 16 19.3 9.2-.5 16-9.5 16-19.3V19l-16-7Z"
      />
      <circle cx="32" cy="28" r="6" fill="#06b6d4" />
      <path
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        d="M32 34v8M26 30l-4 4M38 30l4 4"
      />
    </svg>
  );
}
