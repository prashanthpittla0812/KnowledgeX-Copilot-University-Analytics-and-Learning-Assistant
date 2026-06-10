import React from 'react';
import { cn } from '../../lib/utils';

export function AnalyticsCard({ title, children, className, action }) {
  return (
    <div className={cn('glass-card flex flex-col', className)}>
      {/* Card Header */}
      <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/60'>
        <h3 className='text-[1.05rem] font-bold tracking-tight text-foreground'>{title}</h3>
        {action && <div className='shrink-0'>{action}</div>}
      </div>
      {/* Card Content */}
      <div className='flex-1 p-6 min-h-0 relative'>
        {children}
      </div>
    </div>
  );
}
