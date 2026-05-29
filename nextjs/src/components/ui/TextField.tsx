import classNames from 'classnames'
import { forwardRef, InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={classNames(
        'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-fuchsia-400/60 focus:ring-4 focus:ring-fuchsia-500/10',
        className,
      )}
      {...props}
    />
  )
})