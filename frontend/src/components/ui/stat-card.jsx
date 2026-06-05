import React from 'react';
import { Card, CardContent } from './card';

export function StatCard({ title, value, icon: Icon, description, trend, trendColor }) {
  return (
    <Card className='glass-card'>
      <CardContent className='p-6'>
        <div className='flex items-center gap-4 mb-4'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm'>
            <Icon className='w-6 h-6' />
          </div>
          <h3 className='font-bold text-muted-foreground'>{title}</h3>
        </div>
        <p className='text-4xl font-black text-foreground tracking-tight'>{value}</p>
        {(description || trend) && (
          <p className={`text-sm font-medium mt-3 ${trendColor || 'text-muted-foreground'}`}>
            {trend && <span className="mr-1">{trend}</span>}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
