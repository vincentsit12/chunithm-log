import React from 'react'
import Image from 'next/image'
type Props = {
    children: React.ReactNode
}

const LayoutWrapper: React.FC<Props> = ({ children }) => {
    return (
        <div id='container'>
            <div className='mb20 tc'>
                <Image src={'/logo2.png'} height={200} width={400} ></Image>
            </div>
            {children}
        </div>
    )
}
export default LayoutWrapper