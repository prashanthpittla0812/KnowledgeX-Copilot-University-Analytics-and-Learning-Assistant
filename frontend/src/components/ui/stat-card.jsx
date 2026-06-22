import React from 'react';
import { cn } from '../../lib/utils';

export function StatCard({ title, value, icon: Icon, description, trend, trendColor, className, colorClass, ringClass }) {
  return (
    <div className={cn('glass-card group p-4 flex flex-col gap-2', className)}>
      {/* Header Row */}
      <div className='flex items-center justify-between'>
        <div className={cn('relative flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-all duration-300 group-hover:scale-110 shrink-0 ring-4 border-2 border-white/50', ringClass || 'ring-orange-50', colorClass || 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-orange-500/30')}>
          <div className="absolute inset-0 rounded-2xl bg-white/10 mix-blend-overlay"></div>
          <Icon className='w-5 h-5 relative z-10 drop-shadow-sm' strokeWidth={2.5} />
        </div>
        {trend && (
          <span className={cn('text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100', trendColor || 'text-muted-foreground')}>
            {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mt-1">
        <p className='text-2xl font-black text-foreground tracking-tight leading-none'>{value}</p>
        <p className='text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider'>{title}</p>
      </div>

      {/* Description */}
      {description && (
        <p className={cn('text-xs font-semibold border-t border-border/50 pt-2', trendColor || 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </div>
  );
}
