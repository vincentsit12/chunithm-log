import classNames from 'classnames'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

type Props = {}

const Header = (props: Props) => {
    const [active, setActive] = useState(false)
    const { data: session, status } = useSession()
    const router = useRouter()
    const haveSession = (session && router.pathname !== '/login' && router.pathname !== '/signup')
    return (
        <header id='header'>
            <div className={classNames('header-menu', { 'active': active })}>
                <div className='menu-trigger' onClick={() => {
                    setActive(!active)
                }}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <nav className={classNames('nav-dropmenu', { animation: active })}>
                <ul>
                    <li><Link href={haveSession ? '/home' : '/login'}><a onClick={(e) => {
                        setActive(false)
                    }}>{haveSession ? 'Home' : 'Login'}</a></Link></li>
                    <li><Link href={'/song'}><a onClick={(e) => {
                        setActive(false)
                    }}>Song List</a></Link></li>
                    <li><Link href={'/playground'}><a onClick={(e) => {
                        // e.preventDefault()
                        setActive(false)
                    }}>Playground</a></Link></li>
                    {haveSession && <li><Link href={'/'}><a onClick={(e) => {
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