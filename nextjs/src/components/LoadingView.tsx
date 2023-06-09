import Image from 'next/image'
import React from 'react'
import loadingPic from '../../public/pen_sleep_apng.png'

type Props = {}

export default function LoadingView({ }: Props) {
    return (
        <div className='absolute_center  w-16	'>
            <div className='animate-spin'>

                <Image alt='loading' className="w-full" src={loadingPic}  style={{objectFit :'contain'}} />
            </div>

        </div>
    )
}