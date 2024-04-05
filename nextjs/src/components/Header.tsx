import classNames from 'classnames'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

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
                    <li><Link href={haveSession ? '/home' : '/login'} onClick={(e) => {
                        setActive(false)
                    }}>{haveSession ? 'Home' : 'Login'}</Link></li>
                    <li><Link href={'/song'} onClick={(e) => {
                        setActive(false)
                    }}>Song List</Link></li>
                    <li><Link href={'https://chuni-rt.io.kookiym.com/'}
                        onClick={(e) => {
                            setActive(false)
                        }}>Stats</Link></li>
                    <li><Link href={'/playground'}
                        onClick={(e) => {
                            setActive(false)
                        }}>Playground</Link></li>
                    <li><Link href={'/playground/guess_song_game/rooms'}
                        onClick={(e) => {
                            setActive(false)
                        }}>Guess Song Game</Link></li>

                    {session?.user.isAdmin && <li><Link href={'/song/manage'}
                        onClick={(e) => {
                            setActive(false)
                        }}>Song Management</Link></li>}
                    {haveSession && <li><Link href={'/'} onClick={(e) => {
                        e.preventDefault()
                        setActive(false)
                        signOut()
                    }}>Logout</Link></li>}
                </ul>
            </nav>
        </header>
    )
}

export default Header