import React from 'react';
import { cn } from '../../lib/utils';

export function StatCard({ title, value, icon: Icon, description, trend, trendColor, className }) {
  return (
    <div className={cn('glass-card group p-6 flex flex-col gap-4', className)}>
      {/* Header Row */}
      <div className='flex items-center justify-between'>
        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20 transition-transform duration-300 group-hover:scale-110 shrink-0'>
          <Icon className='w-6 h-6' />
        </div>
        {trend && (
          <span className={cn('text-sm font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100', trendColor || 'text-muted-foreground')}>
            {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className='text-[2.4rem] font-black text-foreground tracking-tight leading-none'>{value}</p>
        <p className='text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide'>{title}</p>
      </div>

      {/* Description */}
      {description && (
        <p className={cn('text-sm font-medium border-t border-border/50 pt-3', trendColor || 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </div>
  );
}
