import classNames from 'classnames'
import { HTMLAttributes } from 'react'

type SurfaceProps = HTMLAttributes<HTMLDivElement>

export function Surface({ className, ...props }: SurfaceProps) {
  return (
    <div
      className={classNames(
        'rounded-[2rem] border border-violet-400/20 bg-brand-panel/78 text-slate-100 shadow-glow ring-1 ring-white/10 backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  )
}