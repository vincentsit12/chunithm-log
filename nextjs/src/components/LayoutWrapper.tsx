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
        <div id='container'>
            <div style={{ 'margin': '3.125rem auto' }}>
                <div className='mb-2 tc'>
                    <div className=''>
                        <Link href={router.pathname === '/home' ? 'https://chunithm-net-eng.com/mobile/home' : '/home'}>
                            <div className='relative'>
                                <Image className='cursor-pointer ' objectFit='contain' alt='chunithm-2' src={logo2} height={200} width={400} ></Image>
                                <div className='cursor-pointer absolute absolute_center bottom-2'>
                                    <Image objectFit='contain' alt='chunithm' src={logo} height={200} width={200} ></Image>
                                </div>

                            </div>
                        </Link>
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
}
export default LayoutWrapper