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
        <div id='container'>
            <div style={{ 'margin': '3.125rem auto' }}>
                <div className='mb20 tc'>
                    <div className=''>
                        <Link href={router.pathname === '/home' ? 'https://chunithm-net-eng.com/mobile/record/musicGenre/master' : '/home'}>
                            <a>
                                <Image alt='chunithm' src={'/logo2.png'} height={200} width={400} ></Image>
                            </a>
                        </Link>
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
}
export default LayoutWrapper