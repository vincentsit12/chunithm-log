import Image from 'next/image'
import React from 'react'
import loadingPic from 'assets/pen_sleep_apng.png'

type Props = {}

export default function LoadingView({ }: Props) {
    return (
        <div className='absolute_center  w-32	'>
            <div className='animate-spin'>

                <Image alt='loading' className="w-full" src={'/pen_sleep_apng.png'} height={100} width={60} objectFit='contain' />
            </div>

        </div>
    )
}