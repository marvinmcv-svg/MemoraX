import React from 'react';
import { View, Text } from 'react-native';
import { clsx } from 'clsx';

type CardVariant = 'default' | 'elevated' | 'interactive';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

export function Card({ variant = 'default', children, className }: CardProps) {
  return (
    <View
      className={clsx(
        'rounded-2xl overflow-hidden',
        variant === 'default' && 'bg-surface border border-border',
        variant === 'elevated' && 'bg-surface border border-border shadow-lg',
        variant === 'interactive' && 'bg-surface border border-border active:border-primary-500/30',
        className
      )}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, icon, action }: CardHeaderProps) {
  return (
    <View className="flex-row items-start justify-between mb-3">
      <View className="flex-row items-center gap-3 flex-1">
        {icon && (
          <View className="w-10 h-10 rounded-xl bg-primary-500/10 items-center justify-center">
            {icon}
          </View>
        )}
        <View className="flex-1">
          <Text className="font-semibold text-text-primary">{title}</Text>
          {description && <Text className="text-sm text-text-muted mt-0.5">{description}</Text>}
        </View>
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}
