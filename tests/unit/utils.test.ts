import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
  });

  it('resolves conflicting Tailwind utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
