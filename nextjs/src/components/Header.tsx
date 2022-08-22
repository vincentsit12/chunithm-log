import classNames from 'classnames'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import React, { useState } from 'react'

type Props = {}

const Header = (props: Props) => {
    const [active, setActive] = useState(false)
    const { data: session, status } = useSession()

    return (
        <header id='header'>
            <div className={classNames('header-menu', { 'active': active })}>
                <a className='menu-trigger' onClick={() => {
                    setActive(!active)
                }}>
                    <span></span>
                    <span></span>
                    <span></span>
                </a>
            </div>
            <nav className={classNames('nav-dropmenu', { animation: active })}>
                <ul>
                    {session && <li><Link href={'/home'}><a onClick={(e) => {
                        setActive(false)
                    }}>Home</a></Link></li>}
                    <li><Link href={'/song'}><a onClick={(e) => {
                        setActive(false)
                    }}>Song List</a></Link></li>
                    <li><Link href={'/home'}><a onClick={(e) => {
                        e.preventDefault()
                        setActive(false)
                    }}>Playground</a></Link></li>
                    {session && <li><Link href={'/'}><a onClick={(e) => {
                        e.preventDefault()
                        setActive(false)
                        signOut()
                    }}>Logout</a></Link></li>}
                </ul>
            </nav>
        </header>
    )
}

export default Header