/** Short celebratory chime when a badge is earned (Web Audio — no asset file). */
export function playBadgeEarnedSound(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioCtx) {
      return;
    }

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    oscillator.start(now);
    oscillator.stop(now + 0.5);

    oscillator.onended = () => {
      void ctx.close();
    };
  } catch {
    // Audio blocked or unsupported — fail silently
  }
}
