import Image from 'next/image'
import React from 'react'

type Props = {}

export default function LoadingView({ }: Props) {
    return (
        <div className='absolute_center w-16'>
            <div className='animate-spin'>
                <Image alt='loading' width={100} height={100} priority src={'/pen_sleep_apng.png'} style={{ objectFit: 'contain' }} />
            </div>
        </div>
    )
}