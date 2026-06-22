import React from 'react';
import { cn } from '../../lib/utils';

export const StatCard = React.memo(function StatCard({ title, value, icon: Icon, description, trend, trendColor, className, colorClass }) {
  return (
    <div className={cn('glass-card group p-4 flex flex-col gap-2', className)}>
      {/* Header Row */}
      <div className='flex items-center justify-between'>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 shrink-0', colorClass || 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/20')}>
          <Icon className='w-5 h-5' />
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
});
