'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type ClassSummaryMetric = {
  id:
    | 'active_students'
    | 'average_xp'
    | 'average_ngain'
    | 'unfinished_missions';
  title: string;
  value: number;
  previousValue: number;
  description: string;
  format?: 'integer' | 'decimal';
  trendDirection?: 'higher-is-better' | 'lower-is-better';
};

type ClassSummaryCardsProps = {
  metrics: ClassSummaryMetric[];
};

const ICONS = {
  active_students: Users,
  average_xp: TrendingUp,
  average_ngain: BarChart3,
  unfinished_missions: AlertTriangle,
} satisfies Record<ClassSummaryMetric['id'], typeof Users>;

const TONES = {
  active_students: 'bg-sigma-cyan/15 text-sigma-cyan',
  average_xp: 'bg-sigma-gold/15 text-sigma-gold',
  average_ngain: 'bg-violet-400/15 text-violet-300',
  unfinished_missions: 'bg-rose-400/15 text-rose-300',
} satisfies Record<ClassSummaryMetric['id'], string>;

function formatValue(value: number, format: ClassSummaryMetric['format']) {
  if (format === 'decimal') {
    return value.toFixed(2);
  }

  return Math.round(value).toLocaleString('id-ID');
}

function useCountUp(value: number) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const durationMs = 850;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return displayValue;
}

function getTrend(metric: ClassSummaryMetric) {
  const delta = metric.value - metric.previousValue;
  const isFlat = Math.abs(delta) < 0.01;
  const direction = metric.trendDirection ?? 'higher-is-better';
  const positive = direction === 'higher-is-better' ? delta > 0 : delta < 0;

  if (isFlat) {
    return {
      icon: ArrowRight,
      label: 'Stabil vs minggu lalu',
      className: 'border-slate-700 bg-slate-800/80 text-slate-300',
    };
  }

  return {
    icon: delta > 0 ? ArrowUpRight : ArrowDownRight,
    label: `${delta > 0 ? '+' : ''}${formatValue(delta, metric.format)} vs minggu lalu`,
    className: positive
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
      : 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  };
}

function SummaryMetricCard({ metric }: { metric: ClassSummaryMetric }) {
  const Icon = ICONS[metric.id];
  const animatedValue = useCountUp(metric.value);
  const trend = getTrend(metric);
  const TrendIcon = trend.icon;

  return (
    <Card className="overflow-hidden border-slate-700 bg-slate-900/70 text-white">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-sm font-medium text-slate-300">
          {metric.title}
        </CardTitle>
        <div className={cn('rounded-xl p-2', TONES[metric.id])}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">
          {formatValue(animatedValue, metric.format)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {metric.description}
        </p>
        <div
          className={cn(
            'mt-4 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
            trend.className
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" aria-hidden />
          {trend.label}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClassSummaryCards({ metrics }: ClassSummaryCardsProps) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <SummaryMetricCard key={metric.id} metric={metric} />
      ))}
    </section>
  );
}
