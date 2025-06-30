import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {icon}
              </div>
            </div>
          )}
          <input
            type={type}
            className={cn(
              'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors',
              icon && 'pl-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
