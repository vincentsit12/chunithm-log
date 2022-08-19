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
            <div className='mb20 tc'>
                <div className='cursor-pointer'>
                    <Link href={'/'}>
                        <a>
                            <Image src={'/logo2.png'} height={200} width={400} ></Image>
                        </a>
                    </Link>
                </div>
            </div>
            {children}
        </div>
    )
}
export default LayoutWrapper