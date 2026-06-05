import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { cn } from '../../lib/utils';

export function AnalyticsCard({ title, children, className }) {
  return (
    <Card className={cn('glass-card flex flex-col', className)}>
      <CardHeader className="pb-2">
        <CardTitle className='text-xl tracking-tight'>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 relative">
        {children}
      </CardContent>
    </Card>
  );
}
