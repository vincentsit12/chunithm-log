export function BackdropScene() {
  return (
    <div className='pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(82,43,146,0.85),_rgba(19,22,46,0.98)_34%,_rgba(11,15,33,1)_68%,_rgba(7,10,24,1)_100%)]'>
      <div className='absolute -left-24 top-8 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl' />
      <div className='absolute right-[-4rem] top-[-2rem] h-[26rem] w-[26rem] rounded-full bg-cyan-400/18 blur-3xl' />
      <div className='absolute bottom-[-5rem] left-1/3 h-96 w-96 rounded-full bg-violet-500/16 blur-3xl' />
      <div className='absolute inset-0 bg-[linear-gradient(135deg,rgba(124,58,237,0.07),transparent_38%,rgba(34,211,238,0.06)_68%,transparent)]' />
      <div className='absolute inset-x-0 top-0 h-px bg-white/15' />
    </div>
  )
}