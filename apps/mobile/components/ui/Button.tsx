import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 text-white active:bg-primary-400',
  secondary: 'bg-surface border border-border text-text-primary active:bg-background-hover',
  ghost: 'text-text-secondary active:text-text-primary active:bg-surface-hover',
  danger: 'bg-destructive-500 text-white active:bg-destructive-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-6 py-3 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  children,
  className,
  leftIcon,
  rightIcon,
  fullWidth = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={clsx(
        'flex-row items-center justify-center gap-2 font-medium',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50',
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#fff' : '#6366F1'} />
      ) : leftIcon ? (
        <View className="mr-1">{leftIcon}</View>
      ) : null}
      <Text className={clsx(
        'font-medium',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-base',
        variant === 'primary' && 'text-white',
        variant === 'secondary' && 'text-text-primary',
        variant === 'ghost' && 'text-text-secondary',
        variant === 'danger' && 'text-white',
      )}>
        {children}
      </Text>
      {!loading && rightIcon && <View className="ml-1">{rightIcon}</View>}
    </TouchableOpacity>
  );
}
