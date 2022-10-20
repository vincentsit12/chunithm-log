import LoadingView from 'components/LoadingView';
import e from 'cors';
import { signIn, SignInResponse, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import { useUserContext } from '../../provider/UserProvider';

import Image from 'next/image'


export default function Blank() {
    const router = useRouter()
    const { data: session, status } = useSession()

    useEffect(() => {

        if (status === "authenticated") {
            router.replace('/home')
        }
        else if (status === "unauthenticated")
            router.replace('/login')

    }, [status, router])



    return (
        <div className="h-screen w-screen flex justify-center items-center">
            <span className='bouncing text-6xl delay-1'>C</span>
            <span className='bouncing text-6xl delay-2'>H</span>
            <span className='bouncing text-6xl delay-3'>U</span>
            <span className='bouncing text-6xl delay-4'>N</span>
            <span className='bouncing text-6xl delay-5'>I</span>
            <span className='bouncing text-6xl delay-6'>L</span>
            <span className='bouncing text-6xl delay-7'>O</span>
            <span className='bouncing text-6xl delay-8'>G</span>
            <div className='relative bouncing  delay-9 h-24 w-14'>
                <Image alt='loading' src={'/pen_sleep_apng.png'} layout='fill' objectFit='contain' />
            </div>

        </div>  


    )
}