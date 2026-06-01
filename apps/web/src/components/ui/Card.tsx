'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

type CardVariant = 'default' | 'glass' | 'elevated' | 'interactive';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant;
  padding?: CardPadding;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface border border-border',
  glass: 'glass border border-border',
  elevated: 'bg-surface border border-border shadow-lg',
  interactive: 'bg-surface border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', header, footer, children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          'rounded-2xl overflow-hidden',
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {header && (
          <div className="flex items-center justify-between mb-4">
            {header}
          </div>
        )}
        {children}
        {footer && (
          <div className="mt-4 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function CardHeader({ title, description, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text-primary">{title}</h3>
        {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
