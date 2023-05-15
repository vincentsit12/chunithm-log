import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import logo from '../../public/logo2.png'
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
                            <Image className='cursor-pointer'  objectFit='contain'  alt='chunithm' src={logo} height={200} width={400} ></Image>
                        </Link>
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
}
export default LayoutWrapper