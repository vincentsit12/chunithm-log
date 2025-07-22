import Image from 'next/image'
import React from 'react'
import loadingPic from '../../public/pen_sleep_apng.png'


type Props = {
    // isOpen: boolean,
    // setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
    // closeModal?: () => void
    // rightBtnCallBack?: () => void
    // showButton?: boolean
    // title?: string,
    // children: React.ReactNode
    // closeWhenClickBackDrop?: boolean
}

export function AnnouncementView({ }: Props) {
    return (
        <div className='z-[100000] w-16 breaking fixed' style={{
            top: '-100px',
            left: "50%",
            transformOrigin: "center"
        }} >
            <div className=''>
                <Image alt='loading' priority className="w-full" src={loadingPic} style={{ objectFit: 'contain' }} />
            </div>

        </div>
    )
}