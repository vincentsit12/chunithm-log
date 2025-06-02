import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import logo_art from '../../public/logo_art.webp'
import logo_version from '../../public/logo_version.webp'

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
                        <div className='relative mx-auto  max-w-[300px]'>
                            <Image loading="eager" className='w-full' style={{ objectFit: 'contain' }} alt='chunithm-2' src={logo_art}  ></Image>
                            <div className='cursor-pointer absolute' style={{
                                left: "50%",
                                transform: "translateX(-50%)",
                                bottom: 0,
                            }}>
                                <Image loading="eager" className='w-full' style={{ objectFit: 'contain' }} alt='chunithm' src={logo_version} ></Image>
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