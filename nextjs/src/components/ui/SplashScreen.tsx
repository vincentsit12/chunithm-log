import Image from 'next/image'
import { BackdropScene } from '@/components/ui/BackdropScene'

const letters = ['C', 'H', 'U', 'N', 'I', 'L', 'O', 'G']

export function SplashScreen() {
  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden px-6'>
      <BackdropScene />
      <div className='relative z-10 rounded-[2rem] border border-violet-400/20 bg-brand-panel/80 px-8 py-10 shadow-glow ring-1 ring-white/10 backdrop-blur-xl'>
        <div className='flex flex-wrap items-center justify-center gap-1 sm:gap-2'>
          {letters.map((letter, index) => (
            <span
              key={letter + index}
              className='bg-gradient-to-b from-white via-fuchsia-200 to-cyan-200 bg-clip-text text-5xl font-black tracking-wide text-transparent sm:text-6xl'
              style={{ animation: `bounce 1.2s ease-in-out ${index * 0.08}s infinite` }}
            >
              {letter}
            </span>
          ))}
          <div className='relative ml-2 h-24 w-14' style={{ animation: 'bounce 1.2s ease-in-out 0.72s infinite' }}>
            <Image loading='eager' alt='loading' src={'/pen_sleep_apng.png'} fill style={{ objectFit: 'contain' }} />
          </div>
        </div>
      </div>
    </div>
  )
}