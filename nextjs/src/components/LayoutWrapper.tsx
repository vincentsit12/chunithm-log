import React from 'react'
import logo from 'assets/logo.png'
import Image from 'next/image'
type Props = {
    children: React.ReactNode
}

const LayoutWrapper: React.FC<Props> = ({ children }) => {
    return (
        <div id='container'>
            <div className='mb20 tc'>
                <Image src={logo} ></Image>
            </div>
            {children}
        </div>
    )
}
export default LayoutWrapper