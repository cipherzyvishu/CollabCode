import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          
          // Variants
          {
            'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500': variant === 'secondary',
            'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500': variant === 'outline',
            'text-gray-700 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
          },
          
          // Sizes
          {
            'px-3 py-1.5 text-sm rounded-md': size === 'sm',
            'px-4 py-2 text-sm rounded-md': size === 'md',
            'px-6 py-3 text-base rounded-lg': size === 'lg',
          },
          
          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
