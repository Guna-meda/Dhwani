import * as React from 'react'

import { cn } from '@/lib/utils'

type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const buttonVariants = ({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) =>
  cn(
    'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50',
    variant === 'default' && 'bg-brand-primary text-brand-bg hover:bg-brand-accent',
    variant === 'outline' && 'border-brand-border bg-transparent text-brand-text hover:bg-brand-card',
    variant === 'secondary' && 'bg-brand-card text-brand-text hover:bg-brand-surface',
    variant === 'ghost' && 'bg-transparent text-brand-text hover:bg-brand-card',
    variant === 'destructive' && 'bg-red-500/10 text-red-200 hover:bg-red-500/20',
    variant === 'link' && 'border-transparent bg-transparent text-brand-accent underline-offset-4 hover:underline',
    size === 'default' && 'h-8 gap-1.5 px-2.5',
    size === 'xs' && 'h-6 gap-1 px-2 text-xs',
    size === 'sm' && 'h-7 gap-1 px-2.5 text-[0.8rem]',
    size === 'lg' && 'h-9 gap-1.5 px-2.5',
    size === 'icon' && 'size-8',
    size === 'icon-xs' && 'size-6 rounded-md',
    size === 'icon-sm' && 'size-7 rounded-md',
    size === 'icon-lg' && 'size-9',
    className,
  )

function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button data-slot="button" className={buttonVariants({ variant, size, className })} {...props} />
}

export { Button, buttonVariants }
