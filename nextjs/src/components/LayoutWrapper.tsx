import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import logo from '../../public/logo2.png'
import logo2 from '../../public/logo3.png'

type Props = {
    children: React.ReactNode
}

const LayoutWrapper: React.FC<Props> = ({ children }) => {
    const router = useRouter()
    return (
        <div className='chuni-log-bg'>
            <div id='container'>
                <div className='mb-2 w-fit mx-auto'>
                    <Link href={router.pathname === '/home' ? 'https://chunithm-net-eng.com/mobile/home' : '/home'}>
                        <div className='relative mx-auto  max-w-[400px] overflow-hidden'>
                            <Image priority className='w-full' style={{ objectFit: 'contain' }} alt='chunithm-2' src={logo2}  ></Image>
                            <div className='cursor-pointer absolute absolute_center bottom-10'>
                                <Image className='w-full' style={{ objectFit: 'contain' }} alt='chunithm' src={logo} ></Image>
                            </div>
                        </div>
                    </Link>
                </div>
                {children}

            </div>
        </div>
    )
}
export default LayoutWrapper