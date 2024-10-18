import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import logo3 from '../../public/logo3.webp'
import logo2 from '../../public/logo2.webp'

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
                            <Image className='w-full' style={{ objectFit: 'contain' }} alt='chunithm-2' src={logo3}  ></Image>
                            <div className='cursor-pointer absolute' style={{
                                left: "50%",
                                transform: "translateX(-50%)",
                                bottom: 0,
                            }}>
                                <Image className='w-full' style={{ objectFit: 'contain' }} alt='chunithm' src={logo2} ></Image>
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