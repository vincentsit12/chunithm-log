import classNames from 'classnames'
import { ButtonHTMLAttributes, forwardRef, useId } from 'react'
import { Tooltip, type PlacesType, type VariantType } from 'react-tooltip'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'violet'
  size?: 'md' | 'sm' | 'icon' | 'icon-sm'
  tooltip?: string
  tooltipPlace?: PlacesType
  tooltipVariant?: VariantType
  tooltipOpenOnClick?: boolean
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-fuchsia-500',
  secondary: 'bg-white/10 text-slate-100 ring-1 ring-white/10 shadow-sm shadow-black/10 hover:bg-white/20 hover:text-white hover:ring-white/20 hover:shadow-lg hover:shadow-black/20',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/10',
  danger: 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700',
  warning: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-400',
  violet: 'bg-violet-600 text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'min-h-[2.75rem] min-w-[9rem] rounded-2xl px-5 py-3 text-sm',
  sm: 'min-h-[2.25rem] min-w-[7rem] rounded-xl px-4 py-2 text-sm',
  icon: 'h-11 w-11 min-h-0 min-w-0 rounded-2xl p-0',
  'icon-sm': 'h-8 w-8 min-h-0 min-w-0 rounded-xl p-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    size = 'md',
    variant = 'primary',
    type = 'button',
    tooltip,
    tooltipPlace = 'top',
    tooltipVariant = 'dark',
    tooltipOpenOnClick = false,
    ...props
  },
  ref,
) {
  const tooltipId = useId()
  const hasTooltip = Boolean(tooltip)

  return (
    <>
      <button
        ref={ref}
        type={type}
        data-tooltip-id={hasTooltip ? tooltipId : undefined}
        data-tooltip-content={hasTooltip ? tooltip : undefined}
        className={classNames(
          'inline-flex items-center justify-center gap-2 font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 disabled:cursor-not-allowed disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
      {hasTooltip ? (
        <Tooltip
          id={tooltipId}
          place={tooltipPlace}
          variant={tooltipVariant}
          openOnClick={tooltipOpenOnClick}
        />
      ) : null}
    </>
  )
})