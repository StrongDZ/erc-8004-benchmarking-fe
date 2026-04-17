import React from 'react';

export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`card-header ${className}`} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...props.style }} {...props} />;
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`card-title ${className}`} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8, ...props.style }} {...props} />;
}

export function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`card-content ${className}`} {...props} />;
}
