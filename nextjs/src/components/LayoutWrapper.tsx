import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'

type Props = {
    children: React.ReactNode
}

const LayoutWrapper: React.FC<Props> = ({ children }) => {
    const router = useRouter()
    return (
        <>
            <div id='container'>
                <div className='mb-2 w-fit mx-auto'>
                    <Link href={router.pathname === '/home' ? 'https://chunithm-net-eng.com/mobile/home' : '/home'}>
                        <div className='relative mx-auto w-96 aspect-video' >
                            <Image fill alt='chunithm-2' src={"/logo_art.webp"} sizes='100vw' style={{ objectFit: 'contain', }} ></Image>
                            <div className='cursor-pointer absolute w-40 aspect-video' style={{
                                left: "50%",
                                transform: "translateX(-50%)",
                                bottom: 0,
                            }}>
                                <Image fill sizes='100vw' style={{ objectFit: 'contain' }} alt='chunithm' src={"/logo_version.webp"} ></Image>
                            </div>
                        </div>

                    </Link>
                </div>
                {children}

            </div>
            <div className='chuni-log-bg'></div>
        </>
    )
}
export default LayoutWrapper